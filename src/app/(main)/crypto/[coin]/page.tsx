import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCoinBySlug, getAllCoinSlugs } from '@/lib/cryptoCoins';
import { CryptoCoinClient } from '@/components/CryptoCoinClient';

interface PageProps {
    params: Promise<{ coin: string }>;
}

// Generate static paths for all coins
export async function generateStaticParams() {
    return getAllCoinSlugs().map((coin) => ({
        coin,
    }));
}

// Generate SEO metadata for each coin
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { coin } = await params;
    const coinData = getCoinBySlug(coin);

    if (!coinData) {
        return { title: 'Coin Not Found' };
    }

    const title = `${coinData.name} Position Size Calculator | RiskRewardCalc`;
    const description = `Calculate your ${coinData.name} (${coinData.symbol}) position size based on risk percentage. Free ${coinData.symbol} trading calculator for ${coinData.description}.`;

    return {
        title,
        description,
        keywords: [
            `${coinData.name} calculator`,
            `${coinData.name} position size`,
            `${coinData.symbol} trading calculator`,
            `${coinData.name} risk calculator`,
            'crypto position size calculator',
            'cryptocurrency trading',
        ],
        openGraph: {
            title,
            description,
            type: 'website',
            url: `https://riskrewardcalc.com/crypto/${coin}`,
        },
    };
}

export default async function CryptoCoinPage({ params }: PageProps) {
    const { coin } = await params;
    const coinData = getCoinBySlug(coin);

    if (!coinData) {
        notFound();
    }

    return <CryptoCoinClient coinData={coinData} />;
}
