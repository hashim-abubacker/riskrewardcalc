'use client';

import { useCryptoPrice } from '@/hooks/useCryptoPrice';

interface LivePriceProps {
    coinSlug: string;
    coinSymbol: string;
    onUsePrice?: (price: number, timestamp?: number) => void;
}

export function LivePriceIndicator({ coinSlug, coinSymbol, onUsePrice }: LivePriceProps) {
    const { price, change24h, loading, error, refetch } = useCryptoPrice(coinSlug);

    if (loading) {
        return (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3 animate-pulse">
                <div className="h-4 bg-[#2A2A2A] rounded w-32 mx-auto"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3 text-center">
                <span className="text-gray-500 text-sm">Price unavailable</span>
                <button
                    onClick={refetch}
                    className="ml-2 text-emerald-500 text-sm hover:underline"
                >
                    Retry
                </button>
            </div>
        );
    }

    const isPositive = change24h !== null && change24h > 0;
    const isNegative = change24h !== null && change24h < 0;

    return (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs text-gray-500 mb-1">Live {coinSymbol} Price</div>
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-white">
                            ${price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {change24h !== null && (
                            <span className={`text-sm font-medium ${isPositive ? 'text-emerald-500' :
                                isNegative ? 'text-red-500' : 'text-gray-400'
                                }`}>
                                {isPositive && '+'}
                                {change24h.toFixed(2)}%
                            </span>
                        )}
                    </div>
                </div>
                {onUsePrice && price && (
                    <button
                        onClick={() => onUsePrice(price, Date.now())}
                        className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 text-xs font-medium rounded-md hover:bg-emerald-500/20 transition-colors"
                    >
                        Use as Entry
                    </button>
                )}
            </div>
            <div className="text-[10px] text-gray-600 mt-2 flex items-center gap-2">
                <span>Data from CoinGecko</span>
                <button
                    onClick={refetch}
                    className="text-emerald-500 hover:underline"
                >
                    ↻ Refresh
                </button>
            </div>
        </div>
    );
}
