import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
    try {
        const faqs = await prisma.fAQ.findMany({
            orderBy: { order: "asc" },
        });
        return NextResponse.json(faqs);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch FAQs" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { question, answer, order } = body;

        const faq = await prisma.fAQ.create({
            data: {
                question,
                answer,
                order: order || 0,
            },
        });

        return NextResponse.json(faq);
    } catch (error) {
        console.error("Create FAQ error:", error);
        return NextResponse.json({ error: "Failed to create FAQ" }, { status: 500 });
    }
}
