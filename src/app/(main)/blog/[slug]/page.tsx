import { getPostBySlug, getAllPosts } from '@/lib/blog';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const post = getPostBySlug(resolvedParams.slug);
  
  if (!post) {
    return {
      title: 'Post Not Found | RiskRewardCalc',
    };
  }
  
  return {
    title: `${post.metadata.title} | RiskRewardCalc Blog`,
    description: post.metadata.description,
    openGraph: {
      title: post.metadata.title,
      description: post.metadata.description,
      type: 'article',
      authors: [post.metadata.author],
      publishedTime: post.metadata.date,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metadata.title,
      description: post.metadata.description,
    }
  };
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = await params;
  const post = getPostBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-[800px] mx-auto px-4 py-8 md:py-12">
      <Link href="/blog" className="text-[#00FF9D] hover:underline text-sm flex items-center gap-2 mb-8 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Blog
      </Link>
      
      <header className="mb-10 pb-8 border-b border-[#27272A]">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {post.metadata.title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-400 font-mono">
          <span>{new Date(post.metadata.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
          <span>•</span>
          <span>{post.metadata.author}</span>
        </div>
      </header>

      <div className="prose prose-invert prose-emerald max-w-none 
          prose-headings:font-bold prose-headings:font-['Space_Grotesk']
          prose-h1:text-white prose-h2:text-gray-100 prose-h3:text-gray-200
          prose-a:text-[#00FF9D] prose-a:no-underline hover:prose-a:underline
          prose-strong:text-white prose-code:text-[#00FF9D] prose-code:bg-[#121417] prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-[#050607] prose-pre:border prose-pre:border-[#27272A]
          prose-img:rounded-xl">
        <MDXRemote source={post.content} />
      </div>
    </article>
  );
}
