import { NextResponse } from "next/server";

// Debug endpoint to check email configuration (remove in production after debugging)
export async function GET() {
    return NextResponse.json({
        emailConfig: {
            host: process.env.EMAIL_SERVER_HOST || 'NOT SET',
            port: process.env.EMAIL_SERVER_PORT || 'NOT SET',
            user: process.env.EMAIL_SERVER_USER ? 'SET (' + process.env.EMAIL_SERVER_USER.substring(0, 5) + '...)' : 'NOT SET',
            password: process.env.EMAIL_SERVER_PASSWORD ? 'SET (length: ' + process.env.EMAIL_SERVER_PASSWORD.length + ')' : 'NOT SET',
            from: process.env.EMAIL_FROM || 'NOT SET',
        },
        timestamp: new Date().toISOString(),
    });
}
