'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { formatCurrency as intlFormatCurrency, formatNumber as intlFormatNumber, getCurrencySymbol, SupportedLocale } from '@/lib/formatters';
import { trackAssetClassSwitch, trackRiskModeToggle, trackFormReset, trackResetUndo, trackCalculation } from '@/lib/analytics';
import { FOREX_PAIRS, ForexPair, calculatePipValue } from '@/lib/forexPairs';

type TradeDirection = 'LONG' | 'SHORT';
type RiskMode = 'percent' | 'fiat';
type AssetClass = 'crypto' | 'stocks' | 'forex' | 'futures';
type StopLossMode = 'price' | 'pips';

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
    // Forex-specific
    forexPair: string;
    stopLossMode: StopLossMode;
    stopLossPips: string;
}

interface FieldErrors {
    balance?: string;
    riskPercent?: string;
    riskFiat?: string;
    entryPrice?: string;
    stopLossPrice?: string;
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
    forexMinRisk: number | null;
    pipValue: number | null;
    fieldErrors: FieldErrors;
    isComplete: boolean;
}

const STORAGE_KEY = 'riskrewardcalc_balance';

interface CalculatorProps {
    locale: SupportedLocale;
    defaultAssetClass?: AssetClass;
    defaultForexPair?: string;
    defaultEntryPrice?: string;
    forceUpdateId?: number;
}

