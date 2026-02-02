'use client';

import { useState, useEffect, useCallback } from 'react';

interface PriceData {
    price: number;
    change24h: number | null;
    lastUpdated: number;
}

interface UseCryptoPriceReturn {
    price: number | null;
    change24h: number | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

// Cache to prevent excessive API calls
const priceCache: Record<string, { data: PriceData; timestamp: number }> = {};
const CACHE_DURATION = 60000; // 60 seconds

// Map our coin slugs to CoinGecko IDs
const COINGECKO_ID_MAP: Record<string, string> = {
    'bitcoin': 'bitcoin',
    'ethereum': 'ethereum',
    'solana': 'solana',
    'xrp': 'ripple',
    'bnb': 'binancecoin',
    'cardano': 'cardano',
    'dogecoin': 'dogecoin',
    'avalanche': 'avalanche-2',
    'polkadot': 'polkadot',
    'chainlink': 'chainlink',
};

export function useCryptoPrice(coinSlug: string): UseCryptoPriceReturn {
    const [price, setPrice] = useState<number | null>(null);
    const [change24h, setChange24h] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPrice = useCallback(async () => {
        const coinId = COINGECKO_ID_MAP[coinSlug.toLowerCase()];
        if (!coinId) {
            setError('Unknown coin');
            setLoading(false);
            return;
        }

        // Check cache first
        const cached = priceCache[coinId];
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            setPrice(cached.data.price);
            setChange24h(cached.data.change24h);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const apiKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
            const response = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`,
                {
                    headers: apiKey ? { 'x-cg-demo-api-key': apiKey } : {},
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch price');
            }

            const data = await response.json();
            const coinData = data[coinId];

            if (coinData) {
                const priceData: PriceData = {
                    price: coinData.usd,
                    change24h: coinData.usd_24h_change ?? null,
                    lastUpdated: coinData.last_updated_at,
                };

                // Update cache
                priceCache[coinId] = { data: priceData, timestamp: Date.now() };

                setPrice(priceData.price);
                setChange24h(priceData.change24h);
            } else {
                throw new Error('No data returned');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch');
        } finally {
            setLoading(false);
        }
    }, [coinSlug]);

    useEffect(() => {
        fetchPrice();
    }, [fetchPrice]);

    return { price, change24h, loading, error, refetch: fetchPrice };
}
