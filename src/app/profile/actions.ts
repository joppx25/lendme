'use server';

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redis } from "@/lib/redis";
import { SESSION_COOKIE_NAME, sessionSchema } from "@/app/auth/core/auth";
import { cookies } from "next/headers";
import { hashPassword } from "../auth/core/hasher";

const profileUpdateSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
  phoneNo: z.string().regex(
    /^(\+639|09)\d{9}$/,
    'Phone number must be in format +639XXXXXXXXX or 09XXXXXXXXX'
  ),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  dob: z.string().refine((dob) => {
    const dobDate = new Date(dob);
    const age = new Date().getFullYear() - dobDate.getFullYear();
    return age >= 18;
  }, { message: "You must be at least 18 years old" }),
});

interface ProfileUpdateState {
  success: boolean;
  message?: string;
  errors?: {
    name?: string[];
    email?: string[];
    phoneNo?: string[];
    address?: string[];
    dob?: string[];
  };
}

export async function updateProfile(state: ProfileUpdateState, formData: FormData) {
  try {
    const currentUser = await getCurrentSession();
    
    if (!currentUser) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    const validatedFields = profileUpdateSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      phoneNo: formData.get('phoneNo'),
      address: formData.get('address'),
      dob: formData.get('dob'),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { name, email, phoneNo, address, dob } = validatedFields.data;

    // Check if email is already taken by another user
    if (email !== currentUser.email) {
      const existingUser = await prisma.users.findUnique({
        where: { email },
      });

      if (existingUser) {
        return {
          success: false,
          errors: {
            email: ["Email is already taken by another user"],
          },
        };
      }
    }

    // Update user in database
    const updatedUser = await prisma.users.update({
      where: { id: currentUser.id },
      data: {
        name,
        email,
        phoneNo,
        address,
        dob,
      },
    });

    // Update session in Redis with new user data
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    
    if (sessionCookie) {
      const updatedSessionData = {
        ...currentUser,
        name: updatedUser.name,
        email: updatedUser.email,
        phoneNo: updatedUser.phoneNo,
        address: updatedUser.address,
        dob: updatedUser.dob,
      };
      
      await redis.set(
        `session:${sessionCookie.value}`, 
        JSON.stringify(sessionSchema.parse(updatedSessionData)),
        { ex: 60 * 60 * 24 * 30 } // 30 days
      );
    }

    revalidatePath('/profile');
    return {
      success: true,
      message: "Profile updated successfully",
    };

  } catch (error) {
    console.error('Profile update error:', error);
    return {
      success: false,
      message: "Failed to update profile",
    };
  }
}

interface ChangePasswordState {
  success: boolean;
  message?: string;
  errors?: {
    newPassword?: string[];
  };
}


const ChangePasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function changePassword(state: ChangePasswordState, formData: FormData) {
  try {
    const currentUser = await getCurrentSession();
    console.log('Form data', formData);
    if (!currentUser) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    const validatedFields = ChangePasswordSchema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const user = await prisma.users.findUnique({
      where: { id: currentUser.id },
      select: { salt: true },
    });
    
    const { newPassword } = validatedFields.data;

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const hashedPassword = await hashPassword(newPassword, user.salt);

    await prisma.users.update({
      where: { id: currentUser.id },
      data: { password: hashedPassword },
    });

    revalidatePath('/profile');
    return {
      success: true,
      message: "Password changed successfully",
    };
  } catch (error) {
    console.error('Change password error:', error);
    return {
      success: false,
      message: "Failed to change password",
    };
  }
}
