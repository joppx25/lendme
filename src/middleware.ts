import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, sessionSchema } from "@/app/auth/core/auth";
import { redis } from "@/lib/redis";

export default async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    const cookies = req.cookies.get(SESSION_COOKIE_NAME);
    if (!cookies) {
        return NextResponse.redirect(new URL('/login', req.url));
    }
    
    const rawSessionData = await redis.get(`session:${cookies.value}`);
    if (!rawSessionData) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    const sessionData = sessionSchema.parse(rawSessionData);

    console.log('sessionData', sessionData.role);
    
    return NextResponse.next();
}