export default function Calculator({ locale, defaultAssetClass, defaultForexPair, defaultEntryPrice, forceUpdateId }: CalculatorProps) {
    // Calculator State Initialization
    const [inputs, setInputs] = useState<CalculatorInputs>({
        assetClass: defaultAssetClass || 'crypto',
        balance: '',
        riskMode: 'percent',
        riskPercent: '1',
        riskFiat: '',
        entryPrice: defaultEntryPrice || '',
        stopLossPrice: '',
        targetPrice: '',
        leverage: defaultAssetClass === 'forex' ? '100' : '10',
        lotSize: '50',
        // Forex-specific
        forexPair: defaultForexPair || 'EURUSD',
        stopLossMode: 'price',
        stopLossPips: '',
    });

    // Update entry price when defaultEntryPrice changes (from live price)
    useEffect(() => {
        if (defaultEntryPrice) {
            setInputs(prev => ({ ...prev, entryPrice: defaultEntryPrice }));
        }
    }, [defaultEntryPrice, forceUpdateId]);

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
        forexMinRisk: null,
        pipValue: null,
        fieldErrors: {},
        isComplete: false,
    });

    // Track which fields have been touched for validation
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Reset undo state
    const [previousInputs, setPreviousInputs] = useState<CalculatorInputs | null>(null);
    const [showUndoToast, setShowUndoToast] = useState(false);
    const [toastExiting, setToastExiting] = useState(false);
    const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    // Cleanup undo timeout on unmount
    useEffect(() => {
        return () => {
            if (undoTimeoutRef.current) {
                clearTimeout(undoTimeoutRef.current);
            }
        };
    }, []);

    const calculate = useCallback(() => {
        const balance = parseFloat(inputs.balance) || 0;
        const riskPercent = parseFloat(inputs.riskPercent) || 0;
        const entry = parseFloat(inputs.entryPrice) || 0;
        const sl = parseFloat(inputs.stopLossPrice) || 0;
        const target = parseFloat(inputs.targetPrice) || 0;
        const leverage = parseFloat(inputs.leverage) || 1;

        // Field validation
        const fieldErrors: FieldErrors = {};

        if (touched.balance && !inputs.balance) {
            fieldErrors.balance = 'Account balance is required';
        } else if (touched.balance && balance <= 0) {
            fieldErrors.balance = 'Balance must be greater than 0';
        }

        if (inputs.riskMode === 'percent') {
            if (touched.riskPercent && riskPercent <= 0) {
                fieldErrors.riskPercent = 'Risk must be greater than 0';
            } else if (touched.riskPercent && riskPercent > 100) {
                fieldErrors.riskPercent = 'Risk cannot exceed 100%';
            }
        } else {
            if (touched.riskFiat && parseFloat(inputs.riskFiat) <= 0) {
                fieldErrors.riskFiat = 'Risk amount must be greater than 0';
            }
        }

        if (touched.entryPrice && !inputs.entryPrice) {
            fieldErrors.entryPrice = 'Entry price is required';
        } else if (touched.entryPrice && entry <= 0) {
            fieldErrors.entryPrice = 'Entry price must be greater than 0';
        }

        // Determine active mode for validation
        const isForexPips = inputs.assetClass === 'forex' && inputs.stopLossMode === 'pips';

        if (!isForexPips) {
            if (touched.stopLossPrice && !inputs.stopLossPrice) {
                fieldErrors.stopLossPrice = 'Stop loss price is required';
            } else if (touched.stopLossPrice && sl <= 0) {
                fieldErrors.stopLossPrice = 'Stop loss must be greater than 0';
            }
        } else {
            // Validate Pips input (using same error key 'stopLossPrice' to show under the shared container)
            const pips = parseFloat(inputs.stopLossPips) || 0;
            if (touched.stopLossPrice && !inputs.stopLossPips) {
                fieldErrors.stopLossPrice = 'Stop loss pips is required';
            } else if (touched.stopLossPrice && pips <= 0) {
                fieldErrors.stopLossPrice = 'Pips must be greater than 0';
            }
        }

        // Check if all required fields are complete for calculation
        // For Forex Pips mode, we don't need Stop Loss Price
        const slRequired = !isForexPips;
        const slPips = parseFloat(inputs.stopLossPips) || 0;

        const isComplete = balance > 0 && riskPercent > 0 && entry > 0 && (slRequired ? sl > 0 : slPips > 0);

        let direction: TradeDirection | null = null;
        let validationError: string | null = null;

        if (entry > 0) {
            if (slRequired && sl > 0) {
                if (sl < entry) {
                    direction = 'LONG';
                } else if (sl > entry) {
                    direction = 'SHORT';
                } else {
                    validationError = 'Stop Loss cannot equal Entry Price';
                    if (touched.stopLossPrice) {
                        fieldErrors.stopLossPrice = 'Stop loss cannot equal entry price';
                    }
                }
            } else if (isForexPips && slPips > 0) {
                // In Pips mode, we can't infer direction unless Target is set, or we default.
                // For now, leave direction null or infer from Target if available
                if (target > 0) {
                    direction = target > entry ? 'LONG' : 'SHORT';
                }
            }
        }

        const riskAmount = (balance * riskPercent) / 100;

        let priceDiff = 0;
        if (isForexPips) {
            const selectedPair = FOREX_PAIRS[inputs.forexPair];
            if (selectedPair) {
                priceDiff = slPips * selectedPair.pipSize;
            }
        } else {
            // Round to avoid floating point issues (e.g. 1.2520 - 1.2500 = 0.001999999)
            priceDiff = Math.round(Math.abs(entry - sl) * 1000000000) / 1000000000;
        }

        let positionSizeUnits = priceDiff > 0 ? riskAmount / priceDiff : 0;
        let pipValue: number | null = null;

        // Apply Asset Class Logic
        if (inputs.assetClass === 'stocks') {
            positionSizeUnits = Math.floor(positionSizeUnits);
        } else if (inputs.assetClass === 'forex') {
            // Get the selected forex pair configuration
            const selectedPair = FOREX_PAIRS[inputs.forexPair];
            if (selectedPair) {
                const contractSize = selectedPair.contractSize;
                // For forex: lots = risk / (price_diff * contract_size)
                const rawLots = priceDiff > 0 ? riskAmount / (priceDiff * contractSize) : 0;
                // Round to 2 decimal places (0.01 lot minimum)
                // Add epsilon to handle floating point errors (e.g. 0.499999 -> 0.50)
                positionSizeUnits = Math.floor((rawLots + 0.000000001) * 100) / 100;
                // Calculate pip value for display
                if (positionSizeUnits > 0) {
                    pipValue = calculatePipValue(selectedPair, positionSizeUnits);
                }
            } else {
                // Fallback to standard 100k lot
                positionSizeUnits = positionSizeUnits / 100000;
            }
        } else if (inputs.assetClass === 'futures') {
            const lotSize = parseFloat(inputs.lotSize) || 1;
            positionSizeUnits = Math.floor(positionSizeUnits / lotSize) * lotSize;
        }

        // Calculate Value and Margin based on "Real" units
        let realUnits = positionSizeUnits;
        if (inputs.assetClass === 'forex') {
            const selectedPair = FOREX_PAIRS[inputs.forexPair];
            realUnits = positionSizeUnits * (selectedPair?.contractSize || 100000);
        }

        const positionSizeValue = realUnits * entry;
        const marginRequired = leverage > 0 ? positionSizeValue / leverage : positionSizeValue;

        let potentialProfit = 0;
        let rrr = 0;
        let futuresMinRisk: number | null = null;
        let forexMinRisk: number | null = null;

        if (inputs.assetClass === 'futures' && positionSizeUnits === 0 && priceDiff > 0) {
            const lotSize = parseFloat(inputs.lotSize) || 1;
            futuresMinRisk = lotSize * priceDiff;
        }

        if (inputs.assetClass === 'forex' && priceDiff > 0) {
            const selectedPair = FOREX_PAIRS[inputs.forexPair];
            const minLot = 0.01;
            if (positionSizeUnits < minLot && selectedPair) {
                forexMinRisk = minLot * priceDiff * selectedPair.contractSize;
            }
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
            forexMinRisk,
            pipValue,
            fieldErrors,
            isComplete,
        });
    }, [inputs, touched]);

    useEffect(() => {
        calculate();
    }, [calculate]);

    // Track successful calculations (debounced to avoid spam)
    const calculationTrackedRef = useRef(false);
    useEffect(() => {
        if (outputs.isComplete && !calculationTrackedRef.current) {
            const timeout = setTimeout(() => {
                trackCalculation({
                    asset_class: inputs.assetClass,
                    leverage: parseInt(inputs.leverage) || 1,
                    has_target_price: !!inputs.targetPrice,
                    trade_direction: outputs.tradeDirection,
                });
                calculationTrackedRef.current = true;
            }, 2000); // Track after 2 seconds of stable calculation
            return () => clearTimeout(timeout);
        } else if (!outputs.isComplete) {
            calculationTrackedRef.current = false;
        }
    }, [outputs.isComplete, outputs.tradeDirection, inputs.assetClass, inputs.leverage, inputs.targetPrice]);

    const handleInputChange = (field: keyof CalculatorInputs, value: string) => {
        setInputs(prev => ({ ...prev, [field]: value }));
    };

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const toggleRiskMode = () => {
        const newMode = inputs.riskMode === 'percent' ? 'fiat' : 'percent';
        trackRiskModeToggle(newMode);
        setInputs(prev => ({
            ...prev,
            riskMode: newMode
        }));
    };

    const handleReset = () => {
        // Store previous inputs for undo
        setPreviousInputs({ ...inputs });

        // Clear any existing timeout
        if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
        }

        // Track form reset
        trackFormReset();

        // Reset the form
        setInputs({
            assetClass: inputs.assetClass,
            balance: inputs.balance,
            riskMode: 'percent',
            riskPercent: '1',
            riskFiat: '',
            entryPrice: '',
            stopLossPrice: '',
            targetPrice: '',
            leverage: '10',
            lotSize: '50',
            forexPair: 'EURUSD',
            stopLossMode: 'price',
            stopLossPips: '',
        });
        setTouched({});
        setToastExiting(false);
        setShowUndoToast(true);

        // Auto-hide toast after 5 seconds
        undoTimeoutRef.current = setTimeout(() => {
            setToastExiting(true);
            setTimeout(() => {
                setShowUndoToast(false);
                setPreviousInputs(null);
                setToastExiting(false);
            }, 300);
        }, 5000);
    };

    const handleUndo = () => {
        if (previousInputs) {
            trackResetUndo();
            setInputs(previousInputs);
            setShowUndoToast(false);
            setPreviousInputs(null);
            if (undoTimeoutRef.current) {
                clearTimeout(undoTimeoutRef.current);
            }
        }
    };

    const formatNumber = (num: number, decimals: number = 2): string => {
        if (isNaN(num) || !isFinite(num)) return '0';
        return intlFormatNumber(num, locale, decimals);
    };

    const formatCurrency = (num: number): string => {
        if (isNaN(num) || !isFinite(num)) return intlFormatCurrency(0, locale);
        return intlFormatCurrency(num, locale);
    };

    // Get currency symbol for input fields
    const currencySymbol = getCurrencySymbol(locale);

    // Helper to get input error class
    const getInputClass = (field: keyof FieldErrors, baseClass: string): string => {
        const hasError = outputs.fieldErrors[field];
        return `${baseClass} ${hasError ? 'border-red-500 focus:border-red-500' : 'border-[#3A3A3A] focus:border-emerald-500'}`;
    };

    // Helper to render field error
    const renderFieldError = (field: keyof FieldErrors) => {
        const error = outputs.fieldErrors[field];
        if (!error) return null;
        return (
            <div className="flex items-center gap-1 mt-1 text-red-400 text-xs">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
            </div>
        );
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
                            if (inputs.assetClass !== ac) {
                                trackAssetClassSwitch(inputs.assetClass, ac);
                            }
                            handleInputChange('assetClass', ac);
                            if (ac === 'forex') {
                                handleInputChange('leverage', '100');
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
                            <label className="block text-xs md:text-sm text-gray-400 mb-1">
                                Account Balance
                                <span className="text-red-400 ml-0.5">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{currencySymbol}</span>
                                <input
                                    type="number"
                                    className={getInputClass('balance', 'w-full bg-[#0D0D0D] border rounded-md md:rounded-lg py-2 md:py-2.5 px-3 pl-7 text-white text-sm focus:outline-none')}
                                    placeholder="25,000"
                                    value={inputs.balance}
                                    onChange={(e) => handleInputChange('balance', e.target.value)}
                                    onBlur={() => handleBlur('balance')}
                                    tabIndex={1}
                                />
                            </div>
                            {renderFieldError('balance')}
                        </div>

                        {/* Risk Mode Toggle */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs md:text-sm text-gray-400">
                                    Risk Mode
                                    <span className="text-red-400 ml-0.5">*</span>
                                </label>
                                <div
                                    className="flex items-center gap-1.5 cursor-pointer"
                                    onClick={toggleRiskMode}
                                    role="button"
                                    tabIndex={2}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleRiskMode(); }}
                                    aria-label={`Switch to ${inputs.riskMode === 'percent' ? 'dollar amount' : 'percentage'} mode`}
                                >
                                    <span className={`text-xs ${inputs.riskMode === 'fiat' ? 'text-emerald-400' : 'text-gray-500'}`}>{currencySymbol}</span>
                                    <div className={`relative w-10 md:w-12 h-5 md:h-6 rounded-full transition-colors ${inputs.riskMode === 'percent' ? 'bg-emerald-500' : 'bg-[#3A3A3A]'}`}>
                                        <div className={`absolute top-0.5 md:top-1 w-4 h-4 bg-white rounded-full transition-transform flex items-center justify-center text-[8px] md:text-[10px] font-bold text-gray-900 ${inputs.riskMode === 'percent' ? 'left-5 md:left-6' : 'left-0.5 md:left-1'}`}>
                                            {inputs.riskMode === 'percent' ? '%' : currencySymbol}
                                        </div>
                                    </div>
                                    <span className={`text-xs ${inputs.riskMode === 'percent' ? 'text-emerald-400' : 'text-gray-500'}`}>%</span>
                                </div>
                            </div>
                            <input
                                type="number"
                                className={getInputClass(inputs.riskMode === 'percent' ? 'riskPercent' : 'riskFiat', 'w-full bg-[#0D0D0D] border rounded-md md:rounded-lg py-2 md:py-2.5 px-3 text-white text-sm focus:outline-none')}
                                placeholder={inputs.riskMode === 'percent' ? '1' : '100'}
                                value={inputs.riskMode === 'percent' ? inputs.riskPercent : inputs.riskFiat}
                                onChange={(e) => handleInputChange(
                                    inputs.riskMode === 'percent' ? 'riskPercent' : 'riskFiat',
                                    e.target.value
                                )}
                                onBlur={() => handleBlur(inputs.riskMode === 'percent' ? 'riskPercent' : 'riskFiat')}
                                tabIndex={3}
                            />
                            {renderFieldError(inputs.riskMode === 'percent' ? 'riskPercent' : 'riskFiat')}
                        </div>

                        {/* Entry Price */}
                        <div>
                            <label className="block text-xs md:text-sm text-gray-400 mb-1">
                                Entry Price
                                <span className="text-red-400 ml-0.5">*</span>
                                {outputs.tradeDirection && (
                                    <span className={`ml-1.5 text-xs ${outputs.tradeDirection === 'LONG' ? 'text-emerald-500' : 'text-red-500'}`}>
                                        ({outputs.tradeDirection})
                                    </span>
                                )}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{currencySymbol}</span>
                                <input
                                    type="number"
                                    className={getInputClass('entryPrice', 'w-full bg-[#0D0D0D] border rounded-md md:rounded-lg py-2 md:py-2.5 px-3 pl-7 text-white text-sm focus:outline-none')}
                                    placeholder="45,000"
                                    value={inputs.entryPrice}
                                    onChange={(e) => handleInputChange('entryPrice', e.target.value)}
                                    onBlur={() => handleBlur('entryPrice')}
                                    tabIndex={4}
                                />
                            </div>
                            {renderFieldError('entryPrice')}
                        </div>

                        {/* Stop Loss Input (Price or Pips) */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs md:text-sm text-gray-400">
                                    Stop Loss
                                    <span className="text-red-400 ml-0.5">*</span>
                                </label>

                                {/* Stop Loss Mode Toggle (Forex Only) */}
                                {inputs.assetClass === 'forex' && (
                                    <div
                                        className="flex items-center gap-1.5 cursor-pointer"
                                        onClick={() => {
                                            const newMode = inputs.stopLossMode === 'price' ? 'pips' : 'price';
                                            handleInputChange('stopLossMode', newMode);
                                            // Clear the other field to avoid confusion
                                            if (newMode === 'pips') handleInputChange('stopLossPrice', '');
                                            else handleInputChange('stopLossPips', '');
                                        }}
                                        role="button"
                                        tabIndex={inputs.assetClass === 'forex' ? 5 : -1}
                                    >
                                        <span className={`text-xs ${inputs.stopLossMode === 'price' ? 'text-emerald-400' : 'text-gray-500'}`}>Price</span>
                                        <div className={`relative w-10 md:w-12 h-5 md:h-6 rounded-full transition-colors ${inputs.stopLossMode === 'pips' ? 'bg-emerald-500' : 'bg-[#3A3A3A]'}`}>
                                            <div className={`absolute top-0.5 md:top-1 w-4 h-4 bg-white rounded-full transition-transform flex items-center justify-center text-[8px] md:text-[10px] font-bold text-gray-900 ${inputs.stopLossMode === 'pips' ? 'left-5 md:left-6' : 'left-0.5 md:left-1'}`}>
                                                {inputs.stopLossMode === 'pips' ? 'P' : '$'}
                                            </div>
                                        </div>
                                        <span className={`text-xs ${inputs.stopLossMode === 'pips' ? 'text-emerald-400' : 'text-gray-500'}`}>Pips</span>
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                {inputs.stopLossMode === 'price' ? (
                                    <>
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            className={getInputClass('stopLossPrice', 'w-full bg-[#0D0D0D] border rounded-md md:rounded-lg py-2 md:py-2.5 px-3 pl-7 text-white text-sm focus:outline-none')}
                                            placeholder="43,500"
                                            value={inputs.stopLossPrice}
                                            onChange={(e) => handleInputChange('stopLossPrice', e.target.value)}
                                            onBlur={() => handleBlur('stopLossPrice')}
                                            tabIndex={5}
                                        />
                                    </>
                                ) : (
                                    <input
                                        type="number"
                                        className={getInputClass('stopLossPrice', 'w-full bg-[#0D0D0D] border rounded-md md:rounded-lg py-2 md:py-2.5 px-3 text-white text-sm focus:outline-none')}
                                        placeholder="50"
                                        value={inputs.stopLossPips}
                                        onChange={(e) => handleInputChange('stopLossPips', e.target.value)}
                                        onBlur={() => handleBlur('stopLossPrice')} // Reuse stopLossPrice validation key for simplicity
                                        tabIndex={5}
                                    />
                                )}
                            </div>
                            {renderFieldError('stopLossPrice')}
                        </div>

                        {/* Target Price */}
                        <div>
                            <label className="block text-xs md:text-sm text-gray-400 mb-1">
                                Target Price <span className="text-gray-600">(Optional)</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{currencySymbol}</span>
                                <input
                                    type="number"
                                    className="w-full bg-[#0D0D0D] border border-[#3A3A3A] rounded-md md:rounded-lg py-2 md:py-2.5 px-3 pl-7 text-white text-sm focus:outline-none focus:border-emerald-500"
                                    placeholder="50,000"
                                    value={inputs.targetPrice}
                                    onChange={(e) => handleInputChange('targetPrice', e.target.value)}
                                    tabIndex={6}
                                />
                            </div>
                        </div>

                        {/* Leverage Slider */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs md:text-sm text-gray-400">
                                    Leverage: <span className="text-emerald-500 font-semibold">{inputs.leverage}x</span>
                                </label>
                                <div className="group relative">
                                    <svg className="w-3.5 h-3.5 text-gray-500 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 bottom-full mb-2 w-48 bg-[#2A2A2A] border border-[#3A3A3A] text-gray-300 text-[10px] rounded p-2 pointer-events-none z-10 shadow-lg">
                                        Leverage determines your Margin usage. It does NOT affect the calculate Position Size (Lots), which is based on your Risk Amount.
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Max Leverage based on Asset Class */}
                            {(() => {
                                const maxLeverage = inputs.assetClass === 'forex' ? 500 :
                                    inputs.assetClass === 'stocks' ? 50 : 125;

                                return (
                                    <>
                                        <input
                                            type="range"
                                            min="1"
                                            max={maxLeverage}
                                            value={inputs.leverage}
                                            onChange={(e) => handleInputChange('leverage', e.target.value)}
                                            className="w-full h-1 bg-[#3A3A3A] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 md:[&::-webkit-slider-thumb]:w-4 md:[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full"
                                            tabIndex={7}
                                        />
                                        <div className="flex justify-between text-[10px] md:text-xs text-gray-600 mt-0.5">
                                            <span>1x</span>
                                            <span>{Math.floor(maxLeverage * 0.25)}x</span>
                                            <span>{Math.floor(maxLeverage * 0.5)}x</span>
                                            <span>{Math.floor(maxLeverage * 0.75)}x</span>
                                            <span>{maxLeverage}x</span>
                                        </div>
                                    </>
                                );
                            })()}
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
                                        tabIndex={8}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Forex Pair Selector */}
                        {inputs.assetClass === 'forex' && (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs md:text-sm text-gray-400 mb-1">
                                        Currency Pair
                                    </label>
                                    <select
                                        className="w-full bg-[#0D0D0D] border border-[#3A3A3A] rounded-md md:rounded-lg py-2 md:py-2.5 px-3 text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                                        value={inputs.forexPair}
                                        onChange={(e) => handleInputChange('forexPair', e.target.value)}
                                        tabIndex={8}
                                    >
                                        <optgroup label="Major Pairs">
                                            {Object.values(FOREX_PAIRS).filter(p => p.category === 'major').map((pair) => (
                                                <option key={pair.symbol} value={pair.symbol}>{pair.displayName}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Minor Pairs">
                                            {Object.values(FOREX_PAIRS).filter(p => p.category === 'minor').map((pair) => (
                                                <option key={pair.symbol} value={pair.symbol}>{pair.displayName}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Commodities">
                                            {Object.values(FOREX_PAIRS).filter(p => p.category === 'commodity').map((pair) => (
                                                <option key={pair.symbol} value={pair.symbol}>{pair.displayName}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                    {FOREX_PAIRS[inputs.forexPair] && (
                                        <div className="text-[10px] text-gray-600 mt-1 flex justify-between">
                                            <span>Pip Size: {FOREX_PAIRS[inputs.forexPair].pipSize}</span>
                                            <span>Contract: {FOREX_PAIRS[inputs.forexPair].contractSize.toLocaleString()} units</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Validation Error */}
                        {outputs.validationError && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-md p-2 text-red-400 text-xs flex items-center gap-2">
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {outputs.validationError}
                            </div>
                        )}

                        {/* Reset Button */}
                        <button
                            onClick={handleReset}
                            className="w-full py-2 md:py-2.5 px-3 bg-transparent border border-[#3A3A3A] rounded-md md:rounded-lg text-gray-400 text-xs md:text-sm font-medium hover:border-gray-500 hover:text-white transition-colors"
                            tabIndex={9}
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
                        {outputs.futuresMinRisk || outputs.forexMinRisk ? (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                <div className="text-red-400 text-sm font-semibold mb-1">Insufficient Risk</div>
                                <div className="text-xs text-red-300">
                                    To trade 0.01 Lot, you must risk at least <span className="font-bold">{formatCurrency(outputs.futuresMinRisk || outputs.forexMinRisk || 0)}</span>.
                                    <br />
                                    Increase your Risk % or widen your Stop Loss.
                                </div>
                            </div>
                        ) : !outputs.isComplete ? (
                            // Incomplete input state - H1 feedback
                            <div className="py-2">
                                <div className="text-xs md:text-sm text-gray-500 mb-1">Position Size</div>
                                <div className="font-mono">
                                    <span className="text-2xl md:text-3xl font-bold text-gray-600">—</span>
                                    <span className="text-sm md:text-base text-gray-600 ml-1.5">
                                        {inputs.assetClass === 'stocks' ? 'Shares' :
                                            inputs.assetClass === 'forex' ? 'Lots' : 'Units'}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-2 bg-[#0D0D0D] rounded-md py-2 px-3 inline-block">
                                    💡 Enter balance, entry & stop loss to calculate
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
                                {/* Pip Value Display for Forex */}
                                {inputs.assetClass === 'forex' && outputs.pipValue && (
                                    <div className="text-xs text-emerald-400 mt-1">
                                        1 pip = {formatCurrency(outputs.pipValue)}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Result Rows */}
                    <div className="border-t border-[#2A2A2A]">
                        {/* Margin Required */}
                        <div className="flex justify-between items-center px-3 md:px-4 py-2.5 md:py-3 border-b border-[#2A2A2A]">
                            <span className="text-xs md:text-sm text-gray-400">Margin Required</span>
                            <span className={`font-mono text-sm md:text-base font-semibold ${!outputs.isComplete ? 'text-gray-600' :
                                outputs.insufficientMargin ? 'text-red-500' : 'text-white'
                                }`}>
                                {outputs.isComplete ? formatCurrency(outputs.marginRequired) : '—'}
                            </span>
                        </div>

                        {outputs.insufficientMargin && (
                            <div className="px-3 md:px-4 py-1.5 bg-red-500/10 border-b border-[#2A2A2A]">
                                <span className="text-red-400 text-[10px] md:text-xs flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Need {formatCurrency(outputs.marginRequired - parseFloat(inputs.balance))} more
                                </span>
                            </div>
                        )}

                        {/* Risk Amount */}
                        <div className="flex justify-between items-center px-3 md:px-4 py-2.5 md:py-3 border-b border-[#2A2A2A]">
                            <span className="text-xs md:text-sm text-gray-400">Risk Amount</span>
                            <span className={`font-mono text-sm md:text-base font-semibold ${outputs.isComplete ? 'text-red-500' : 'text-gray-600'
                                }`}>
                                {outputs.isComplete ? formatCurrency(outputs.riskAmount) : '—'}
                            </span>
                        </div>

                        {/* Potential Profit */}
                        <div className="flex justify-between items-center px-3 md:px-4 py-2.5 md:py-3 border-b border-[#2A2A2A]">
                            <span className="text-xs md:text-sm text-gray-400">Potential Profit</span>
                            <span className={`font-mono text-sm md:text-base font-semibold ${outputs.potentialProfit > 0 ? 'text-emerald-500' : 'text-gray-600'
                                }`}>
                                {outputs.potentialProfit > 0 ? formatCurrency(outputs.potentialProfit) : '—'}
                            </span>
                        </div>

                        {/* Risk:Reward Ratio */}
                        <div className="flex justify-between items-center px-3 md:px-4 py-2.5 md:py-3">
                            <span className="text-xs md:text-sm text-gray-400">Risk:Reward Ratio</span>
                            <span className={`font-mono text-sm md:text-base font-semibold ${outputs.rrr >= 1 ? 'text-emerald-500' : 'text-gray-500'}`}>
                                {outputs.rrr > 0 ? `1:${formatNumber(outputs.rrr, 1)}` : '—'}
                            </span>
                        </div>

                        {/* Helper text for RRR when target not entered but other fields are complete */}
                        {outputs.isComplete && !inputs.targetPrice && (
                            <div className="px-3 md:px-4 py-2 bg-[#0D0D0D] border-t border-[#2A2A2A]">
                                <span className="text-gray-500 text-[10px] md:text-xs">
                                    💡 Enter Target Price to see Risk:Reward ratio
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Formula */}
                    <div className="px-3 py-2 text-center text-[10px] md:text-xs text-gray-600 border-t border-[#2A2A2A]">
                        Position Size = (Balance × Risk%) ÷ |Entry - SL|
                    </div>
                </div>
            </div>

            {/* Undo Toast */}
            {showUndoToast && (
                <div
                    className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 z-50 ${toastExiting ? 'toast-exit' : 'toast-enter'}`}
                >
                    <span className="text-sm text-gray-300">Form reset</span>
                    <button
                        onClick={handleUndo}
                        className="text-sm font-medium text-emerald-500 hover:text-emerald-400 transition-colors"
                    >
                        Undo
                    </button>
                    <button
                        onClick={() => {
                            setToastExiting(true);
                            setTimeout(() => {
                                setShowUndoToast(false);
                                setPreviousInputs(null);
                                setToastExiting(false);
                            }, 300);
                        }}
                        className="text-gray-500 hover:text-gray-400 transition-colors ml-1"
                        aria-label="Dismiss"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
