'use server'

import { prisma } from "@/lib/prisma";
import { Status, Role } from "@/generated/prisma";
import { z } from "zod";
import { generateSalt, hashPassword } from "@/app/auth/core/hasher";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const signupSchema = z.object({
    email: z.string('Email is required').email('Invalid email format'),
    password: z.string('Password is required').min(8, 'Password must be at least 8 characters'),
    name: z.string('Name is required').min(3, 'Name must be at least 3 characters'),
    dob: z.string('Date of birth is required').refine((dob) => {
        const dobDate = new Date(dob);
        const age = new Date().getFullYear() - dobDate.getFullYear();
        return age >= 18;
    }, { message: "You must be at least 18 years old" }),
    phoneNo: z.string('Phone number is required').regex(
        /^(\+639|09)\d{9}$/,
        'Phone number must be in format +639XXXXXXXXX or 09XXXXXXXXX'
    ),
    address: z.string('Address is required').min(10, 'Address must be at least 10 characters'),
})

export async function signup(state: any,formData: FormData) {

    try {
    const validatedField = signupSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
        name: formData.get('name'),
        dob: formData.get('dob'),
        phoneNo: formData.get('phoneNo'),
        address: formData.get('address'),
    })

    if (!validatedField.success) {
        return {
            success: false,
            errors: validatedField.error.flatten().fieldErrors,
        }
    }

    const { email, password, name, dob, phoneNo, address } = validatedField.data;

    const existingUser = await prisma.users.findUnique({
        where: {
            email,
        }
    })

    console.log('existingUser', existingUser);

    if (existingUser) {
        return {
            success: false,
            errors: {
                email: "Email already exists",
            }
        }
    }

    const salt = generateSalt();
    const hashedPassword = hashPassword(password, salt);

    const user = await prisma.users.create({
        data: {
            email,
            password: hashedPassword,
            name,
            dob,
            phoneNo,
            address,
            status: Status.PENDING,
            role: Role.BORROWER,
            salt,
        }
    });

    if (!user) {
        return {
            success: false,
            message: "Failed to create user",
        }
    }

    // Redirect to login page after successful registration
    revalidatePath('/login');
    redirect('/login?message=Account created successfully. Please log in.');
    
    } catch (error) {
        return {
            success: false,
            message: "Failed to create user",
            errors: error instanceof Error ? error.message : error
        }
    }
}