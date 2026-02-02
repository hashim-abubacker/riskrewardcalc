import { MetadataRoute } from 'next';
import { FOREX_PAIRS } from '@/lib/forexPairs';
import { getAllCoinSlugs } from '@/lib/cryptoCoins';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://riskrewardcalc.com';
    const now = new Date();

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: now,
            changeFrequency: 'monthly' as const,
            priority: 1.0,
        },
        {
            url: `${baseUrl}/forex`,
            lastModified: now,
            changeFrequency: 'monthly' as const,
            priority: 0.9,
        },
        {
            url: `${baseUrl}/crypto`,
            lastModified: now,
            changeFrequency: 'monthly' as const,
            priority: 0.9,
        },
    ];

    // Forex pair pages
    const forexPages: MetadataRoute.Sitemap = Object.keys(FOREX_PAIRS).map((pair) => ({
        url: `${baseUrl}/forex/${pair.toLowerCase()}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
    }));

    // Crypto coin pages
    const cryptoPages: MetadataRoute.Sitemap = getAllCoinSlugs().map((coin) => ({
        url: `${baseUrl}/crypto/${coin}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
    }));

    return [...staticPages, ...forexPages, ...cryptoPages];
}
