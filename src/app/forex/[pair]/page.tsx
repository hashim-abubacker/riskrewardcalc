import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { FOREX_PAIRS } from '@/lib/forexPairs';
import Calculator from '@/components/Calculator';

interface PageProps {
    params: Promise<{ pair: string }>;
}

// Generate static paths for all forex pairs
export async function generateStaticParams() {
    return Object.keys(FOREX_PAIRS).map((pair) => ({
        pair: pair.toLowerCase(),
    }));
}

// Generate SEO metadata for each pair
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { pair } = await params;
    const pairData = FOREX_PAIRS[pair.toUpperCase()];

    if (!pairData) {
        return { title: 'Pair Not Found' };
    }

    const title = `${pairData.displayName} Position Size Calculator | RiskRewardCalc`;
    const description = `Calculate your ${pairData.displayName} position size and lot size. Free forex calculator with pip value (${pairData.pipSize}) and risk management for ${pairData.displayName} trading.`;

    return {
        title,
        description,
        keywords: [
            `${pairData.displayName} calculator`,
            `${pairData.displayName} position size`,
            `${pairData.displayName} lot size`,
            `${pairData.symbol} trading calculator`,
            'forex position size calculator',
            'pip value calculator',
        ],
        openGraph: {
            title,
            description,
            type: 'website',
            url: `https://riskrewardcalc.com/forex/${pair.toLowerCase()}`,
        },
    };
}

export default async function ForexPairPage({ params }: PageProps) {
    const { pair } = await params;
    const pairData = FOREX_PAIRS[pair.toUpperCase()];

    if (!pairData) {
        notFound();
    }

    return (
        <div className="max-w-[1000px] mx-auto px-3 py-4">
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-500 mb-4">
                <Link href="/" className="hover:text-emerald-500">Home</Link>
                <span className="mx-2">/</span>
                <Link href="/forex" className="hover:text-emerald-500">Forex</Link>
                <span className="mx-2">/</span>
                <span className="text-gray-300">{pairData.displayName}</span>
            </nav>

            {/* SEO H1 */}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center">
                {pairData.displayName} Position Size Calculator
            </h1>
            <p className="text-gray-400 text-center text-sm mb-6">
                Calculate your {pairData.displayName} lot size based on risk percentage.
                Pip size: {pairData.pipSize} | Contract: {pairData.contractSize.toLocaleString()} units
            </p>

            {/* Calculator - Pre-selected to this pair */}
            <Calculator
                locale="en-US"
                defaultAssetClass="forex"
                defaultForexPair={pair.toUpperCase()}
            />

            {/* SEO Content */}
            <div className="mt-8 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-3">
                    About {pairData.displayName} Trading
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                    {pairData.displayName} is one of the most traded {pairData.category === 'commodity' ? 'commodities' : 'currency pairs'} in forex markets.
                    Use our free position size calculator to determine your optimal lot size based on your account balance and risk tolerance.
                    The calculator automatically factors in the pip size of {pairData.pipSize} and standard contract size of {pairData.contractSize.toLocaleString()} units.
                </p>
            </div>

            {/* Related Pairs */}
            <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Other Calculators</h3>
                <div className="flex flex-wrap gap-2">
                    {Object.values(FOREX_PAIRS)
                        .filter(p => p.symbol !== pairData.symbol)
                        .slice(0, 6)
                        .map((p) => (
                            <Link
                                key={p.symbol}
                                href={`/forex/${p.symbol.toLowerCase()}`}
                                className="text-xs bg-[#1A1A1A] border border-[#2A2A2A] rounded px-3 py-1.5 text-gray-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
                            >
                                {p.displayName}
                            </Link>
                        ))}
                </div>
            </div>
        </div>
    );
}
