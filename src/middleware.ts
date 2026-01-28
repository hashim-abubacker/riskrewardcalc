import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow auth-related routes to pass through
    if (pathname.startsWith("/portal/auth") || pathname.startsWith("/api/auth")) {
        return NextResponse.next();
    }

    // Protect /portal routes
    if (pathname.startsWith("/portal")) {
        // Check if user has session cookie (NextAuth v4 cookie names)
        const sessionToken =
            request.cookies.get("next-auth.session-token") ||
            request.cookies.get("__Secure-next-auth.session-token");

        if (!sessionToken) {
            return NextResponse.redirect(new URL("/portal/auth/signin", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/portal/:path*"],
};
