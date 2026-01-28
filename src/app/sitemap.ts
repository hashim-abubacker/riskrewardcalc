import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://riskrewardcalc.com';

    // Get all published blog posts (with error handling for initial deployment)
    let blogUrls: MetadataRoute.Sitemap = [];
    try {
        const posts = await prisma.post.findMany({
            where: { published: true },
            select: {
                slug: true,
                updatedAt: true,
            },
        });

        blogUrls = posts.map((post) => ({
            url: `${baseUrl}/blog/${post.slug}`,
            lastModified: post.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }));
    } catch (error) {
        // If database tables don't exist yet, just skip blog URLs
        console.log('Skipping blog URLs in sitemap (database not initialized yet)');
    }

    // Static pages
    const staticPages = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 1.0,
        },
        {
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        },
        {
            url: `${baseUrl}/faq`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        },
    ];

    return [...staticPages, ...blogUrls];
}
