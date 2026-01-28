import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
    title: "Blog - RiskRewardCalc",
    description: "Trading insights, risk management strategies, and updates from RiskRewardCalc.",
};

export default async function BlogIndexPage() {
    const posts = await prisma.post.findMany({
        where: { published: true },
        orderBy: { publishedAt: "desc" },
    });

    return (
        <div className="min-h-screen bg-[#09090B]">
            <div className="max-w-4xl mx-auto px-4 py-16">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">Trading <span className="text-[#10B981]">Insights</span></h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Master the art of risk management with our latest articles, guides, and trading strategies.
                    </p>
                </div>

                {posts.length === 0 ? (
                    <div className="text-center py-12 border border-[#27272A] rounded-2xl bg-[#18181b]/50">
                        <p className="text-gray-500">No published posts yet. Check back soon!</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {posts.map((post) => (
                            <Link
                                key={post.id}
                                href={`/blog/${post.slug}`}
                                className="group block bg-[#18181b] border border-[#27272A] rounded-2xl overflow-hidden hover:border-[#10B981]/50 transition-all duration-300"
                            >
                                <div className="flex flex-col md:flex-row">
                                    {/* Featured Image */}
                                    {post.featuredImage && (
                                        <div className="w-full md:w-1/3 h-48 md:h-auto relative">
                                            <img
                                                src={post.featuredImage}
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className={`flex-1 p-6 ${post.featuredImage ? '' : ''}`}>
                                        <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                                            <span>5 min read</span>
                                        </div>
                                        <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-[#10B981] transition-colors">
                                            {post.title}
                                        </h2>
                                        {post.excerpt && (
                                            <p className="text-gray-400 line-clamp-2 md:line-clamp-3 mb-4">
                                                {post.excerpt}
                                            </p>
                                        )}
                                        <span className="inline-flex items-center text-sm font-medium text-[#10B981]">
                                            Read Article
                                            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
