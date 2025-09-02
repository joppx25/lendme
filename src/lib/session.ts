import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, sessionSchema } from "@/app/auth/core/auth";
import { redis } from "@/lib/redis";
import { User } from "@/store/authStore";

export async function getCurrentSession(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    
    if (!sessionCookie) {
      return null;
    }

    const rawSessionData = await redis.get(`session:${sessionCookie.value}`);
    
    if (!rawSessionData) {
      return null;
    }

    const sessionData = sessionSchema.parse(rawSessionData);
    return sessionData;
  } catch (error) {
    console.error("Error getting current session:", error);
    return null;
  }
}
