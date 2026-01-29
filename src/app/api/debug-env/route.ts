import { NextResponse } from 'next/server';

// Temporary debug route - DELETE after debugging!
export async function GET() {
    return NextResponse.json({
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'SET' : 'MISSING',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
        NODE_ENV: process.env.NODE_ENV || 'not set',
        PORT: process.env.PORT || 'not set',
    });
}
