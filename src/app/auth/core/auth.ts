import { Role, Status } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { redis } from "@/lib/redis";

const SESSION_EXPIRATION_TIME = 60 * 60 * 24 * 30; // 30 days
const SESSION_COOKIE_NAME = 'sessionToken-v1';

const sessionSchema = z.object({
    id: z.string(),
    role: z.enum(Role),
    name: z.string(),
    email: z.string(),
    phoneNo: z.string(),
    address: z.string(),
    dob: z.string(),
    status: z.enum(Status)
});

type User = z.infer<typeof sessionSchema>;

export type Cookies = {
    get: (name: string) => { name: string, value: string } | undefined;
    set: (name: string, value: string, options: { httpOnly: boolean; secure: boolean; maxAge: number; path: string; expires: Date; sameSite: 'lax' | 'strict' | 'none' }) => void;
    delete: (name: string) => void;
}

export async function createUserSession(user: User, cookies: Cookies) {
    const sessionToken = crypto.randomUUID();
    redis.set(`session:${sessionToken}`, JSON.stringify(sessionSchema.parse(user)), 'EX', SESSION_EXPIRATION_TIME);

    setCookie(sessionToken, cookies);
}

function setCookie(sessionToken: string, cookies: Pick<Cookies, 'set'>) {
    cookies.set(SESSION_COOKIE_NAME, sessionToken, {
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: SESSION_EXPIRATION_TIME,
        path: '/',
        expires: new Date(Date.now() + SESSION_EXPIRATION_TIME * 1000),
    });
}