import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Always return success to prevent email enumeration
        if (!user) {
            return NextResponse.json({ message: "If the email exists, a reset link will be sent" });
        }

        // Generate reset token
        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 3600000); // 1 hour

        // Delete any existing tokens for this email
        await prisma.passwordResetToken.deleteMany({
            where: { email },
        });

        // Create new token
        await prisma.passwordResetToken.create({
            data: {
                email,
                token,
                expires,
            },
        });

        // In production, you would send an email here
        // For now, we'll log the reset link to console
        const resetUrl = `${process.env.NEXTAUTH_URL}/portal/auth/reset-password?token=${token}`;

        console.log("\n=================================");
        console.log("PASSWORD RESET LINK:");
        console.log(resetUrl);
        console.log("=================================\n");

        return NextResponse.json({ message: "If the email exists, a reset link will be sent" });
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
