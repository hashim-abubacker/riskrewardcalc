'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency as intlFormatCurrency, formatNumber as intlFormatNumber, SupportedLocale } from '@/lib/formatters';

type TradeDirection = 'LONG' | 'SHORT';
type RiskMode = 'percent' | 'fiat';
type AssetClass = 'crypto' | 'stocks' | 'forex' | 'futures';

interface CalculatorInputs {
    assetClass: AssetClass;
    balance: string;
    riskMode: RiskMode;
    riskPercent: string;
    riskFiat: string;
    entryPrice: string;
    stopLossPrice: string;
    targetPrice: string;
    leverage: string;
    lotSize: string;
}

interface CalculatorOutputs {
    positionSizeUnits: number;
    positionSizeValue: number;
    marginRequired: number;
    riskAmount: number;
    potentialProfit: number;
    rrr: number;
    tradeDirection: TradeDirection | null;
    validationError: string | null;
    insufficientMargin: boolean;
    futuresMinRisk: number | null;
}

const STORAGE_KEY = 'riskrewardcalc_balance';

interface CalculatorProps {
    locale: SupportedLocale;
}

export default function Calculator({ locale }: CalculatorProps) {
    // Calculator State Initialization
    const [inputs, setInputs] = useState<CalculatorInputs>({
        assetClass: 'crypto',
        balance: '',
        riskMode: 'percent',
        riskPercent: '1',
        riskFiat: '',
        entryPrice: '',
        stopLossPrice: '',
        targetPrice: '',
        leverage: '10',
        lotSize: '50',
    });

    const [outputs, setOutputs] = useState<CalculatorOutputs>({
        positionSizeUnits: 0,
        positionSizeValue: 0,
        marginRequired: 0,
        riskAmount: 0,
        potentialProfit: 0,
        rrr: 0,
        tradeDirection: null,
        validationError: null,
        insufficientMargin: false,
        futuresMinRisk: null,
    });

    useEffect(() => {
        const savedBalance = localStorage.getItem(STORAGE_KEY);
        if (savedBalance) {
            setInputs(prev => ({ ...prev, balance: savedBalance }));
        }
    }, []);

    useEffect(() => {
        if (inputs.balance) {
            localStorage.setItem(STORAGE_KEY, inputs.balance);
        }
    }, [inputs.balance]);

    useEffect(() => {
        const balance = parseFloat(inputs.balance) || 0;
        if (inputs.riskMode === 'percent') {
            const percent = parseFloat(inputs.riskPercent) || 0;
            const fiatValue = (balance * percent) / 100;
            setInputs(prev => ({ ...prev, riskFiat: fiatValue.toFixed(2) }));
        } else {
            const fiat = parseFloat(inputs.riskFiat) || 0;
            const percentValue = balance > 0 ? (fiat / balance) * 100 : 0;
            setInputs(prev => ({ ...prev, riskPercent: percentValue.toFixed(2) }));
        }
    }, [inputs.balance, inputs.riskMode, inputs.riskPercent, inputs.riskFiat]);

    const calculate = useCallback(() => {
        const balance = parseFloat(inputs.balance) || 0;
        const riskPercent = parseFloat(inputs.riskPercent) || 0;
        const entry = parseFloat(inputs.entryPrice) || 0;
        const sl = parseFloat(inputs.stopLossPrice) || 0;
        const target = parseFloat(inputs.targetPrice) || 0;
        const leverage = parseFloat(inputs.leverage) || 1;

        let direction: TradeDirection | null = null;
        let validationError: string | null = null;

        if (entry > 0 && sl > 0) {
            if (sl < entry) {
                direction = 'LONG';
            } else if (sl > entry) {
                direction = 'SHORT';
            } else {
                validationError = 'Stop Loss cannot equal Entry Price';
            }
        }

        const riskAmount = (balance * riskPercent) / 100;
        const priceDiff = Math.abs(entry - sl);
        let positionSizeUnits = priceDiff > 0 ? riskAmount / priceDiff : 0;

        // Apply Asset Class Logic
        if (inputs.assetClass === 'stocks') {
            positionSizeUnits = Math.floor(positionSizeUnits);
        } else if (inputs.assetClass === 'forex') {
            // Check if we should display lots here or just convert for display?
            // "Result = (Raw Units / 100,000). Label result as 'Lots'."
            // If I change positionSizeUnits here, it affects positionSizeValue calculation below.
            // Usually positionSizeValue = units * entry.
            // If Forex result is "Lots", does the user want to see Lots in the big number?
            // Yes. But margin calculation needs actual units or lots * 100k?
            // Margin = (Units * Price) / Leverage.
            // If I convert positionSizeUnits to Lots here, I need to convert back for Margin.
            // Let's keep positionSizeUnits as "Raw Units" for value/margin calc, 
            // but for the *display* (which uses this state), the prompt says "Result = ...".
            // So I should probably store the "Display Units" or handle it in the view.
            // HOWEVER, the "Result" output variable `positionSizeUnits` is explicitly defined in interface.
            // Let's modify `positionSizeUnits` to be the "Result" the user sees, and adjust `positionSizeValue` calc.

            positionSizeUnits = positionSizeUnits / 100000;
        } else if (inputs.assetClass === 'futures') {
            const lotSize = parseFloat(inputs.lotSize) || 1;
            positionSizeUnits = Math.floor(positionSizeUnits / lotSize) * lotSize;
        }
        // Calculate Value and Margin based on "Real" units
        // For Forex, positionSizeUnits is now in Lots, so we multiply by 100,000 to get real units for value calc
        const realUnits = inputs.assetClass === 'forex' ? positionSizeUnits * 100000 : positionSizeUnits;

        const positionSizeValue = realUnits * entry;
        const marginRequired = leverage > 0 ? positionSizeValue / leverage : positionSizeValue;

        let potentialProfit = 0;
        let rrr = 0;
        let futuresMinRisk: number | null = null;

        if (inputs.assetClass === 'futures' && positionSizeUnits === 0 && priceDiff > 0) {
            const lotSize = parseFloat(inputs.lotSize) || 1;
            futuresMinRisk = lotSize * priceDiff;
        }

        if (target > 0 && entry > 0 && direction) {
            if (direction === 'LONG') {
                potentialProfit = (target - entry) * realUnits;
            } else {
                potentialProfit = (entry - target) * realUnits;
            }
            rrr = riskAmount > 0 ? potentialProfit / riskAmount : 0;
        }

        const insufficientMargin = marginRequired > balance && balance > 0 && marginRequired > 0;

        setOutputs({
            positionSizeUnits,
            positionSizeValue,
            marginRequired,
            riskAmount,
            potentialProfit,
            rrr,
            tradeDirection: direction,
            validationError,
            insufficientMargin,
            futuresMinRisk,
        });
    }, [inputs]);

    useEffect(() => {
        calculate();
    }, [calculate]);

    const handleInputChange = (field: keyof CalculatorInputs, value: string) => {
        setInputs(prev => ({ ...prev, [field]: value }));
    };

    const toggleRiskMode = () => {
        setInputs(prev => ({
            ...prev,
            riskMode: prev.riskMode === 'percent' ? 'fiat' : 'percent'
        }));
    };

    const handleReset = () => {
        setInputs({
            assetClass: inputs.assetClass, // Keep selected asset class
            balance: inputs.balance,
            riskMode: 'percent',
            riskPercent: '1',
            riskFiat: '',
            entryPrice: '',
            stopLossPrice: '',
            targetPrice: '',
            leverage: '10',
            lotSize: '50',
        });
    };

    const formatNumber = (num: number, decimals: number = 2): string => {
        if (isNaN(num) || !isFinite(num)) return '0';
        return intlFormatNumber(num, locale, decimals);
    };

    const formatCurrency = (num: number): string => {
        if (isNaN(num) || !isFinite(num)) return intlFormatCurrency(0, locale);
        return intlFormatCurrency(num, locale);
    };

    return (
        <div className="max-w-[1000px] mx-auto px-3 py-3 md:py-4">
            {/* Title - Compact on smaller screens */}
            <div className="text-center mb-4 md:mb-6">
                <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
                    Smart Position Size & Risk Calculator
                </h1>
                <p className="text-xs md:text-sm text-gray-400">
                    Calculate your position size based on wallet risk
                </p>
            </div>

            {/* Asset Class Selector */}
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-1.5 mb-4 flex gap-1">
                {(['crypto', 'stocks', 'forex', 'futures'] as AssetClass[]).map((ac) => (
                    <button
                        key={ac}
                        onClick={() => {
                            handleInputChange('assetClass', ac);
                            // Update leverage default based on asset class
                            if (ac === 'forex') {
                                handleInputChange('leverage', '50');
                            } else {
                                handleInputChange('leverage', '10');
                            }
                        }}
                        className={`flex-1 py-1.5 rounded text-xs md:text-sm font-medium transition-colors ${inputs.assetClass === ac
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/50'
                            : 'text-gray-400 hover:text-gray-300 hover:bg-[#2A2A2A]'
                            }`}
                    >
                        {ac.charAt(0).toUpperCase() + ac.slice(1)}
                    </button>
                ))}
            </div>

            {/* Two Column Layout - Fluid Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">

                {/* LEFT: Trade Setup Card (Inputs) - Second on mobile, First on desktop */}
                <div className="order-2 md:order-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg md:rounded-xl overflow-hidden">
                    {/* Card Header */}
                    <div className="px-3 md:px-4 py-2 md:py-3 border-b border-[#2A2A2A] text-sm md:text-base font-semibold text-white">
                        Trade Setup
                    </div>

                    {/* Card Body */}
                    <div className="p-3 md:p-4 space-y-3">
                        {/* Account Balance */}
                        <div>
                            <label className="block text-xs md:text-sm text-gray-400 mb-1">Account Balance</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                <input
                                    type="number"
                                    className="w-full bg-[#0D0D0D] border border-[#3A3A3A] rounded-md md:rounded-lg py-2 md:py-2.5 px-3 pl-7 text-white text-sm focus:outline-none focus:border-emerald-500"
                                    placeholder="25,000"
                                    value={inputs.balance}
                                    onChange={(e) => handleInputChange('balance', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Risk Mode Toggle */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs md:text-sm text-gray-400">Risk Mode</label>
                                <div
                                    className="flex items-center gap-1.5 cursor-pointer"
                                    onClick={toggleRiskMode}
                                >
                                    <span className="text-xs text-gray-500">$</span>
                                    <div className={`relative w-10 md:w-12 h-5 md:h-6 rounded-full transition-colors ${inputs.riskMode === 'percent' ? 'bg-emerald-500' : 'bg-[#3A3A3A]'}`}>
                                        <div className={`absolute top-0.5 md:top-1 w-4 h-4 bg-white rounded-full transition-transform flex items-center justify-center text-[8px] md:text-[10px] font-bold text-gray-900 ${inputs.riskMode === 'percent' ? 'left-5 md:left-6' : 'left-0.5 md:left-1'}`}>
                                            {inputs.riskMode === 'percent' ? '%' : '$'}
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500">%</span>
                                </div>
                            </div>
                            <input
                                type="number"
                                className="w-full bg-[#0D0D0D] border border-[#3A3A3A] rounded-md md:rounded-lg py-2 md:py-2.5 px-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                                placeholder={inputs.riskMode === 'percent' ? '1' : '100'}
                                value={inputs.riskMode === 'percent' ? inputs.riskPercent : inputs.riskFiat}
                                onChange={(e) => handleInputChange(
                                    inputs.riskMode === 'percent' ? 'riskPercent' : 'riskFiat',
                                    e.target.value
                                )}
                            />
                        </div>

                        {/* Entry Price */}
                        <div>
                            <label className="block text-xs md:text-sm text-gray-400 mb-1">
                                Entry Price
                                {outputs.tradeDirection && (
                                    <span className={`ml-1.5 text-xs ${outputs.tradeDirection === 'LONG' ? 'text-emerald-500' : 'text-red-500'}`}>
                                        ({outputs.tradeDirection})
                                    </span>
                                )}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                <input
                                    type="number"
                                    className="w-full bg-[#0D0D0D] border border-[#3A3A3A] rounded-md md:rounded-lg py-2 md:py-2.5 px-3 pl-7 text-white text-sm focus:outline-none focus:border-emerald-500"
                                    placeholder="45,000"
                                    value={inputs.entryPrice}
                                    onChange={(e) => handleInputChange('entryPrice', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Stop Loss Price */}
                        <div>
                            <label className="block text-xs md:text-sm text-gray-400 mb-1">Stop Loss Price</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                <input
                                    type="number"
                                    className="w-full bg-[#0D0D0D] border border-[#3A3A3A] rounded-md md:rounded-lg py-2 md:py-2.5 px-3 pl-7 text-white text-sm focus:outline-none focus:border-emerald-500"
                                    placeholder="43,500"
                                    value={inputs.stopLossPrice}
                                    onChange={(e) => handleInputChange('stopLossPrice', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Target Price */}
                        <div>
                            <label className="block text-xs md:text-sm text-gray-400 mb-1">
                                Target Price <span className="text-gray-600">(Optional)</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                <input
                                    type="number"
                                    className="w-full bg-[#0D0D0D] border border-[#3A3A3A] rounded-md md:rounded-lg py-2 md:py-2.5 px-3 pl-7 text-white text-sm focus:outline-none focus:border-emerald-500"
                                    placeholder="50,000"
                                    value={inputs.targetPrice}
                                    onChange={(e) => handleInputChange('targetPrice', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Leverage Slider */}
                        <div>
                            <label className="block text-xs md:text-sm text-gray-400 mb-1">
                                Leverage: <span className="text-emerald-500 font-semibold">{inputs.leverage}x</span>
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={inputs.leverage}
                                onChange={(e) => handleInputChange('leverage', e.target.value)}
                                className="w-full h-1 bg-[#3A3A3A] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 md:[&::-webkit-slider-thumb]:w-4 md:[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full"
                            />
                            <div className="flex justify-between text-[10px] md:text-xs text-gray-600 mt-0.5">
                                <span>1x</span>
                                <span>25x</span>
                                <span>50x</span>
                                <span>75x</span>
                                <span>100x</span>
                            </div>
                        </div>

                        {/* Lot Size Input (Futures Only) */}
                        {inputs.assetClass === 'futures' && (
                            <div>
                                <label className="block text-xs md:text-sm text-gray-400 mb-1">Lot Size</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className="w-full bg-[#0D0D0D] border border-[#3A3A3A] rounded-md md:rounded-lg py-2 md:py-2.5 px-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                                        placeholder="50"
                                        value={inputs.lotSize}
                                        onChange={(e) => handleInputChange('lotSize', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Validation Error */}
                        {outputs.validationError && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-md p-2 text-red-400 text-xs">
                                ⚠️ {outputs.validationError}
                            </div>
                        )}

                        {/* Reset Button */}
                        <button
                            onClick={handleReset}
                            className="w-full py-2 md:py-2.5 px-3 bg-transparent border border-[#3A3A3A] rounded-md md:rounded-lg text-gray-400 text-xs md:text-sm font-medium hover:border-gray-500 hover:text-white transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* RIGHT: Results Card - First on mobile, Second on desktop */}
                <div className="order-1 md:order-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg md:rounded-xl overflow-hidden">
                    {/* Green Gradient Header */}
                    <div className="px-3 md:px-4 py-2 md:py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-sm md:text-base font-semibold text-white text-center">
                        Results & Analysis
                    </div>

                    {/* Hero: Position Size */}
                    <div className="text-center py-4 md:py-5 px-3">
                        {outputs.futuresMinRisk ? (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                <div className="text-red-400 text-sm font-semibold mb-1">Insufficient Risk</div>
                                <div className="text-xs text-red-300">
                                    To trade 1 Lot, you must risk at least <span className="font-bold">{formatCurrency(outputs.futuresMinRisk)}</span>.
                                    <br />
                                    Increase your Risk % or widen your Stop Loss.
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="text-xs md:text-sm text-gray-400 mb-1">Position Size</div>
                                <div className="font-mono">
                                    <span className="text-2xl md:text-3xl font-bold text-emerald-500">
                                        {formatNumber(outputs.positionSizeUnits,
                                            inputs.assetClass === 'crypto' ? 4 :
                                                inputs.assetClass === 'stocks' ? 0 : 2
                                        )}
                                    </span>
                                    <span className="text-sm md:text-base text-gray-400 ml-1.5">
                                        {inputs.assetClass === 'stocks' ? 'Shares' :
                                            inputs.assetClass === 'forex' ? 'Lots' : 'Units'}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {formatCurrency(outputs.positionSizeValue)} total value
                                </div>
                            </>
                        )}
                    </div>

                    {/* Result Rows */}
                    <div className="border-t border-[#2A2A2A]">
                        {/* Margin Required */}
                        <div className="flex justify-between items-center px-3 md:px-4 py-2.5 md:py-3 border-b border-[#2A2A2A]">
                            <span className="text-xs md:text-sm text-gray-400">Margin Required</span>
                            <span className={`font-mono text-sm md:text-base font-semibold ${outputs.insufficientMargin ? 'text-red-500' : 'text-white'}`}>
                                {formatCurrency(outputs.marginRequired)}
                            </span>
                        </div>

                        {outputs.insufficientMargin && (
                            <div className="px-3 md:px-4 py-1.5 bg-red-500/10 border-b border-[#2A2A2A]">
                                <span className="text-red-400 text-[10px] md:text-xs">
                                    ⚠️ Need {formatCurrency(outputs.marginRequired - parseFloat(inputs.balance))} more
                                </span>
                            </div>
                        )}

                        {/* Risk Amount */}
                        <div className="flex justify-between items-center px-3 md:px-4 py-2.5 md:py-3 border-b border-[#2A2A2A]">
                            <span className="text-xs md:text-sm text-gray-400">Risk Amount</span>
                            <span className="font-mono text-sm md:text-base font-semibold text-red-500">{formatCurrency(outputs.riskAmount)}</span>
                        </div>

                        {/* Potential Profit */}
                        <div className="flex justify-between items-center px-3 md:px-4 py-2.5 md:py-3 border-b border-[#2A2A2A]">
                            <span className="text-xs md:text-sm text-gray-400">Potential Profit</span>
                            <span className="font-mono text-sm md:text-base font-semibold text-emerald-500">{formatCurrency(outputs.potentialProfit)}</span>
                        </div>

                        {/* Risk:Reward Ratio */}
                        <div className="flex justify-between items-center px-3 md:px-4 py-2.5 md:py-3">
                            <span className="text-xs md:text-sm text-gray-400">Risk:Reward Ratio</span>
                            <span className={`font-mono text-sm md:text-base font-semibold ${outputs.rrr >= 1 ? 'text-emerald-500' : 'text-gray-500'}`}>
                                {outputs.rrr > 0 ? `1:${formatNumber(outputs.rrr, 1)}` : '—'}
                            </span>
                        </div>
                    </div>

                    {/* Formula */}
                    <div className="px-3 py-2 text-center text-[10px] md:text-xs text-gray-600 border-t border-[#2A2A2A]">
                        Position Size = (Balance × Risk%) ÷ |Entry - SL|
                    </div>
                </div>
            </div>
        </div>
    );
}
