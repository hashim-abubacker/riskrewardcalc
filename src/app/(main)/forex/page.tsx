import { Metadata } from 'next';
import Link from 'next/link';
import { FOREX_PAIRS } from '@/lib/forexPairs';

export const metadata: Metadata = {
    title: 'Forex Position Size Calculator | All Currency Pairs | RiskRewardCalc',
    description: 'Free Forex position size calculator for all major and minor currency pairs. Calculate lot sizes for EUR/USD, GBP/USD, USD/JPY, Gold, Silver, and more.',
    keywords: ['forex calculator', 'position size calculator', 'lot size calculator', 'forex trading', 'currency pairs', 'pip calculator'],
    openGraph: {
        title: 'Forex Position Size Calculator | RiskRewardCalc',
        description: 'Calculate position sizes for all major forex pairs. Free trading tool with pip value calculations.',
        type: 'website',
        url: 'https://riskrewardcalc.com/forex',
    },
};

export default function ForexHubPage() {
    const majorPairs = Object.values(FOREX_PAIRS).filter(p => p.category === 'major');
    const minorPairs = Object.values(FOREX_PAIRS).filter(p => p.category === 'minor');
    const commodityPairs = Object.values(FOREX_PAIRS).filter(p => p.category === 'commodity');

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
                Forex Position Size Calculator
            </h1>
            <p className="text-gray-400 text-center mb-8 max-w-2xl mx-auto">
                Calculate your position size and lot size for any forex pair. Select a currency pair below to use our free trading calculator.
            </p>

            {/* Major Pairs */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-emerald-500 mb-4">Major Pairs</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {majorPairs.map((pair) => (
                        <Link
                            key={pair.symbol}
                            href={`/forex/${pair.symbol.toLowerCase()}`}
                            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 hover:border-emerald-500/50 hover:bg-[#1A1A1A]/80 transition-all group"
                        >
                            <div className="text-white font-semibold group-hover:text-emerald-400 transition-colors">
                                {pair.displayName}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Pip: {pair.pipSize}
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Minor Pairs */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-emerald-500 mb-4">Minor Pairs</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {minorPairs.map((pair) => (
                        <Link
                            key={pair.symbol}
                            href={`/forex/${pair.symbol.toLowerCase()}`}
                            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 hover:border-emerald-500/50 hover:bg-[#1A1A1A]/80 transition-all group"
                        >
                            <div className="text-white font-semibold group-hover:text-emerald-400 transition-colors">
                                {pair.displayName}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Pip: {pair.pipSize}
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Commodities */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-emerald-500 mb-4">Precious Metals</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {commodityPairs.map((pair) => (
                        <Link
                            key={pair.symbol}
                            href={`/forex/${pair.symbol.toLowerCase()}`}
                            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 hover:border-emerald-500/50 hover:bg-[#1A1A1A]/80 transition-all group"
                        >
                            <div className="text-white font-semibold group-hover:text-emerald-400 transition-colors">
                                {pair.displayName}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Contract: {pair.contractSize.toLocaleString()} units
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Back to main calculator */}
            <div className="text-center mt-8">
                <Link
                    href="/"
                    className="text-emerald-500 hover:text-emerald-400 underline text-sm"
                >
                    ← Back to Main Calculator
                </Link>
            </div>
        </div>
    );
}
