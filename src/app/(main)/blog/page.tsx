import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';

export const metadata = {
  title: 'Trading Blog & Education | RiskRewardCalc',
  description: 'Learn about risk management, position sizing, and trading psychology with our educational blog posts.',
  alternates: {
    canonical: '/blog',
  },
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Trading <span className="text-[#00FF9D]">Education</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Master risk management, learn how to calculate position sizes accurately, and build a profitable trading strategy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
            <div className="bg-[#18181b] border border-[#27272A] rounded-xl p-6 h-full transition-all duration-300 group-hover:border-[#00FF9D]/50 group-hover:bg-[#1f1f23]">
              <div className="text-xs text-[#00FF9D] font-mono mb-2">
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <h2 className="text-xl font-bold text-white mb-3 group-hover:text-[#00FF9D] transition-colors">
                {post.title}
              </h2>
              <p className="text-gray-400 text-sm line-clamp-3">
                {post.description}
              </p>
              <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
                <span>By {post.author}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {posts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No blog posts found. Check back soon!
        </div>
      )}
    </div>
  );
}
