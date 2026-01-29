"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

// ONE-TIME admin user creation endpoint
// DELETE THIS FILE after the admin user has been created!
export async function GET(request: Request) {
    // Security: Check for a secret key in the query params
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    // Only allow with correct secret
    if (secret !== "create-admin-now-2026") {
        return NextResponse.json(
            { error: "Unauthorized. Provide correct secret." },
            { status: 401 }
        );
    }

    try {
        const email = "hashimta123@hotmail.com";
        const password = "Admin@123";
        const hashedPassword = await bcrypt.hash(password, 12);

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            // Update password if user exists
            await prisma.user.update({
                where: { email },
                data: { password: hashedPassword },
            });

            return NextResponse.json({
                success: true,
                message: "Admin user password has been reset!",
                email: email,
                note: "DELETE this API route file after use!",
            });
        }

        // Create new admin user
        const user = await prisma.user.create({
            data: {
                email,
                name: "Admin",
                password: hashedPassword,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Admin user created successfully!",
            email: email,
            userId: user.id,
            note: "DELETE this API route file after use!",
        });
    } catch (error) {
        console.error("Error creating admin:", error);
        return NextResponse.json(
            { error: "Failed to create admin user", details: String(error) },
            { status: 500 }
        );
    }
}
