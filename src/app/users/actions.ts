'use server';

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { Role, Status } from "@prisma/client";
import { generateSalt, hashPassword } from "@/app/auth/core/hasher";

interface UserUpdateState {
  success: boolean;
  message?: string;
  errors?: {
    userId?: string[];
    role?: string[];
    status?: string[];
  };
}

const userUpdateSchema = z.object({
  userId: z.string(),
  role: z.enum(['SUPERADMIN', 'MANAGER', 'BORROWER', 'GUEST']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'BLOCKED']),
});

const createUserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phoneNo: z.string().min(10, "Phone number must be at least 10 characters"),
    address: z.string().min(10, "Address must be at least 10 characters"),
    role: z.enum(['MANAGER', 'BORROWER', 'GUEST']),
    password: z.string().min(8, "Password must be at least 8 characters"),
    dob: z.string('Date of birth is required').refine((dob) => {
        const dobDate = new Date(dob);
        const age = new Date().getFullYear() - dobDate.getFullYear();
        return age >= 18;
    }, { message: "You must be at least 18 years old" }),
});

const userStatusSchema = z.object({
  userId: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'BLOCKED']),
  reason: z.string().optional(),
});

interface CreateUserState {
  success: boolean;
  message?: string;
  errors?: {
    name?: string[];
    email?: string[];
    phoneNo?: string[];
    address?: string[];
    role?: string[];
    password?: string[];
    dob?: string[];
  };
}

export async function updateUserRole(state: UserUpdateState, formData: FormData) {
  try {
    const currentUser = await getCurrentSession();
    
    if (!currentUser || !['SUPERADMIN', 'MANAGER'].includes(currentUser.role)) {
      return {
        success: false,
        message: "Unauthorized access",
      };
    }

    const validatedFields = userUpdateSchema.safeParse({
      userId: formData.get('userId'),
      role: formData.get('role'),
      status: formData.get('status'),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { userId, role, status } = validatedFields.data;

    // Check if user exists
    const targetUser = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Super admin restrictions
    if (targetUser.role === 'SUPERADMIN' && currentUser.role !== 'SUPERADMIN') {
      return {
        success: false,
        message: "Only Super Admins can modify other Super Admin accounts",
      };
    }

    // Prevent users from modifying their own role (except super admin)
    if (targetUser.id === currentUser.id && currentUser.role !== 'SUPERADMIN') {
      return {
        success: false,
        message: "You cannot modify your own role",
      };
    }

    // Manager restrictions - cannot create super admins
    if (currentUser.role === 'MANAGER' && role === 'SUPERADMIN') {
      return {
        success: false,
        message: "Managers cannot assign Super Admin role",
      };
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        role: role as Role,
        status: status as Status,
        updatedAt: new Date(),
      },
    });

    revalidatePath('/users');
    return {
      success: true,
      message: `User ${updatedUser.name} updated successfully`,
    };

  } catch (error) {
    console.error('User update error:', error);
    return {
      success: false,
      message: "Failed to update user",
    };
  }
}

interface UserStatusState {
  success: boolean;
  message?: string;
  errors?: {
    userId?: string[];
    status?: string[];
  };
}

