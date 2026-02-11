/**
 * Indian Stock Market Trading Charges Calculator
 * 
 * Calculates all statutory charges, taxes, and brokerage for NSE/BSE trades.
 * Based on 2024 SEBI regulations and typical discount broker rates.
 */

export type IndiaTradeMode = 'intraday' | 'delivery';

export interface IndiaCharges {
    stt: number;              // Securities Transaction Tax
    exchangeCharges: number;  // NSE/BSE transaction charges
    sebiTurnover: number;     // SEBI turnover fee
    stampDuty: number;        // State stamp duty (using average rate)
    brokerage: number;        // Broker fee
    gst: number;              // 18% GST on brokerage + charges
    totalCharges: number;     // Sum of all charges
    breakeven: number;        // Price movement per share needed to break even
    stcgProvision: number;    // Short-term capital gains tax provision (15%/20%)
    netProfitAfterTax: number; // Profit after all charges and STCG
}

// Charge rates as of 2024
const RATES = {
    intraday: {
        stt: 0.00025,           // 0.025% on sell side only
        sttOnBuy: false,        // STT only on sell for intraday
        exchangeNSE: 0.0000345, // 0.00345% both sides
        sebi: 0.000001,         // 0.0001% both sides
        stampDuty: 0.00003,     // 0.003% on buy side
        brokeragePerOrder: 20,  // ₹20 per executed order (Zerodha/Groww style)
        stcgRate: 0.15,         // 15% STCG for intraday (speculative income)
    },
    delivery: {
        stt: 0.001,             // 0.1% on both sides
        sttOnBuy: true,         // STT on both buy and sell
        exchangeNSE: 0.0000345, // 0.00345% both sides
        sebi: 0.000001,         // 0.0001% both sides
        stampDuty: 0.00015,     // 0.015% on buy side
        brokeragePerOrder: 0,   // Free delivery on most discount brokers
        stcgRate: 0.20,         // 20% STCG for delivery (2024 Budget - up from 15%)
    },
};

const GST_RATE = 0.18; // 18% GST

/**
 * Calculate all trading charges for an Indian stock trade
 * 
 * @param entryPrice - Entry price per share
 * @param exitPrice - Exit/target price per share
 * @param quantity - Number of shares
 * @param tradeMode - 'intraday' for MIS or 'delivery' for CNC
 * @returns IndiaCharges object with all charge breakdowns
 */
export function calculateIndiaCharges(
    entryPrice: number,
    exitPrice: number,
    quantity: number,
    tradeMode: IndiaTradeMode
): IndiaCharges {
    const rates = RATES[tradeMode];

    const buyValue = entryPrice * quantity;
    const sellValue = exitPrice * quantity;
    const turnover = buyValue + sellValue;

    // STT Calculation
    let stt: number;
    if (tradeMode === 'intraday') {
        // Intraday: STT only on sell side
        stt = sellValue * rates.stt;
    } else {
        // Delivery: STT on both sides
        stt = turnover * rates.stt;
    }

    // Exchange Transaction Charges (both sides)
    const exchangeCharges = turnover * rates.exchangeNSE;

    // SEBI Turnover Fee (both sides)
    const sebiTurnover = turnover * rates.sebi;

    // Stamp Duty (buy side only)
    const stampDuty = buyValue * rates.stampDuty;

    // Brokerage (2 orders for intraday: buy + sell)
    const brokerage = tradeMode === 'intraday'
        ? rates.brokeragePerOrder * 2
        : rates.brokeragePerOrder;

    // GST on brokerage + exchange charges + SEBI charges
    const gstableAmount = brokerage + exchangeCharges + sebiTurnover;
    const gst = gstableAmount * GST_RATE;

    // Total charges
    const totalCharges = stt + exchangeCharges + sebiTurnover + stampDuty + brokerage + gst;

    // Breakeven: how much price must move per share to cover charges
    const breakeven = quantity > 0 ? totalCharges / quantity : 0;

    // Gross profit (before any deductions)
    const grossProfit = (exitPrice - entryPrice) * quantity;

    // Net profit after charges
    const profitAfterCharges = grossProfit - totalCharges;

    // STCG tax provision (only on profits, not losses)
    const stcgProvision = profitAfterCharges > 0
        ? profitAfterCharges * rates.stcgRate
        : 0;

    // Final net profit after all deductions
    const netProfitAfterTax = profitAfterCharges - stcgProvision;

    return {
        stt: Math.round(stt * 100) / 100,
        exchangeCharges: Math.round(exchangeCharges * 100) / 100,
        sebiTurnover: Math.round(sebiTurnover * 100) / 100,
        stampDuty: Math.round(stampDuty * 100) / 100,
        brokerage: Math.round(brokerage * 100) / 100,
        gst: Math.round(gst * 100) / 100,
        totalCharges: Math.round(totalCharges * 100) / 100,
        breakeven: Math.round(breakeven * 100) / 100,
        stcgProvision: Math.round(stcgProvision * 100) / 100,
        netProfitAfterTax: Math.round(netProfitAfterTax * 100) / 100,
    };
}

/**
 * Get the fixed leverage for Indian stock trading
 * Based on SEBI peak margin rules (2024)
 */
export function getIndiaLeverage(tradeMode: IndiaTradeMode): number {
    return tradeMode === 'intraday' ? 5 : 1;
}

/**
 * Calculate the maximum quantity allowed by margin
 * 
 * @param balance - Account balance in INR
 * @param entryPrice - Entry price per share
 * @param tradeMode - 'intraday' or 'delivery'
 * @returns Maximum quantity that can be purchased with available margin
 */
export function calculateMaxMarginQty(
    balance: number,
    entryPrice: number,
    tradeMode: IndiaTradeMode
): number {
    const leverage = getIndiaLeverage(tradeMode);
    const buyingPower = balance * leverage;
    return Math.floor(buyingPower / entryPrice);
}
