// Top 10 Crypto coins configuration for SEO pages
// Used for dynamic /crypto/[coin] routes

export interface CryptoCoin {
    name: string;        // Full name (Bitcoin)
    symbol: string;      // Ticker symbol (BTC)
    slug: string;        // URL slug (bitcoin)
    description: string; // SEO meta description snippet
}

export const CRYPTO_COINS: Record<string, CryptoCoin> = {
    'bitcoin': {
        name: 'Bitcoin',
        symbol: 'BTC',
        slug: 'bitcoin',
        description: 'the world\'s largest cryptocurrency by market cap',
    },
    'ethereum': {
        name: 'Ethereum',
        symbol: 'ETH',
        slug: 'ethereum',
        description: 'the leading smart contract platform',
    },
    'solana': {
        name: 'Solana',
        symbol: 'SOL',
        slug: 'solana',
        description: 'a high-performance blockchain for DeFi and NFTs',
    },
    'xrp': {
        name: 'XRP',
        symbol: 'XRP',
        slug: 'xrp',
        description: 'Ripple\'s digital payment network and protocol',
    },
    'bnb': {
        name: 'BNB',
        symbol: 'BNB',
        slug: 'bnb',
        description: 'Binance\'s native exchange and blockchain token',
    },
    'cardano': {
        name: 'Cardano',
        symbol: 'ADA',
        slug: 'cardano',
        description: 'a proof-of-stake blockchain platform',
    },
    'dogecoin': {
        name: 'Dogecoin',
        symbol: 'DOGE',
        slug: 'dogecoin',
        description: 'the original meme cryptocurrency',
    },
    'avalanche': {
        name: 'Avalanche',
        symbol: 'AVAX',
        slug: 'avalanche',
        description: 'a fast, low-cost smart contracts platform',
    },
    'polkadot': {
        name: 'Polkadot',
        symbol: 'DOT',
        slug: 'polkadot',
        description: 'a multi-chain network for cross-blockchain transfers',
    },
    'chainlink': {
        name: 'Chainlink',
        symbol: 'LINK',
        slug: 'chainlink',
        description: 'the leading decentralized oracle network',
    },
};

// Get all coin slugs for generateStaticParams
export const getAllCoinSlugs = (): string[] => {
    return Object.keys(CRYPTO_COINS);
};

// Get coin by slug
export const getCoinBySlug = (slug: string): CryptoCoin | undefined => {
    return CRYPTO_COINS[slug.toLowerCase()];
};
