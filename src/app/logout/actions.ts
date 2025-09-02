'use server';

import { destroyUserSession } from "@/app/auth/core/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logout() {
    try {
        // Destroy the user session
        await destroyUserSession(await cookies());
        
        // Redirect to login page
        redirect('/login');
    } catch (error) {
        console.error('Logout error:', error);
        // Even if there's an error, redirect to login
        redirect('/login');
    }
}