export async function updateUserStatus(state: UserStatusState, formData: FormData) {
  try {
    const currentUser = await getCurrentSession();
    
    if (!currentUser || !['SUPERADMIN', 'MANAGER'].includes(currentUser.role)) {
      return {
        success: false,
        message: "Unauthorized access",
      };
    }

    const validatedFields = userStatusSchema.safeParse({
      userId: formData.get('userId'),
      status: formData.get('status'),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { userId, status } = validatedFields.data;

    // Check if user exists
    const targetUser = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Prevent users from suspending themselves
    if (targetUser.id === currentUser.id) {
      return {
        success: false,
        message: "You cannot change your own status",
      };
    }

    // Super admin protection
    if (targetUser.role === 'SUPERADMIN' && currentUser.role !== 'SUPERADMIN') {
      return {
        success: false,
        message: "Only Super Admins can modify other Super Admin accounts",
      };
    }

    // Update user status
    await prisma.users.update({
      where: { id: userId },
      data: {
        status: status as Status,
        updatedAt: new Date(),
      },
    });

    revalidatePath('/users');
    return {
      success: true,
      message: `User ${targetUser.name} status updated to ${status.toLowerCase()}`,
    };

  } catch (error) {
    console.error('User status update error:', error);
    return {
      success: false,
      message: "Failed to update user status",
    };
  }
}

export async function createUser(state: CreateUserState, formData: FormData) {
  try {
    const currentUser = await getCurrentSession();
    
    if (!currentUser || !['SUPERADMIN', 'MANAGER'].includes(currentUser.role)) {
      return {
        success: false,
        message: "Unauthorized access",
      };
    }

    const validatedFields = createUserSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      phoneNo: formData.get('phoneNo'),
      address: formData.get('address'),
      role: formData.get('role'),
      password: formData.get('password'),
      dob: formData.get('dob'),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { name, email, phoneNo, address, role, password, dob } = validatedFields.data;

    // Check if email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        errors: {
          email: ["Email already exists"],
        },
      };
    }

    // Manager restrictions - cannot create super admins or managers
    if (currentUser.role === 'MANAGER' && ['SUPERADMIN', 'MANAGER'].includes(role)) {
      return {
        success: false,
        message: "Managers can only create Borrower and Guest accounts",
      };
    }

    // Hash password
    const salt = generateSalt();
    const hashedPassword = await hashPassword(password, salt);

          // Create user
      const newUser = await prisma.users.create({
        data: {
          name,
          email,
          phoneNo,
          address,
          role: role as Role,
          status: 'PENDING' as Status,
          password: hashedPassword,
          salt,
          dob,
        },
      });

    revalidatePath('/users');

    return {
      success: true,
      message: `User ${newUser.name} created successfully`,
    };

  } catch (error) {
    console.error('User creation error:', error);
    return {
      success: false,
      message: "Failed to create user",
    };
  }
}

export async function deleteUser(userId: string) {
  try {
    const currentUser = await getCurrentSession();
    
    if (!currentUser || currentUser.role !== 'SUPERADMIN') {
      throw new Error('Only Super Admins can delete users');
    }

    // Check if user exists
    const targetUser = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        loans: true,
        contributions: true,
        loanPayments: true,
      },
    });

    if (!targetUser) {
      throw new Error('User not found');
    }

    // Prevent deletion of own account
    if (targetUser.id === currentUser.id) {
      throw new Error('You cannot delete your own account');
    }

    // Check for active loans
    const activeLoans = targetUser.loans.filter(loan => 
      ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE'].includes(loan.status)
    );

    if (activeLoans.length > 0) {
      throw new Error('Cannot delete user with active loans');
    }

    // Soft delete by setting status to INACTIVE
    await prisma.users.update({
      where: { id: userId },
      data: {
        status: 'INACTIVE' as Status,
        updatedAt: new Date(),
      },
    });

    revalidatePath('/users');
    return { success: true };

  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

export async function getUserActivity(userId: string) {
  try {
    const currentUser = await getCurrentSession();
    
    if (!currentUser || !['SUPERADMIN', 'MANAGER'].includes(currentUser.role)) {
      return null;
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        loans: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        contributions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        loanPayments: {
          where: {
            status: 'PAID',
          },
          orderBy: { paidDate: 'desc' },
          take: 5,
        },
      },
    });

    return user;

  } catch (error) {
    console.error('Error getting user activity:', error);
    return null;
  }
}

interface ResetUserPasswordState {
  success: boolean;
  message?: string;
  errors?: {
    newPassword?: string[];
  };
}

export async function resetUserPassword(state: ResetUserPasswordState, formData: FormData) {
  try {
    const currentUser = await getCurrentSession();
    
    if (!currentUser || !['SUPERADMIN', 'MANAGER'].includes(currentUser.role)) {
      return {
        success: false,
        message: "Unauthorized access",
      };
    }

    const userId = formData.get('userId') as string;
    const newPassword = formData.get('newPassword') as string;

    if (!newPassword || newPassword.length < 8) {
      return {
        success: false,
        errors: {
          newPassword: ["Password must be at least 8 characters"],
        },
      };
    }

    const targetUser = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Super admin protection
    if (targetUser.role === 'SUPERADMIN' && currentUser.role !== 'SUPERADMIN') {
      return {
        success: false,
        message: "Only Super Admins can reset other Super Admin passwords",
      };
    }

    const hashedPassword = await hashPassword(newPassword, targetUser.salt);

    await prisma.users.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    revalidatePath('/users');
    return {
      success: true,
      message: `Password reset successfully for ${targetUser.name}`,
    };

  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      message: "Failed to reset password",
    };
  }
}
