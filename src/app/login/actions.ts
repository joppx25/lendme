'use server';

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { verifyPassword } from "../auth/core/hasher";
import { env } from "process";
import { createUserSession } from "../auth/core/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const loginSchema = z.object({
    email: z.string('Email is required').email('Invalid email format'),
    password: z.string('Password is required').min(6, 'Password must be at least 6 characters'),
});

export async function login(state: any, formData: FormData) {
    const validatedField = loginSchema.safeParse(Object.fromEntries(formData));

    if (!validatedField.success) {
        return {
            success: false,
            errors: validatedField.error.flatten().fieldErrors,
        }
    }

    const { email, password } = validatedField.data;

    const user = await prisma.users.findUnique({
        where: {
            email,
        }
    });

    if (!user) {
        return {
            success: false,
            message: "User not found",
        }
    }

    if (!env.AUTH_SECRET) {
        return {
            success: false,
            message: "Authentication secret is not set",
        }
    }

    const isPasswordValid = await verifyPassword(password, user.password, user.salt);

    if (!isPasswordValid) {
        return {
            success: false,
            message: "Invalid password",
        }
    }
    
    await createUserSession(user, await cookies());

    // Redirect to dashboard after successful login
    redirect('/dashboard');
}