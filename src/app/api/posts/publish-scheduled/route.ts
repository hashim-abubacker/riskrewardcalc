import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * API endpoint to publish scheduled posts
 * This should be called periodically by a cron job
 * It finds all posts where scheduledFor is in the past and published is false
 * and publishes them
 */
export async function GET() {
    try {
        const now = new Date();

        // Find all posts that are scheduled to be published and haven't been published yet
        const scheduledPosts = await prisma.post.findMany({
            where: {
                published: false,
                scheduledFor: {
                    lte: now, // Less than or equal to now
                    not: null,
                },
            },
        });

        if (scheduledPosts.length === 0) {
            return NextResponse.json({
                message: "No posts to publish",
                count: 0
            });
        }

        // Publish all scheduled posts
        const publishedPostIds = [];
        for (const post of scheduledPosts) {
            await prisma.post.update({
                where: { id: post.id },
                data: {
                    published: true,
                    publishedAt: now,
                },
            });
            publishedPostIds.push(post.id);
        }

        return NextResponse.json({
            message: `Published ${publishedPostIds.length} post(s)`,
            count: publishedPostIds.length,
            postIds: publishedPostIds,
        });
    } catch (error) {
        console.error("Error publishing scheduled posts:", error);
        return NextResponse.json(
            { error: "Failed to publish scheduled posts" },
            { status: 500 }
        );
    }
}
