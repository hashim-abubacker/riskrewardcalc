'use client';

import { useState } from 'react';
import Link from 'next/link';
import Calculator from '@/components/Calculator';
import { LivePriceIndicator } from '@/components/LivePriceIndicator';
import { CRYPTO_COINS, CryptoCoin } from '@/lib/cryptoCoins';

interface CryptoCoinClientProps {
    coinData: CryptoCoin;
}

export function CryptoCoinClient({ coinData }: CryptoCoinClientProps) {
    const [entryPriceOverride, setEntryPriceOverride] = useState<{ price: number; timestamp: number } | undefined>(undefined);

    return (
        <div className="max-w-[1000px] mx-auto px-3 py-4">
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-500 mb-4">
                <Link href="/" className="hover:text-emerald-500">Home</Link>
                <span className="mx-2">/</span>
                <Link href="/crypto" className="hover:text-emerald-500">Crypto</Link>
                <span className="mx-2">/</span>
                <span className="text-gray-300">{coinData.name}</span>
            </nav>

            {/* SEO H1 */}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center">
                {coinData.name} Position Size Calculator
            </h1>
            <p className="text-gray-400 text-center text-sm mb-4">
                Calculate your {coinData.symbol} position size based on your account balance and risk tolerance.
            </p>

            {/* Live Price Indicator */}
            <div className="mb-6">
                <LivePriceIndicator
                    coinSlug={coinData.slug}
                    coinSymbol={coinData.symbol}
                    onUsePrice={(price, timestamp) => setEntryPriceOverride({ price, timestamp: timestamp || Date.now() })}
                />
            </div>

            {/* Calculator - Pre-selected to crypto */}
            <Calculator
                locale="en-US"
                defaultAssetClass="crypto"
                defaultEntryPrice={entryPriceOverride?.price.toString()}
                forceUpdateId={entryPriceOverride?.timestamp}
            />

            {/* SEO Content */}
            <div className="mt-8 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-3">
                    About {coinData.name} Trading
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                    {coinData.name} ({coinData.symbol}) is {coinData.description}.
                    Use our free position size calculator to determine how much {coinData.symbol} to buy based on your risk percentage.
                    Simply enter your account balance, the percentage you're willing to risk, and your entry and stop-loss prices to get your optimal position size.
                </p>
            </div>

            {/* Related Coins */}
            <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Other Crypto Calculators</h3>
                <div className="flex flex-wrap gap-2">
                    {Object.values(CRYPTO_COINS)
                        .filter(c => c.slug !== coinData.slug)
                        .slice(0, 6)
                        .map((c) => (
                            <Link
                                key={c.slug}
                                href={`/crypto/${c.slug}`}
                                className="text-xs bg-[#1A1A1A] border border-[#2A2A2A] rounded px-3 py-1.5 text-gray-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
                            >
                                {c.name}
                            </Link>
                        ))}
                </div>
            </div>
        </div>
    );
}
