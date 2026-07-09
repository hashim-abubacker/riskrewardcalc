import { Metadata } from 'next';
import Link from 'next/link';
import { CRYPTO_COINS } from '@/lib/cryptoCoins';

export const metadata: Metadata = {
    title: 'Crypto Position Size Calculator | Bitcoin, Ethereum & More | RiskRewardCalc',
    description: 'Free cryptocurrency position size calculator for Bitcoin, Ethereum, Solana, and top 10 cryptocurrencies. Calculate your risk and position size for crypto trading.',
    keywords: ['crypto calculator', 'bitcoin calculator', 'ethereum calculator', 'crypto position size', 'cryptocurrency trading', 'risk management'],
    openGraph: {
        title: 'Crypto Position Size Calculator | RiskRewardCalc',
        description: 'Calculate position sizes for Bitcoin, Ethereum, and top cryptocurrencies. Free trading tool.',
        type: 'website',
        url: 'https://riskrewardcalc.com/crypto',
    },
};

export default function CryptoHubPage() {
    const coins = Object.values(CRYPTO_COINS);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
                Crypto Position Size Calculator
            </h1>
            <p className="text-gray-400 text-center mb-8 max-w-2xl mx-auto">
                Calculate your position size for cryptocurrency trading. Select a coin below to use our free risk management calculator.
            </p>

            {/* Coins Grid */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-emerald-500 mb-4">Top 10 Cryptocurrencies</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {coins.map((coin) => (
                        <Link
                            key={coin.slug}
                            href={`/crypto/${coin.slug}`}
                            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 hover:border-emerald-500/50 hover:bg-[#1A1A1A]/80 transition-all group text-center"
                        >
                            <div className="text-white font-semibold group-hover:text-emerald-400 transition-colors">
                                {coin.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                {coin.symbol}
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* SEO Text */}
            <section className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 mt-8">
                <h2 className="text-lg font-semibold text-white mb-3">
                    Why Use a Crypto Position Size Calculator?
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                    Proper position sizing is crucial for cryptocurrency trading success.
                    Our free calculator helps you determine the exact amount to invest based on your account balance and risk tolerance.
                    Never risk more than you can afford to lose – use our tool to calculate optimal position sizes for Bitcoin, Ethereum, Solana, and other top cryptocurrencies.
                </p>
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
