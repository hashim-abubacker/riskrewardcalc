import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { generateArticleSchema, generateBreadcrumbSchema } from "@/lib/structured-data";
import 'katex/dist/katex.min.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


interface BlogPostPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = await prisma.post.findUnique({
        where: { slug },
    });

    if (!post) {
        return {
            title: "Post Not Found",
        };
    }

    return {
        title: `${post.title} - RiskRewardCalc`,
        description: post.excerpt || post.title,
        openGraph: {
            title: post.title,
            description: post.excerpt || post.title,
            type: 'article',
            publishedTime: post.publishedAt?.toISOString(),
            modifiedTime: post.updatedAt.toISOString(),
            images: post.featuredImage ? [post.featuredImage] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.excerpt || post.title,
            images: post.featuredImage ? [post.featuredImage] : [],
        },
    };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug } = await params;

    const post = await prisma.post.findUnique({
        where: { slug },
    });

    if (!post || !post.published) {
        // If post exists but is not published, allow viewing if accessed directly? 
        // For now, let's treat unpublished as not found for public, to be safe.
        // Actually, users might want to preview, but usually previews are done via admin or specific preview routes.
        // Let's hide unpublished posts.
        notFound();
    }

    const articleSchema = generateArticleSchema({
        title: post.title,
        description: post.excerpt || post.title,
        slug: post.slug,
        publishedAt: post.publishedAt || post.createdAt,
        updatedAt: post.updatedAt,
        featuredImage: post.featuredImage,
    });

    const breadcrumbSchema = generateBreadcrumbSchema([
        { name: 'Home', url: 'https://riskrewardcalc.com' },
        { name: 'Blog', url: 'https://riskrewardcalc.com/blog' },
        { name: post.title, url: `https://riskrewardcalc.com/blog/${post.slug}` },
    ]);

    return (
        <div className="min-h-screen bg-[#09090B]">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <article className="max-w-3xl mx-auto px-6 py-20">
                {/* Back Link */}
                <Link
                    href="/blog"
                    className="group inline-flex items-center text-sm font-medium text-gray-500 hover:text-white mb-10 transition-colors"
                >
                    <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Blog
                </Link>

                {/* Header */}
                <header className="mb-14 border-b border-[#27272A] pb-10">
                    <div className="flex items-center gap-4 text-sm font-medium text-emerald-500 mb-6 font-mono tracking-wider uppercase">
                        <span>5 min read</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-[1.15] mb-8 tracking-tight">
                        {post.title}
                    </h1>
                    {post.excerpt && (
                        <p className="text-lg md:text-xl text-gray-400 leading-relaxed mb-8">
                            {post.excerpt}
                        </p>
                    )}
                </header>

                {/* Content */}
                <div className="prose prose-invert prose-emerald max-w-none">
                    <SimpleMarkdownRenderer content={post.content} />
                </div>
            </article>
        </div>
    );
}

