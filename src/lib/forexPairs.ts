// Forex pairs configuration with pip sizes and contract sizes
// Used for the enhanced Forex calculator

export interface ForexPair {
    symbol: string;
    displayName: string;
    pipSize: number;       // e.g., 0.0001 for EUR/USD, 0.01 for USD/JPY
    contractSize: number;  // Units per lot (100,000 for currencies, 100 for gold)
    category: 'major' | 'minor' | 'exotic' | 'commodity';
    pipDigits: number;     // Decimal places for pip display
}

export const FOREX_PAIRS: Record<string, ForexPair> = {
    // Major Pairs
    'EURUSD': { symbol: 'EURUSD', displayName: 'EUR/USD', pipSize: 0.0001, contractSize: 100000, category: 'major', pipDigits: 4 },
    'GBPUSD': { symbol: 'GBPUSD', displayName: 'GBP/USD', pipSize: 0.0001, contractSize: 100000, category: 'major', pipDigits: 4 },
    'USDJPY': { symbol: 'USDJPY', displayName: 'USD/JPY', pipSize: 0.01, contractSize: 100000, category: 'major', pipDigits: 2 },
    'USDCHF': { symbol: 'USDCHF', displayName: 'USD/CHF', pipSize: 0.0001, contractSize: 100000, category: 'major', pipDigits: 4 },
    'AUDUSD': { symbol: 'AUDUSD', displayName: 'AUD/USD', pipSize: 0.0001, contractSize: 100000, category: 'major', pipDigits: 4 },
    'USDCAD': { symbol: 'USDCAD', displayName: 'USD/CAD', pipSize: 0.0001, contractSize: 100000, category: 'major', pipDigits: 4 },
    'NZDUSD': { symbol: 'NZDUSD', displayName: 'NZD/USD', pipSize: 0.0001, contractSize: 100000, category: 'major', pipDigits: 4 },

    // Minor/Cross Pairs
    'EURGBP': { symbol: 'EURGBP', displayName: 'EUR/GBP', pipSize: 0.0001, contractSize: 100000, category: 'minor', pipDigits: 4 },
    'EURJPY': { symbol: 'EURJPY', displayName: 'EUR/JPY', pipSize: 0.01, contractSize: 100000, category: 'minor', pipDigits: 2 },
    'GBPJPY': { symbol: 'GBPJPY', displayName: 'GBP/JPY', pipSize: 0.01, contractSize: 100000, category: 'minor', pipDigits: 2 },
    'EURCHF': { symbol: 'EURCHF', displayName: 'EUR/CHF', pipSize: 0.0001, contractSize: 100000, category: 'minor', pipDigits: 4 },
    'AUDJPY': { symbol: 'AUDJPY', displayName: 'AUD/JPY', pipSize: 0.01, contractSize: 100000, category: 'minor', pipDigits: 2 },
    'CADJPY': { symbol: 'CADJPY', displayName: 'CAD/JPY', pipSize: 0.01, contractSize: 100000, category: 'minor', pipDigits: 2 },

    // Commodities (traded on Forex platforms)
    'XAUUSD': { symbol: 'XAUUSD', displayName: 'XAU/USD (Gold)', pipSize: 0.01, contractSize: 100, category: 'commodity', pipDigits: 2 },
    'XAGUSD': { symbol: 'XAGUSD', displayName: 'XAG/USD (Silver)', pipSize: 0.001, contractSize: 5000, category: 'commodity', pipDigits: 3 },
};

// Get pairs grouped by category
export const getPairsByCategory = () => {
    const grouped: Record<string, ForexPair[]> = {
        major: [],
        minor: [],
        commodity: [],
        exotic: [],
    };

    Object.values(FOREX_PAIRS).forEach(pair => {
        grouped[pair.category].push(pair);
    });

    return grouped;
};

// Get pair list for dropdown
export const getPairOptions = (): { value: string; label: string; category: string }[] => {
    return Object.values(FOREX_PAIRS).map(pair => ({
        value: pair.symbol,
        label: pair.displayName,
        category: pair.category,
    }));
};

// Calculate pip value for a given lot size
export const calculatePipValue = (
    pair: ForexPair,
    lotSize: number,
    accountCurrency: 'USD' | 'EUR' | 'GBP' = 'USD'
): number => {
    // For pairs where USD is quote currency (EUR/USD, GBP/USD, etc.)
    // Pip value = pip size × contract size × lot size
    // For cross pairs, would need exchange rate conversion (simplified here)
    const pipValue = pair.pipSize * pair.contractSize * lotSize;
    return pipValue;
};
