import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, sessionSchema } from "@/app/auth/core/auth";
import { redis } from "@/lib/redis";

export default async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Skip middleware for static assets and API routes
    if (pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/favicon.ico')) {
        return NextResponse.next();
    }

    const cookies = req.cookies.get(SESSION_COOKIE_NAME);
    let isAuthenticated = false;
    
    // Check if user is authenticated
    if (cookies) {
        try {
            const rawSessionData = await redis.get(`session:${cookies.value}`);
            if (rawSessionData) {
                const sessionData = sessionSchema.parse(rawSessionData);
                isAuthenticated = true;
                console.log('sessionData', sessionData);
            }
        } catch (error) {
            console.error('Session validation error:', error);
            // Clear invalid session cookie if needed
        }
    }

    // Redirect authenticated users away from auth pages to dashboard
    if (isAuthenticated && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Allow unauthenticated users to access auth pages and home page
    if (!isAuthenticated && (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname === '/')) {
        return NextResponse.next();
    }

    // Redirect unauthenticated users to login for protected routes
    if (!isAuthenticated) {
        return NextResponse.redirect(new URL('/login', req.url));
    }
    
    return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Now includes auth pages since we handle auth redirects in middleware
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}