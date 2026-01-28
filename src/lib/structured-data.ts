/**
 * Structured Data (JSON-LD) helpers for SEO
 * Following schema.org standards
 */

export function generateOrganizationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'RiskRewardCalc',
        url: 'https://riskrewardcalc.com',
        logo: 'https://riskrewardcalc.com/icon-512x512.png',
        description: 'A wallet-risk focused trading calculator for high-leverage Crypto and Forex traders.',
        sameAs: [
            // Add social media links here when available
        ],
    };
}

export function generateWebApplicationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'RiskRewardCalc',
        url: 'https://riskrewardcalc.com',
        applicationCategory: 'FinanceApplication',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        operatingSystem: 'All',
        description: 'Calculate your position size based on wallet risk for crypto, forex, stocks, and futures trading.',
    };
}

export function generateArticleSchema(article: {
    title: string;
    description: string;
    slug: string;
    publishedAt: Date;
    updatedAt: Date;
    featuredImage?: string | null;
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.description,
        image: article.featuredImage || 'https://riskrewardcalc.com/icon-512x512.png',
        datePublished: article.publishedAt.toISOString(),
        dateModified: article.updatedAt.toISOString(),
        author: {
            '@type': 'Organization',
            name: 'RiskRewardCalc',
        },
        publisher: {
            '@type': 'Organization',
            name: 'RiskRewardCalc',
            logo: {
                '@type': 'ImageObject',
                url: 'https://riskrewardcalc.com/icon-512x512.png',
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://riskrewardcalc.com/blog/${article.slug}`,
        },
    };
}

export function generateFAQPageSchema(faqs: Array<{ question: string; answer: string }>) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}
