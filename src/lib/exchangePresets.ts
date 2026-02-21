/**
 * Exchange Fee Presets for Crypto/Futures Trading
 * 
 * Base VIP-0 rates for popular exchanges.
 * Adding a new exchange is a one-line addition to the EXCHANGE_PRESETS array.
 */

export type OrderType = 'maker' | 'taker';

export interface ExchangePreset {
    name: string;
    makerFee: number;  // as decimal, e.g. 0.00020 = 0.020%
    takerFee: number;  // as decimal, e.g. 0.00045 = 0.045%
}

export const EXCHANGE_PRESETS: ExchangePreset[] = [
    { name: 'Binance', makerFee: 0.00020, takerFee: 0.00045 },
    { name: 'Bybit', makerFee: 0.00020, takerFee: 0.00055 },
    { name: 'OKX', makerFee: 0.00020, takerFee: 0.00050 },
    { name: 'Hyperliquid', makerFee: 0.00015, takerFee: 0.00045 },
    { name: 'Gate.io', makerFee: 0.00015, takerFee: 0.00050 },
    { name: 'MEXC', makerFee: 0.00000, takerFee: 0.00050 },
];

/** Default exchange preset name */
export const DEFAULT_EXCHANGE = 'Binance';

/** Get a preset by name, returns undefined for 'Custom' */
export function getPreset(name: string): ExchangePreset | undefined {
    return EXCHANGE_PRESETS.find(p => p.name === name);
}

/** Format a fee decimal as a percentage string (e.g. 0.00045 → "0.045") */
export function feeToPercent(fee: number): string {
    return (fee * 100).toFixed(3);
}

/** Parse a percentage string to fee decimal (e.g. "0.045" → 0.00045) */
export function percentToFee(percent: string): number {
    return (parseFloat(percent) || 0) / 100;
}
