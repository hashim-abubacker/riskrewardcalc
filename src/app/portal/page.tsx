import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function PortalDashboard() {
    const session = await auth();

    // Get counts
    const postsCount = await prisma.post.count();
    const publishedCount = await prisma.post.count({ where: { published: true } });
    const faqCount = await prisma.fAQ.count();

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                    Welcome back, {session?.user?.name || "Admin"}!
                </h1>
                <p className="text-gray-400">Manage your content from the dashboard below.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Blog Posts */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-400">Blog Posts</h3>
                        <span className="text-2xl">📝</span>
                    </div>
                    <div className="space-y-2">
                        <p className="text-3xl font-bold text-white">{postsCount}</p>
                        <p className="text-xs text-emerald-500">{publishedCount} published</p>
                    </div>
                    <Link
                        href="/portal/blog"
                        className="mt-4 block text-sm text-emerald-500 hover:text-emerald-400 transition-colors"
                    >
                        Manage Blog →
                    </Link>
                </div>

                {/* FAQs */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-400">FAQs</h3>
                        <span className="text-2xl">❓</span>
                    </div>
                    <div className="space-y-2">
                        <p className="text-3xl font-bold text-white">{faqCount}</p>
                        <p className="text-xs text-gray-500">Total questions</p>
                    </div>
                    <Link
                        href="/portal/faq"
                        className="mt-4 block text-sm text-emerald-500 hover:text-emerald-400 transition-colors"
                    >
                        Manage FAQs →
                    </Link>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-500/20 border border-emerald-500/30 rounded-xl p-6">
                    <h3 className="text-sm font-medium text-emerald-400 mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                        <Link
                            href="/portal/blog/new"
                            className="block text-sm text-white hover:text-emerald-400 transition-colors"
                        >
                            + New Blog Post
                        </Link>
                        <Link
                            href="/portal/faq/new"
                            className="block text-sm text-white hover:text-emerald-400 transition-colors"
                        >
                            + New FAQ
                        </Link>
                        <Link
                            href="/"
                            className="block text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            → View Public Site
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