function SimpleMarkdownRenderer({ content }: { content: string }) {
    if (!content) return null;

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];

    let currentList: React.ReactNode[] = [];
    let inList = false;

    // Helper to render LaTeX formula using KaTeX
    const renderFormula = (latex: string, displayMode: boolean = false) => {
        try {
            // Import katex dynamically on the client side
            const katex = require('katex');
            const html = katex.renderToString(latex, {
                displayMode,
                throwOnError: false,
                output: 'html',
            });
            return html;
        } catch (error) {
            console.error('KaTeX rendering error:', error);
            return displayMode ? `$$${latex}$$` : `$${latex}$`;
        }
    };

    // Helper to process inline formatting: links, formulas, images, bold, italic, code
    const formatInline = (text: string) => {
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;

        // Combined regex for all inline elements
        // Priority:Images > Links > Block Math > Inline Math > Code > Bold > Italic
        const regex = new RegExp(
            '(!\\[([^\\]]*)\\]\\(([^)]+)\\))' + // Images
            '|(\\[([^\\]]+)\\]\\(([^)\\s]+)\\))' + // Links (no whitespace in URL)
            '|(\\$\\$\\s*([^$]+?)\\s*\\$\\$)' + // Block Math (allow spaces)
            '|(\\$\\s*([^$]+?)\\s*\\$)' + // Inline Math (allow spaces)
            '|(`([^`]+)`)' + // Code
            '|(\\*\\*([^*]+)\\*\\*)' + // Bold
            '|(\\*([^*]+)\\*)', // Italic
            'g'
        );

        let match;
        let key = 0;

        while ((match = regex.exec(text)) !== null) {
            // Add text before match
            if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
            }

            // Image: ![]()
            if (match[1]) {
                parts.push(
                    <span key={key++} className="block my-8">
                        <img
                            src={match[3]}
                            alt={match[2]}
                            className="w-full rounded-xl border border-[#2A2A2A] shadow-lg"
                        />
                        {match[2] && <span className="block text-center text-sm text-gray-500 mt-2 italic">{match[2]}</span>}
                    </span>
                );
            }
            // Link: []()
            else if (match[4]) {
                parts.push(
                    <a
                        key={key++}
                        href={match[6]}
                        className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
                        target={match[6].startsWith('http') ? '_blank' : undefined}
                        rel={match[6].startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                        {match[5]}
                    </a>
                );
            }
            // Block Math: $$...$$
            else if (match[7]) {
                const formulaHtml = renderFormula(match[8], true);
                parts.push(
                    <span
                        key={key++}
                        className="block my-6 overflow-x-auto text-center"
                        dangerouslySetInnerHTML={{ __html: formulaHtml }}
                    />
                );
            }
            // Inline Math: $...$
            else if (match[9]) {
                const formulaHtml = renderFormula(match[10], false);
                parts.push(
                    <span
                        key={key++}
                        className="inline-block mx-1"
                        dangerouslySetInnerHTML={{ __html: formulaHtml }}
                    />
                );
            }
            // Code: `...`
            else if (match[11]) {
                parts.push(
                    <code key={key++} className="bg-[#1A1A1A] text-emerald-400 px-1.5 py-0.5 rounded text-sm font-mono">
                        {match[12]}
                    </code>
                );
            }
            // Bold: **...**
            else if (match[13]) {
                parts.push(
                    <strong key={key++} className="text-white font-bold">
                        {match[14]}
                    </strong>
                );
            }
            // Italic: *...*
            else if (match[15]) {
                parts.push(
                    <em key={key++} className="text-gray-300 italic">
                        {match[16]}
                    </em>
                );
            }

            lastIndex = regex.lastIndex;
        }

        // Add remaining text
        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }

        return parts.length > 0 ? parts : text;
    };

    lines.forEach((line, index) => {
        const key = index;
        const trimmed = line.trim();

        // Handle Lists
        if (trimmed.startsWith('- ')) {
            if (!inList) {
                inList = true;
                currentList = [];
            }
            currentList.push(
                <li key={`li-${key}`} className="ml-4 mb-2 text-gray-200 pl-2 border-l-2 border-emerald-500/30">
                    <span className="text-white font-bold mr-2">•</span>
                    {formatInline(trimmed.substring(2))}
                </li>
            );
            return;
        }

        // Output accumulated list if non-list line
        if (inList && !trimmed.startsWith('- ')) {
            inList = false;
            elements.push(<ul key={`ul-${key}`} className="mb-6 space-y-1">{currentList}</ul>);
            currentList = [];
        }

        if (!trimmed) return;

        // Headers
        if (trimmed.startsWith('# ')) {
            elements.push(<h2 key={key} className="text-3xl font-bold text-white mt-12 mb-6 tracking-tight">{formatInline(trimmed.substring(2))}</h2>);
            return;
        }
        if (trimmed.startsWith('## ')) {
            elements.push(<h3 key={key} className="text-2xl font-bold text-white mt-10 mb-4">{formatInline(trimmed.substring(3))}</h3>);
            return;
        }
        if (trimmed.startsWith('### ')) {
            elements.push(<h4 key={key} className="text-xl font-bold text-white mt-8 mb-3">{formatInline(trimmed.substring(4))}</h4>);
            return;
        }

        // Blockquotes
        if (trimmed.startsWith('> ')) {
            elements.push(
                <blockquote key={key} className="border-l-4 border-emerald-500 pl-4 py-1 italic text-gray-400 my-6 bg-[#1A1A1A]/50 rounded-r-lg">
                    {formatInline(trimmed.substring(2))}
                </blockquote>
            );
            return;
        }

        // Horizontal Rules
        if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
            elements.push(
                <hr key={key} className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
            );
            return;
        }

        // Paragraphs (default)
        elements.push(
            <div key={key} className="mb-6 text-gray-200 text-lg leading-8">
                {formatInline(trimmed)}
            </div>
        );
    });

    if (inList) {
        elements.push(<ul key="ul-end" className="mb-6 space-y-1">{currentList}</ul>);
    }

    return <div>{elements}</div>;
}
