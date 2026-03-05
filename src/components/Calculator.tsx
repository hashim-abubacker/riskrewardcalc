'use client';

import { Card } from '@/components/ui/Card';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Input } from '@/components/ui/Input';
import { MarketPlate } from '@/components/ui/MarketPlate';
import { Slider } from '@/components/ui/Slider';
import { Button } from '@/components/ui/Button';
import { ShareCard } from '@/components/ShareCard';
import html2canvas from 'html2canvas';
import { useState, useEffect, useCallback, useRef } from 'react';
import { formatCurrency as intlFormatCurrency, formatNumber as intlFormatNumber, getCurrencySymbol, SupportedLocale } from '@/lib/formatters';
import { trackAssetClassSwitch, trackRiskModeToggle, trackFormReset, trackResetUndo, trackCalculation } from '@/lib/analytics';
import { FOREX_PAIRS, calculatePipValue } from '@/lib/forexPairs';
import { calculateIndiaCharges, getIndiaLeverage, calculateMaxMarginQty, IndiaCharges, IndiaTradeMode } from '@/lib/indiaCharges';
import { EXCHANGE_PRESETS, DEFAULT_EXCHANGE, getPreset, feeToPercent, percentToFee, OrderType } from '@/lib/exchangePresets';

type TradeDirection = 'LONG' | 'SHORT';
type RiskMode = 'percent' | 'fiat';
type AssetClass = 'crypto' | 'stocks' | 'forex' | 'futures';
type StopLossMode = 'price' | 'pips';
type StockMarket = 'global' | 'india';

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
    // Indian Stocks-specific
    stockMarket: StockMarket;
    indiaTradeMode: IndiaTradeMode;
    // Multiple Targets (Staged Exit)
    useMultipleTargets: boolean;
    target1: string;      // T1 price
    target2: string;      // T2 price
    target3: string;      // T3 price
    allocation1: string;  // % of qty to exit at T1 (default 50%)
    allocation2: string;  // % of qty to exit at T2 (default 30%)
    allocation3: string;  // % of qty to exit at T3 (default 20%)
    // Fee Settings (Crypto/Futures)
    includeFees: boolean;
    exchange: string;
    entryOrderType: OrderType;
    exitOrderType: OrderType;
    makerFeePercent: string;  // displayed as percentage e.g. "0.020"
    takerFeePercent: string;  // displayed as percentage e.g. "0.045"
}

// Staged Exit calculation result
interface StagedExitResult {
    target: number;
    allocation: number;   // % allocation
    quantity: number;     // shares for this target
    profit: number;       // profit at this target
    rrr: number;          // R:R for this target
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
    // Indian Stocks-specific
    marginLimited: boolean;
    maxMarginQty: number;
    riskBasedQty: number;
    indiaCharges: IndiaCharges | null;
    // Multiple Targets
    stagedExits: StagedExitResult[];
    totalStagedProfit: number;
    // Fee Calculations
    entryFee: number;
    exitFee: number;
    totalFee: number;
    realRisk: number;
    breakEvenPrice: number;
    adjustedProfit: number;
    adjustedRRR: number;
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
        assetClass: defaultAssetClass || 'forex',
        balance: '',
        riskMode: 'percent',
        riskPercent: '1',
        riskFiat: '',
        entryPrice: defaultEntryPrice || '',
        stopLossPrice: '',
        targetPrice: '',
        leverage: defaultAssetClass && defaultAssetClass !== 'forex' ? '10' : '100',
        lotSize: '50',
        // Forex-specific
        forexPair: defaultForexPair || 'EURUSD',
        stopLossMode: 'price',
        stopLossPips: '',
        // Indian Stocks-specific
        stockMarket: 'global',
        indiaTradeMode: 'intraday',
        // Multiple Targets (Staged Exit)
        useMultipleTargets: false,
        target1: '',
        target2: '',
        target3: '',
        allocation1: '50',
        allocation2: '30',
        allocation3: '20',
        // Fee Settings
        includeFees: false,
        exchange: DEFAULT_EXCHANGE,
        entryOrderType: 'taker',
        exitOrderType: 'taker',
        makerFeePercent: feeToPercent(getPreset(DEFAULT_EXCHANGE)!.makerFee),
        takerFeePercent: feeToPercent(getPreset(DEFAULT_EXCHANGE)!.takerFee),
    });

    // Update entry price when defaultEntryPrice changes (from live price)
    useEffect(() => {
        if (defaultEntryPrice) {
            setTimeout(() => setInputs(prev => ({ ...prev, entryPrice: defaultEntryPrice })), 0);
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
        // Indian Stocks-specific
        marginLimited: false,
        maxMarginQty: 0,
        riskBasedQty: 0,
        indiaCharges: null,
        // Multiple Targets
        stagedExits: [],
        totalStagedProfit: 0,
        // Fee Calculations
        entryFee: 0,
        exitFee: 0,
        totalFee: 0,
        realRisk: 0,
        breakEvenPrice: 0,
        adjustedProfit: 0,
        adjustedRRR: 0,
    });

    // Track which fields have been touched for validation
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Reset undo state
    const [previousInputs, setPreviousInputs] = useState<CalculatorInputs | null>(null);
    const [showUndoToast, setShowUndoToast] = useState(false);
    const [toastExiting, setToastExiting] = useState(false);
    const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Share functionality
    const shareCardRef = useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = useState(false);

    useEffect(() => {
        const savedBalance = localStorage.getItem(STORAGE_KEY);
        if (savedBalance) {
            setTimeout(() => setInputs(prev => ({ ...prev, balance: savedBalance })), 0);
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
            setTimeout(() => setInputs(prev => ({ ...prev, riskFiat: fiatValue.toFixed(2) })), 0);
        } else {
            const fiat = parseFloat(inputs.riskFiat) || 0;
            const percentValue = balance > 0 ? (fiat / balance) * 100 : 0;
            setTimeout(() => setInputs(prev => ({ ...prev, riskPercent: percentValue.toFixed(2) })), 0);
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

        // Indian Stocks-specific variables
        let marginLimited = false;
        let maxMarginQty = 0;
        let riskBasedQty = 0;
        let indiaCharges: IndiaCharges | null = null;
        let effectiveLeverage = leverage;

        // Apply Asset Class Logic
        if (inputs.assetClass === 'stocks') {
            riskBasedQty = Math.floor(positionSizeUnits);

            if (inputs.stockMarket === 'india') {
                // Indian Stocks: Use SEBI-mandated fixed leverage
                effectiveLeverage = getIndiaLeverage(inputs.indiaTradeMode);

                // Calculate margin-based quantity limit
                maxMarginQty = calculateMaxMarginQty(balance, entry, inputs.indiaTradeMode);

                // Final quantity is the MINIMUM of risk-based and margin-based
                positionSizeUnits = Math.min(riskBasedQty, maxMarginQty);
                marginLimited = maxMarginQty < riskBasedQty && maxMarginQty > 0;
            } else {
                // Global stocks: just use risk-based calculation
                positionSizeUnits = riskBasedQty;
                maxMarginQty = riskBasedQty; // No margin limit for global
            }
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

        // For Indian stocks, use the effective leverage (fixed by SEBI)
        const marginLeverage = inputs.assetClass === 'stocks' && inputs.stockMarket === 'india'
            ? effectiveLeverage
            : leverage;
        const marginRequired = marginLeverage > 0 ? positionSizeValue / marginLeverage : positionSizeValue;

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

        // Fee Calculations (Crypto & Futures only)
        let entryFee = 0;
        let exitFee = 0;
        let totalFee = 0;
        let realRisk = riskAmount;
        let breakEvenPrice = 0;
        let adjustedProfit = potentialProfit;
        let adjustedRRR = rrr;

        const showFees = inputs.includeFees && (inputs.assetClass === 'crypto' || inputs.assetClass === 'futures');
        if (showFees && positionSizeValue > 0) {
            const makerFee = percentToFee(inputs.makerFeePercent);
            const takerFee = percentToFee(inputs.takerFeePercent);
            const entryFeeRate = inputs.entryOrderType === 'maker' ? makerFee : takerFee;
            const exitFeeRate = inputs.exitOrderType === 'maker' ? makerFee : takerFee;

            entryFee = positionSizeValue * entryFeeRate;
            exitFee = positionSizeValue * exitFeeRate;
            totalFee = entryFee + exitFee;
            realRisk = riskAmount + totalFee;

            // Break-even price
            if (entry > 0 && direction) {
                if (direction === 'LONG') {
                    breakEvenPrice = entry * (1 + entryFeeRate + exitFeeRate);
                } else {
                    breakEvenPrice = entry * (1 - entryFeeRate - exitFeeRate);
                }
            }

            // Adjusted profit and R:R
            if (potentialProfit !== 0) {
                adjustedProfit = potentialProfit - totalFee;
                adjustedRRR = riskAmount > 0 ? adjustedProfit / riskAmount : 0;
            }
        }

        // Calculate Indian charges if applicable
        if (inputs.assetClass === 'stocks' && inputs.stockMarket === 'india' && positionSizeUnits > 0 && target > 0) {
            indiaCharges = calculateIndiaCharges(entry, target, positionSizeUnits, inputs.indiaTradeMode);
        }

        // Calculate Staged Exits (Multiple Targets)
        const stagedExits: StagedExitResult[] = [];
        let totalStagedProfit = 0;

        if (inputs.useMultipleTargets && positionSizeUnits > 0 && entry > 0 && riskAmount > 0 && direction) {
            const targets = [
                { price: parseFloat(inputs.target1) || 0, allocation: parseFloat(inputs.allocation1) || 0 },
                { price: parseFloat(inputs.target2) || 0, allocation: parseFloat(inputs.allocation2) || 0 },
                { price: parseFloat(inputs.target3) || 0, allocation: parseFloat(inputs.allocation3) || 0 },
            ];

            for (const t of targets) {
                if (t.price > 0 && t.allocation > 0) {
                    const qty = Math.floor(positionSizeUnits * (t.allocation / 100));
                    let profit = 0;

                    if (direction === 'LONG') {
                        profit = (t.price - entry) * qty;
                    } else {
                        profit = (entry - t.price) * qty;
                    }

                    // Calculate R:R for this target
                    const targetRRR = riskAmount > 0 ? (profit / riskAmount) : 0;

                    stagedExits.push({
                        target: t.price,
                        allocation: t.allocation,
                        quantity: qty,
                        profit: profit,
                        rrr: targetRRR,
                    });

                    totalStagedProfit += profit;
                }
            }
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
            // Indian Stocks-specific
            marginLimited,
            maxMarginQty,
            riskBasedQty,
            indiaCharges,
            // Multiple Targets
            stagedExits,
            totalStagedProfit,
            // Fee Calculations
            entryFee,
            exitFee,
            totalFee,
            realRisk,
            breakEvenPrice,
            adjustedProfit,
            adjustedRRR,
        });
    }, [inputs, touched]);

    useEffect(() => {
        setTimeout(() => calculate(), 0);
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

    const handleShareImage = async () => {
        if (!shareCardRef.current || isSharing) return;

        setIsSharing(true);
        try {
            const canvas = await html2canvas(shareCardRef.current, {
                scale: 2, // High resolution (2160x2160)
                backgroundColor: '#050607',
                logging: false,
                useCORS: true
            });

            const imageURL = canvas.toDataURL('image/png', 0.95);
            const link = document.createElement('a');
            link.href = imageURL;
            const instrumentName = inputs.assetClass === 'forex' ? inputs.forexPair : inputs.assetClass;
            link.download = `trade-setup-${outputs.tradeDirection || 'INFO'}-${instrumentName}-${Date.now()}.png`;
            link.click();
        } catch (error) {
            console.error('Failed to generate image', error);
            alert('Failed to generate sharing image. Please try again.');
        } finally {
            setIsSharing(false);
        }
    };

    const handleInputChange = (field: keyof CalculatorInputs, value: string) => {
        // Handle boolean fields
        if (field === 'useMultipleTargets' || field === 'includeFees') {
            setInputs(prev => ({ ...prev, [field]: value === 'true' }));
        } else {
            setInputs(prev => ({ ...prev, [field]: value }));
        }
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
            stockMarket: inputs.stockMarket,
            indiaTradeMode: 'intraday',
            // Multiple Targets
            useMultipleTargets: false,
            target1: '',
            target2: '',
            target3: '',
            allocation1: '50',
            allocation2: '30',
            allocation3: '20',
            // Fee Settings
            includeFees: false,
            exchange: DEFAULT_EXCHANGE,
            entryOrderType: 'taker',
            exitOrderType: 'taker',
            makerFeePercent: feeToPercent(getPreset(DEFAULT_EXCHANGE)!.makerFee),
            takerFeePercent: feeToPercent(getPreset(DEFAULT_EXCHANGE)!.takerFee),
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
        <div className="max-w-[1060px] mx-auto px-4 py-4 md:py-8">
            {/* Title */}
            <div className="text-center mb-6 md:mb-10">
                <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Smart Position Size &amp; Risk Calculator
                </h1>
                <p className="text-xs md:text-sm tracking-wide" style={{ color: '#6b7280', fontFamily: "'Space Grotesk', sans-serif" }}>
                    Professional grade trade orchestration
                </p>
            </div>

            {/* Asset Class Selector — market-plate skeuomorphic */}
            <div className="w-full max-w-2xl mx-auto mb-8 grid grid-cols-4 gap-2 p-2 rounded-xl" style={{ background: '#050607', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}>
                {(['forex', 'stocks', 'crypto', 'futures'] as AssetClass[]).map((ac) => (
                    <MarketPlate
                        key={ac}
                        active={inputs.assetClass === ac}
                        label={ac.charAt(0).toUpperCase() + ac.slice(1)}
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
                    />
                ))}
            </div>

            {/* Market Region Selector (Stocks Only) */}
            {inputs.assetClass === 'stocks' && (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3 mb-4">
                    <label className="block text-xs md:text-sm text-gray-400 mb-2">
                        Market Region
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleInputChange('stockMarket', 'global')}
                            className={`market-plate flex-1 py-3 px-3 rounded-lg text-xs md:text-[13px] font-bold tracking-wide flex items-center justify-center gap-2 ${inputs.stockMarket === 'global' ? 'active' : ''}`}
                        >
                            <span className={`text-[14px] transition-all ${inputs.stockMarket === 'global' ? '' : 'opacity-50 grayscale'}`}>🌍</span>
                            <span style={{ color: inputs.stockMarket === 'global' ? '#00FF9D' : '#4b5563' }}>Global</span>
                        </button>
                        <button
                            onClick={() => handleInputChange('stockMarket', 'india')}
                            className={`market-plate flex-1 py-3 px-3 rounded-lg text-xs md:text-[13px] font-bold tracking-wide flex items-center justify-center gap-2 ${inputs.stockMarket === 'india' ? 'active' : ''}`}
                        >
                            <span className={`text-[14px] transition-all flex items-center gap-1 ${inputs.stockMarket === 'india' ? 'text-[#00FF9D]' : 'text-[#4b5563]'}`}>
                                <span className={inputs.stockMarket === 'india' ? '' : 'opacity-50 grayscale'}>🇮🇳</span> India (NSE)
                            </span>
                        </button>
                    </div>
                    {inputs.stockMarket === 'india' && (
                        <p className="text-[10px] text-gray-500 mt-1.5">
                            SEBI regulated • Fixed leverage based on trade mode
                        </p>
                    )}
                </div>
            )}

            {/* Trade Mode Selector (Indian Stocks Only) */}
            {inputs.assetClass === 'stocks' && inputs.stockMarket === 'india' && (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3 mb-4">
                    <label className="block text-xs md:text-sm text-gray-400 mb-2">
                        Trade Mode
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleInputChange('indiaTradeMode', 'intraday')}
                            className={`market-plate flex-1 py-3.5 px-3 rounded-lg flex flex-col items-center justify-center gap-1 ${inputs.indiaTradeMode === 'intraday' ? 'active' : ''}`}
                        >
                            <div className={`flex items-center gap-1.5 text-xs md:text-[13px] font-bold tracking-wide ${inputs.indiaTradeMode === 'intraday' ? 'text-[#00FF9D]' : 'text-[#4b5563]'}`}>
                                <span className={inputs.indiaTradeMode === 'intraday' ? '' : 'opacity-50 grayscale'}>⚡</span>
                                <span>Intraday (MIS)</span>
                            </div>
                            <div className="text-[10px]" style={{ color: inputs.indiaTradeMode === 'intraday' ? 'rgba(0,255,157,0.5)' : '#4b5563' }}>5x Leverage</div>
                        </button>
                        <button
                            onClick={() => handleInputChange('indiaTradeMode', 'delivery')}
                            className={`market-plate flex-1 py-3.5 px-3 rounded-lg flex flex-col items-center justify-center gap-1 ${inputs.indiaTradeMode === 'delivery' ? 'active' : ''}`}
                        >
                            <div className={`flex items-center gap-1.5 text-xs md:text-[13px] font-bold tracking-wide ${inputs.indiaTradeMode === 'delivery' ? 'text-orange-300' : 'text-[#4b5563]'}`}>
                                <span className={inputs.indiaTradeMode === 'delivery' ? '' : 'opacity-50 grayscale'}>📦</span>
                                <span style={{ color: inputs.indiaTradeMode === 'delivery' ? '#00FF9D' : '#4b5563' }}>Delivery (CNC)</span>
                            </div>
                            <div className="text-[10px]" style={{ color: inputs.indiaTradeMode === 'delivery' ? 'rgba(0,255,157,0.5)' : '#4b5563' }}>No Leverage</div>
                        </button>
                    </div>
                </div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-stretch">

                {/* LEFT: Trade Setup Card — obsidian chassis */}
                <Card withScrews={true} className="order-2 md:order-1 p-1 rounded-[1.5rem]">
                    <div className="rounded-[1.3rem] h-full border border-white/5 shadow-2xl relative overflow-hidden" style={{ background: '#121417' }}>

                        {/* Card Header */}
                        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white opacity-50">Setup Modules</h2>
                            <span className="text-[10px] font-mono opacity-60" style={{ color: '#00FF9D' }}>SYSTEM READY</span>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 space-y-5">

                            {/* Account Balance */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 ml-1" style={{ color: '#6b7280' }}>
                                    Account Balance ({currencySymbol})
                                </label>
                                <Input
                                    type="number"
                                    className="text-right text-lg"
                                    placeholder="25,000"
                                    value={inputs.balance}
                                    onChange={(e) => handleInputChange('balance', e.target.value)}
                                    onBlur={() => handleBlur('balance')}
                                    tabIndex={1}
                                    prefixNode={<span className="font-mono text-lg" style={{ color: 'rgba(0,255,157,0.25)' }}>{currencySymbol}</span>}
                                    hasError={!!outputs.fieldErrors.balance}
                                />
                                {renderFieldError('balance')}
                            </div>

                            {/* ── Row: Risk Mode (40%) + Entry Price (60%) ── */}
                            <div className="flex gap-3">
                                {/* Risk Mode — 40% */}
                                <div style={{ flex: '0 0 40%' }}>
                                    <div className="flex items-center justify-between mb-1.5 px-1 h-[26px]">
                                        <label className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: '#6b7280' }}>Risk</label>
                                        <div className="flex gap-1 p-0.5 rounded border border-white/5" style={{ background: 'rgba(0,0,0,0.4)' }}>
                                            <button
                                                onClick={() => inputs.riskMode !== 'fiat' && toggleRiskMode()}
                                                className="px-1.5 py-0.5 text-[9px] rounded transition-colors"
                                                style={inputs.riskMode === 'fiat' ? { background: '#00FF9D', color: '#000', fontWeight: 700 } : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}
                                            >{currencySymbol}</button>
                                            <button
                                                onClick={() => inputs.riskMode !== 'percent' && toggleRiskMode()}
                                                className="px-1.5 py-0.5 text-[9px] rounded transition-colors"
                                                style={inputs.riskMode === 'percent' ? { background: '#00FF9D', color: '#000', fontWeight: 700 } : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}
                                            >%</button>
                                        </div>
                                    </div>
                                    <Input
                                        type="number"
                                        className="text-left"
                                        placeholder={inputs.riskMode === 'percent' ? '1' : '100'}
                                        value={inputs.riskMode === 'percent' ? inputs.riskPercent : inputs.riskFiat}
                                        onChange={(e) => handleInputChange(
                                            inputs.riskMode === 'percent' ? 'riskPercent' : 'riskFiat',
                                            e.target.value
                                        )}
                                        onBlur={() => handleBlur(inputs.riskMode === 'percent' ? 'riskPercent' : 'riskFiat')}
                                        tabIndex={2}
                                        suffixNode={<span className="font-mono text-base" style={{ color: 'rgba(0,255,157,0.25)' }}>{inputs.riskMode === 'percent' ? '%' : currencySymbol}</span>}
                                        hasError={!!outputs.fieldErrors[inputs.riskMode === 'percent' ? 'riskPercent' : 'riskFiat']}
                                    />
                                    {renderFieldError(inputs.riskMode === 'percent' ? 'riskPercent' : 'riskFiat')}
                                </div>

                                {/* Entry Price — 60% */}
                                <div style={{ flex: '1 1 0%' }}>
                                    <div className="flex items-center mb-1.5 px-1 h-[26px]">
                                        <label className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: '#6b7280' }}>
                                            Entry Price
                                            {outputs.tradeDirection && (
                                                <span className="ml-1.5 text-[10px]" style={{ color: outputs.tradeDirection === 'LONG' ? '#00FF9D' : '#ef4444' }}>
                                                    ({outputs.tradeDirection})
                                                </span>
                                            )}
                                        </label>
                                    </div>
                                    <Input
                                        type="number"
                                        className="text-right"
                                        placeholder="45,000"
                                        value={inputs.entryPrice}
                                        onChange={(e) => handleInputChange('entryPrice', e.target.value)}
                                        onBlur={() => handleBlur('entryPrice')}
                                        tabIndex={4}
                                        prefixNode={<span className="font-mono text-base" style={{ color: 'rgba(0,255,157,0.25)' }}>{currencySymbol}</span>}
                                        hasError={!!outputs.fieldErrors.entryPrice}
                                    />
                                    {renderFieldError('entryPrice')}
                                </div>
                            </div>

                            {/* ── Row: Stop Loss (50%) + Target Price (50%) ── */}
                            <div className="flex gap-3">
                                {/* Stop Loss — 50% */}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1.5 px-1 h-[26px]">
                                        <label className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: '#ef4444', opacity: 0.8 }}>Stop Loss</label>
                                        {inputs.assetClass === 'forex' && (
                                            <div
                                                className="flex items-center gap-1 cursor-pointer"
                                                onClick={() => {
                                                    const newMode = inputs.stopLossMode === 'price' ? 'pips' : 'price';
                                                    handleInputChange('stopLossMode', newMode);
                                                    if (newMode === 'pips') handleInputChange('stopLossPrice', '');
                                                    else handleInputChange('stopLossPips', '');
                                                }}
                                                role="button"
                                            >
                                                <span className="text-[9px]" style={{ color: inputs.stopLossMode === 'price' ? '#00FF9D' : '#6b7280' }}>Price</span>
                                                <div className="relative w-8 h-4 rounded-full transition-colors" style={{ background: inputs.stopLossMode === 'pips' ? '#00FF9D' : '#3A3A3A' }}>
                                                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${inputs.stopLossMode === 'pips' ? 'left-4' : 'left-0.5'}`} />
                                                </div>
                                                <span className="text-[9px]" style={{ color: inputs.stopLossMode === 'pips' ? '#00FF9D' : '#6b7280' }}>Pips</span>
                                            </div>
                                        )}
                                    </div>
                                    {inputs.stopLossMode === 'price' ? (
                                        <Input
                                            type="number"
                                            className="text-right"
                                            placeholder="43,500"
                                            value={inputs.stopLossPrice}
                                            onChange={(e) => handleInputChange('stopLossPrice', e.target.value)}
                                            onBlur={() => handleBlur('stopLossPrice')}
                                            tabIndex={5}
                                            containerClassName="border-red-500/10 shadow-[inset_0_0_15px_rgba(239,68,68,0.04)]"
                                            hasError={!!outputs.fieldErrors.stopLossPrice}
                                        />
                                    ) : (
                                        <Input
                                            type="number"
                                            className="text-right"
                                            placeholder="50 pips"
                                            value={inputs.stopLossPips}
                                            onChange={(e) => handleInputChange('stopLossPips', e.target.value)}
                                            onBlur={() => handleBlur('stopLossPips')}
                                            tabIndex={5}
                                            containerClassName="border-red-500/10 shadow-[inset_0_0_15px_rgba(239,68,68,0.04)]"
                                        />
                                    )}
                                    {renderFieldError('stopLossPrice')}
                                </div>

                                {/* Target Price — 50% */}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1.5 px-1 h-[26px]">
                                        <label className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: '#6b7280' }}>
                                            Target <span style={{ opacity: 0.5 }}>(opt)</span>
                                        </label>
                                        <div
                                            className="flex items-center gap-1 cursor-pointer"
                                            onClick={() => handleInputChange('useMultipleTargets', (!inputs.useMultipleTargets).toString())}
                                            role="button"
                                        >
                                            <span className="text-[9px]" style={{ color: inputs.useMultipleTargets ? '#00FF9D' : '#6b7280' }}>Multi</span>
                                            <div className="relative w-8 h-4 rounded-full transition-colors" style={{ background: inputs.useMultipleTargets ? '#00FF9D' : '#3A3A3A' }}>
                                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${inputs.useMultipleTargets ? 'left-4' : 'left-0.5'}`} />
                                            </div>
                                        </div>
                                    </div>

                                    {!inputs.useMultipleTargets ? (
                                        <Input
                                            type="number"
                                            className="text-right"
                                            placeholder="50,000"
                                            value={inputs.targetPrice}
                                            onChange={(e) => handleInputChange('targetPrice', e.target.value)}
                                            tabIndex={6}
                                        />
                                    ) : (
                                        <div className="space-y-1.5">
                                            {[
                                                { key: 'target1', alloc: 'allocation1', label: 'T1', color: '#00FF9D' },
                                                { key: 'target2', alloc: 'allocation2', label: 'T2', color: '#60a5fa' },
                                                { key: 'target3', alloc: 'allocation3', label: 'T3', color: '#c084fc' },
                                            ].map(({ key, alloc, label, color }) => (
                                                <div key={key} className="flex gap-1">
                                                    <div className="flex-1 relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold" style={{ color }}>{label}</span>
                                                        <input
                                                            type="number"
                                                            className="w-full rounded-md py-1.5 px-3 pl-6 font-mono text-sm text-white outline-none"
                                                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}
                                                            placeholder="Price"
                                                            value={inputs[key as keyof CalculatorInputs] as string}
                                                            onChange={(e) => handleInputChange(key as keyof CalculatorInputs, e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="w-11 relative">
                                                        <input
                                                            type="number"
                                                            className="w-full rounded-md py-1.5 px-1 pr-4 font-mono text-xs text-white text-center outline-none"
                                                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}
                                                            value={inputs[alloc as keyof CalculatorInputs] as string}
                                                            onChange={(e) => handleInputChange(alloc as keyof CalculatorInputs, e.target.value)}
                                                            max={100} min={0}
                                                        />
                                                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 text-[9px]">%</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {(() => {
                                                const total = (parseFloat(inputs.allocation1) || 0) + (parseFloat(inputs.allocation2) || 0) + (parseFloat(inputs.allocation3) || 0);
                                                const isValid = total === 100;
                                                return (
                                                    <div className="text-[9px] text-right" style={{ color: isValid ? '#00FF9D' : '#f59e0b' }}>
                                                        Total: {total}% {!isValid && '(≠100%)'}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>


                            {/* Leverage Slider - Hide for Indian Stocks */}
                            {!(inputs.assetClass === 'stocks' && inputs.stockMarket === 'india') && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: '#6b7280' }}>
                                            Leverage
                                        </label>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono font-bold text-sm" style={{ color: '#00FF9D', textShadow: '0 0 10px rgba(0,255,157,0.4)' }}>{inputs.leverage}x</span>
                                            <div className="group relative cursor-help">
                                                <svg className="w-3 h-3" style={{ color: '#6b7280' }} fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 bottom-full mb-2 w-44 text-[10px] rounded p-2 pointer-events-none z-10 shadow-lg" style={{ background: '#1a1c1e', border: '1px solid rgba(0,255,157,0.1)', color: '#6b7280' }}>
                                                    Affects Margin only, not Position Size.
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {(() => {
                                        const maxLeverage = inputs.assetClass === 'forex' ? 500 :
                                            inputs.assetClass === 'stocks' ? 50 : 125;

                                        return (
                                            <>
                                                <Slider
                                                    min="1"
                                                    max={maxLeverage.toString()}
                                                    value={inputs.leverage}
                                                    onChange={(e) => handleInputChange('leverage', e.target.value)}
                                                    tabIndex={7}
                                                />
                                                <div className="flex justify-between text-[9px] font-mono mt-1" style={{ color: 'rgba(155,163,175,0.3)' }}>
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
                            )}


                            {/* Fixed Leverage Indicator for Indian Stocks */}
                            {inputs.assetClass === 'stocks' && inputs.stockMarket === 'india' && (
                                <div className="obsidian-chassis p-3 md:p-4 rounded-xl flex flex-col gap-1 border border-white/5" style={{ background: 'rgba(0,0,0,0.3)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-white opacity-80">Leverage (SEBI Fixed)</span>
                                        <span className="text-[#00FF9D] font-mono font-bold text-sm md:text-base drop-shadow-[0_0_8px_rgba(0,255,157,0.3)]">
                                            {inputs.indiaTradeMode === 'intraday' ? '5x' : '1x'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1 font-medium tracking-wide">
                                        {inputs.indiaTradeMode === 'intraday'
                                            ? 'Peak margin rules limit intraday leverage to 5x'
                                            : 'Delivery trades require full payment (no leverage)'}
                                    </p>
                                </div>
                            )}

                            {/* Fee Settings (Crypto & Futures Only) */}
                            {(inputs.assetClass === 'crypto' || inputs.assetClass === 'futures') && (
                                <div className="p-3 rounded-xl border border-white/5 space-y-4" style={{ background: 'rgba(0,0,0,0.3)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-white opacity-80">Fee Settings</span>
                                            <div className="group relative">
                                                <svg className="w-3.5 h-3.5 text-gray-500 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 bottom-full mb-2 w-52 text-[10px] rounded p-2 pointer-events-none z-10 shadow-lg" style={{ background: '#1a1c1e', border: '1px solid rgba(0,255,157,0.1)', color: '#6b7280' }}>
                                                    <strong>Maker</strong> = limit order (lower fee). <strong>Taker</strong> = market order (higher fee). Fees are charged on the full position value.
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleInputChange('includeFees', (!inputs.includeFees).toString())}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${inputs.includeFees ? 'bg-emerald-500' : 'bg-[#3A3A3A]'
                                                }`}
                                            role="switch"
                                            aria-checked={inputs.includeFees}
                                            aria-label="Include Fees"
                                        >
                                            <span
                                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${inputs.includeFees ? 'translate-x-[18px]' : 'translate-x-[3px]'
                                                    }`}
                                            />
                                        </button>
                                    </div>

                                    {/* Fee controls — only visible when includeFees is ON */}
                                    {inputs.includeFees && (
                                        <>
                                            {/* Exchange Preset Dropdown */}
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 ml-1" style={{ color: '#6b7280' }}>Exchange</label>
                                                <div className="input-glow-container rounded-lg p-0.5 relative">
                                                    <select
                                                        className="w-full bg-transparent border-none py-2 px-3 text-white text-sm focus:outline-none focus:ring-0 cursor-pointer appearance-none"
                                                        value={inputs.exchange}
                                                        onChange={(e) => {
                                                            const name = e.target.value;
                                                            handleInputChange('exchange', name);
                                                            const preset = getPreset(name);
                                                            if (preset) {
                                                                handleInputChange('makerFeePercent', feeToPercent(preset.makerFee));
                                                                handleInputChange('takerFeePercent', feeToPercent(preset.takerFee));
                                                            }
                                                        }}
                                                    >
                                                        {EXCHANGE_PRESETS.map((p) => (
                                                            <option key={p.name} value={p.name} className="bg-[#1A1A1A]">{p.name}</option>
                                                        ))}
                                                        <option value="Custom" className="bg-[#1A1A1A]">Custom</option>
                                                    </select>
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                        ▼
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Entry/Exit Order Type Toggles */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 ml-1" style={{ color: '#6b7280' }}>Entry Order</label>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleInputChange('entryOrderType', 'maker')}
                                                            className={`market-plate flex-1 py-1.5 px-2 rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center transition-colors ${inputs.entryOrderType === 'maker' ? 'active shadow-[0_0_10px_rgba(0,255,157,0.2)] text-[#00FF9D]' : 'text-[#4b5563]'}`}
                                                        >Maker</button>
                                                        <button
                                                            onClick={() => handleInputChange('entryOrderType', 'taker')}
                                                            className={`market-plate flex-1 py-1.5 px-2 rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center transition-colors ${inputs.entryOrderType === 'taker' ? 'active shadow-[0_0_10px_rgba(245,158,11,0.2)] text-amber-500' : 'text-[#4b5563]'}`}
                                                        >Taker</button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 ml-1" style={{ color: '#6b7280' }}>Exit Order</label>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleInputChange('exitOrderType', 'maker')}
                                                            className={`market-plate flex-1 py-1.5 px-2 rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center transition-colors ${inputs.exitOrderType === 'maker' ? 'active shadow-[0_0_10px_rgba(0,255,157,0.2)] text-[#00FF9D]' : 'text-[#4b5563]'}`}
                                                        >Maker</button>
                                                        <button
                                                            onClick={() => handleInputChange('exitOrderType', 'taker')}
                                                            className={`market-plate flex-1 py-1.5 px-2 rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center transition-colors ${inputs.exitOrderType === 'taker' ? 'active shadow-[0_0_10px_rgba(245,158,11,0.2)] text-amber-500' : 'text-[#4b5563]'}`}
                                                        >Taker</button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Maker/Taker Fee Inputs */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 ml-1" style={{ color: '#6b7280' }}>Maker Fee</label>
                                                    <Input
                                                        type="number"
                                                        step="0.001"
                                                        className={`text-right ${inputs.exchange !== 'Custom' ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                        value={inputs.makerFeePercent}
                                                        onChange={(e) => handleInputChange('makerFeePercent', e.target.value)}
                                                        readOnly={inputs.exchange !== 'Custom'}
                                                        suffixNode={<span className="font-mono text-base" style={{ color: 'rgba(0,255,157,0.25)' }}>%</span>}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 ml-1" style={{ color: '#6b7280' }}>Taker Fee</label>
                                                    <Input
                                                        type="number"
                                                        step="0.001"
                                                        className={`text-right ${inputs.exchange !== 'Custom' ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                        value={inputs.takerFeePercent}
                                                        onChange={(e) => handleInputChange('takerFeePercent', e.target.value)}
                                                        readOnly={inputs.exchange !== 'Custom'}
                                                        suffixNode={<span className="font-mono text-base" style={{ color: 'rgba(245,158,11,0.25)' }}>%</span>}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Lot Size Input (Futures Only) */}
                            {inputs.assetClass === 'futures' && (
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 ml-1" style={{ color: '#6b7280' }}>
                                        Lot Size
                                    </label>
                                    <Input
                                        type="number"
                                        placeholder="50"
                                        value={inputs.lotSize}
                                        onChange={(e) => handleInputChange('lotSize', e.target.value)}
                                        tabIndex={8}
                                    />
                                </div>
                            )}

                            {/* Forex Pair Selector */}
                            {inputs.assetClass === 'forex' && (
                                <div className="space-y-1.5 mt-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 ml-1" style={{ color: '#6b7280' }}>
                                        Currency Pair
                                    </label>
                                    <div className="input-glow-container rounded-lg p-0.5 relative">
                                        <select
                                            className="w-full bg-transparent border-none py-2 px-3 text-white text-sm focus:outline-none focus:ring-0 cursor-pointer appearance-none"
                                            value={inputs.forexPair}
                                            onChange={(e) => handleInputChange('forexPair', e.target.value)}
                                            tabIndex={8}
                                        >
                                            <optgroup label="Major Pairs" className="bg-[#111111] text-gray-500 font-semibold">
                                                {Object.values(FOREX_PAIRS).filter(p => p.category === 'major').map((pair) => (
                                                    <option key={pair.symbol} value={pair.symbol} className="bg-[#1A1A1A] text-[#e5e7eb] font-normal">{pair.displayName}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Minor Pairs" className="bg-[#111111] text-gray-500 font-semibold">
                                                {Object.values(FOREX_PAIRS).filter(p => p.category === 'minor').map((pair) => (
                                                    <option key={pair.symbol} value={pair.symbol} className="bg-[#1A1A1A] text-[#e5e7eb] font-normal">{pair.displayName}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Commodities" className="bg-[#111111] text-gray-500 font-semibold">
                                                {Object.values(FOREX_PAIRS).filter(p => p.category === 'commodity').map((pair) => (
                                                    <option key={pair.symbol} value={pair.symbol} className="bg-[#1A1A1A] text-[#e5e7eb] font-normal">{pair.displayName}</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                            ▼
                                        </div>
                                    </div>
                                    {FOREX_PAIRS[inputs.forexPair] && (
                                        <div className="text-[10px] text-gray-600 mt-1 flex justify-between px-1">
                                            <span>Pip Size: {FOREX_PAIRS[inputs.forexPair].pipSize}</span>
                                            <span>Contract: {FOREX_PAIRS[inputs.forexPair].contractSize.toLocaleString('en-US')} units</span>
                                        </div>
                                    )}
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
                            <Button
                                variant="structural"
                                onClick={handleReset}
                                className="w-full text-gray-400 hover:text-white py-2"
                                tabIndex={9}
                            >
                                Reset
                            </Button>
                        </div>
                    </div>
                </Card >

                {/* RIGHT: Results Card — obsidian chassis + glass grid */}
                < Card chamfered={true} className="order-1 md:order-2 rounded-[2rem] p-1 overflow-hidden flex flex-col" >
                    {/* Neon Header bar */}
                    < div className="text-black font-bold uppercase tracking-[0.4em] text-[10px] text-center py-3 rounded-t-[28px]" style={{ background: '#00FF9D', fontFamily: "'Space Grotesk', sans-serif" }
                    }>
                        Real - time Analytics
                    </div >
                    {/* Glass grid body */}
                    < GlassPanel className="flex-1 flex flex-col" >

                        {/* Hero: Position Size */}
                        < div className="text-center py-4 md:py-5 px-3" >
                            {
                                outputs.futuresMinRisk || outputs.forexMinRisk ? (
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
                                        {/* Margin Limited Warning for Indian Stocks */}
                                        {inputs.assetClass === 'stocks' && inputs.stockMarket === 'india' && outputs.marginLimited && (
                                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-md py-2 px-3 mt-2 text-left">
                                                <div className="text-amber-400 text-[10px] md:text-xs flex items-center gap-1">
                                                    <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    <span>Margin Limited</span>
                                                </div>
                                                <p className="text-[10px] text-amber-300/70 mt-1">
                                                    Risk suggests {formatNumber(outputs.riskBasedQty, 0)} shares, but margin limits you to {formatNumber(outputs.maxMarginQty, 0)}.
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )
                            }
                        </div >

                        {/* Result Rows */}
                        < div className="border-t border-[#2A2A2A]" >
                            {/* Margin Required */}
                            < div className="flex justify-between items-center px-3 md:px-4 py-2.5 md:py-3 border-b border-[#2A2A2A]" >
                                <span className="text-xs md:text-sm text-gray-400">Margin Required</span>
                                <span className={`font-mono text-sm md:text-base font-semibold ${!outputs.isComplete ? 'text-gray-600' :
                                    outputs.insufficientMargin ? 'text-red-500' : 'text-white'
                                    }`}>
                                    {outputs.isComplete ? formatCurrency(outputs.marginRequired) : '—'}
                                </span>
                            </div >

                            {
                                outputs.insufficientMargin && (
                                    <div className="px-3 md:px-4 py-1.5 bg-red-500/10 border-b border-[#2A2A2A]">
                                        <span className="text-red-400 text-[10px] md:text-xs flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            Need {formatCurrency(outputs.marginRequired - parseFloat(inputs.balance))} more
                                        </span>
                                    </div>
                                )
                            }

                            {/* Risk Amount */}
                            <div className="flex justify-between items-center px-3 md:px-4 py-2.5 md:py-3 border-b border-[#2A2A2A]">
                                <span className="text-xs md:text-sm text-gray-400">Risk Amount</span>
                                <span className={`font-mono text-sm md:text-base font-semibold ${outputs.isComplete ? 'text-red-500' : 'text-gray-600'
                                    }`}>
                                    {outputs.isComplete ? formatCurrency(outputs.riskAmount) : '—'}
                                </span>
                            </div>

                            {/* Fee Breakdown (Crypto & Futures) */}
                            {
                                outputs.isComplete && outputs.totalFee > 0 && (
                                    <>
                                        <div className="flex justify-between items-center px-3 md:px-4 py-1.5 border-b border-[#2A2A2A] bg-[#0D0D0D]">
                                            <span className="text-[10px] md:text-xs text-gray-500">Entry Fee ({inputs.entryOrderType})</span>
                                            <span className="font-mono text-xs md:text-sm text-gray-400">
                                                {formatCurrency(outputs.entryFee)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center px-3 md:px-4 py-1.5 border-b border-[#2A2A2A] bg-[#0D0D0D]">
                                            <span className="text-[10px] md:text-xs text-gray-500">Exit Fee ({inputs.exitOrderType})</span>
                                            <span className="font-mono text-xs md:text-sm text-gray-400">
                                                {formatCurrency(outputs.exitFee)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center px-3 md:px-4 py-2 border-b border-[#2A2A2A]">
                                            <span className="text-xs md:text-sm text-amber-400 font-medium">Total Round-trip Fee</span>
                                            <span className="font-mono text-sm md:text-base font-semibold text-amber-400">
                                                {formatCurrency(outputs.totalFee)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center px-3 md:px-4 py-2.5 md:py-3 border-b border-[#2A2A2A]">
                                            <span className="text-xs md:text-sm text-red-400 font-medium">Real Risk (incl. fees)</span>
                                            <span className="font-mono text-sm md:text-base font-semibold text-red-400">
                                                {formatCurrency(outputs.realRisk)}
                                            </span>
                                        </div>
                                        {outputs.breakEvenPrice > 0 && (
                                            <div className="flex justify-between items-center px-3 md:px-4 py-2.5 md:py-3 border-b border-[#2A2A2A]">
                                                <span className="text-xs md:text-sm text-gray-400">Break-even Price</span>
                                                <span className="font-mono text-sm md:text-base font-semibold text-blue-400">
                                                    {formatCurrency(outputs.breakEvenPrice)}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )
                            }

                            {/* Potential Profit */}
                            <div className="flex justify-between items-center px-3 md:px-4 py-2.5 md:py-3 border-b border-[#2A2A2A]">
                                <span className="text-xs md:text-sm text-gray-400">
                                    {outputs.totalFee > 0 ? 'Adjusted Profit' : 'Potential Profit'}
                                </span>
                                <span className={`font-mono text-sm md:text-base font-semibold ${outputs.adjustedProfit > 0 ? 'text-emerald-500' : outputs.adjustedProfit < 0 ? 'text-red-500' : 'text-gray-600'
                                    }`}>
                                    {outputs.potentialProfit !== 0 || outputs.adjustedProfit !== 0
                                        ? formatCurrency(outputs.totalFee > 0 ? outputs.adjustedProfit : outputs.potentialProfit)
                                        : '—'}
                                </span>
                            </div>

                            {/* Risk:Reward Ratio */}
                            <div className="flex justify-between items-center px-3 md:px-4 py-2.5 md:py-3">
                                <span className="text-xs md:text-sm text-gray-400">
                                    {outputs.totalFee > 0 ? 'Adjusted R:R' : 'Risk:Reward Ratio'}
                                </span>
                                <span className={`font-mono text-sm md:text-base font-semibold ${(outputs.totalFee > 0 ? outputs.adjustedRRR : outputs.rrr) >= 1 ? 'text-emerald-500' : 'text-gray-500'}`}>
                                    {(outputs.totalFee > 0 ? outputs.adjustedRRR : outputs.rrr) > 0
                                        ? `1:${formatNumber(outputs.totalFee > 0 ? outputs.adjustedRRR : outputs.rrr, 1)}`
                                        : '—'}
                                </span>
                            </div>

                            {/* Helper text for RRR when target not entered but other fields are complete */}
                            {
                                outputs.isComplete && !inputs.targetPrice && !inputs.useMultipleTargets && (
                                    <div className="px-3 md:px-4 py-2 bg-[#0D0D0D] border-t border-[#2A2A2A]">
                                        <span className="text-gray-500 text-[10px] md:text-xs">
                                            💡 Enter Target Price to see Risk:Reward ratio
                                        </span>
                                    </div>
                                )
                            }

                            {/* Staged Exit Summary (Multiple Targets) */}
                            {
                                inputs.useMultipleTargets && outputs.stagedExits.length > 0 && outputs.isComplete && (
                                    <div className="border-t border-[#2A2A2A]">
                                        <div className="px-3 md:px-4 py-2 bg-[#0D0D0D]">
                                            <div className="text-xs md:text-sm text-gray-400 font-medium mb-2 flex items-center gap-1.5">
                                                <span>🎯</span>
                                                <span>Staged Exit Summary</span>
                                            </div>

                                            {/* Target Breakdown */}
                                            <div className="space-y-1.5 text-[10px] md:text-xs">
                                                {outputs.stagedExits.map((exit, index) => {
                                                    const colors = ['text-emerald-400', 'text-blue-400', 'text-purple-400'];
                                                    const labels = ['T1', 'T2', 'T3'];
                                                    return (
                                                        <div key={index} className="flex justify-between items-center text-gray-400">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-semibold ${colors[index]}`}>{labels[index]}</span>
                                                                <span className="text-gray-500">
                                                                    {formatCurrency(exit.target)} × {exit.quantity} ({exit.allocation}%)
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={exit.profit > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                                                    {formatCurrency(exit.profit)}
                                                                </span>
                                                                <span className="text-gray-600 text-[9px]">
                                                                    1:{exit.rrr.toFixed(1)}R
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Total Staged Profit */}
                                                <div className="flex justify-between text-gray-300 font-medium pt-1.5 border-t border-[#2A2A2A] mt-1.5">
                                                    <span>Total Staged Profit</span>
                                                    <span className={outputs.totalStagedProfit > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                                        {formatCurrency(outputs.totalStagedProfit)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }

                            {/* Indian Stocks - Estimated Charges Section */}
                            {
                                inputs.assetClass === 'stocks' && inputs.stockMarket === 'india' && outputs.indiaCharges && outputs.isComplete && (
                                    <div className="border-t border-[#2A2A2A]">
                                        <div className="px-3 md:px-4 py-2 bg-[#0D0D0D]">
                                            <div className="text-xs md:text-sm text-gray-400 font-medium mb-2 flex items-center gap-1.5">
                                                <span>📊</span>
                                                <span>Estimated Charges (India)</span>
                                            </div>

                                            {/* Charge Breakdown */}
                                            <div className="space-y-1 text-[10px] md:text-xs">
                                                <div className="flex justify-between text-gray-500">
                                                    <span>STT</span>
                                                    <span>₹{outputs.indiaCharges.stt.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-gray-500">
                                                    <span>Exchange + SEBI</span>
                                                    <span>₹{(outputs.indiaCharges.exchangeCharges + outputs.indiaCharges.sebiTurnover).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-gray-500">
                                                    <span>Stamp Duty</span>
                                                    <span>₹{outputs.indiaCharges.stampDuty.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-gray-500">
                                                    <span>Brokerage</span>
                                                    <span>₹{outputs.indiaCharges.brokerage.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-gray-500">
                                                    <span>GST (18%)</span>
                                                    <span>₹{outputs.indiaCharges.gst.toFixed(2)}</span>
                                                </div>

                                                {/* Total */}
                                                <div className="flex justify-between text-gray-300 font-medium pt-1 border-t border-[#2A2A2A] mt-1">
                                                    <span>Total Charges</span>
                                                    <span className="text-amber-400">₹{outputs.indiaCharges.totalCharges.toFixed(2)}</span>
                                                </div>

                                                {/* Breakeven */}
                                                <div className="flex justify-between text-gray-500">
                                                    <span>Breakeven Movement</span>
                                                    <span>₹{outputs.indiaCharges.breakeven.toFixed(2)}/share</span>
                                                </div>

                                                {/* STCG Tax Provision */}
                                                {outputs.potentialProfit > 0 && outputs.indiaCharges.stcgProvision > 0 && (
                                                    <div className="flex justify-between text-gray-500 pt-1 border-t border-[#2A2A2A] mt-1">
                                                        <span>STCG Tax ({inputs.indiaTradeMode === 'intraday' ? '15%' : '20%'})</span>
                                                        <span className="text-red-400">₹{outputs.indiaCharges.stcgProvision.toFixed(2)}</span>
                                                    </div>
                                                )}

                                                {/* Final Net Profit After Tax */}
                                                {outputs.potentialProfit > 0 && (
                                                    <div className="flex justify-between text-gray-300 font-medium pt-1 border-t border-[#2A2A2A] mt-1">
                                                        <span>🏦 Net Profit (After Tax)</span>
                                                        <span className={outputs.indiaCharges.netProfitAfterTax > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                                            ₹{outputs.indiaCharges.netProfitAfterTax.toFixed(2)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                        </div >

                        {/* Share Setup Button */}
                        {
                            outputs.isComplete && (
                                <div className="p-4 border-t border-[#2A2A2A] bg-[#0D0D0D] flex flex-col items-center">
                                    <Button
                                        variant="structural"
                                        onClick={handleShareImage}
                                        disabled={isSharing}
                                        className={`w-full flex items-center justify-center gap-2 py-3 md:py-4 ${isSharing ? 'opacity-50 cursor-not-allowed text-gray-500 bg-transparent' : 'text-[#00FF9D] hover:bg-[#00FF9D]/10 border-[#00FF9D]/30 transition-all bg-[#00FF9D]/5'}`}
                                        style={!isSharing ? { boxShadow: '0 0 15px rgba(0,255,157,0.05)' } : undefined}
                                    >
                                        {isSharing ? (
                                            <span className="animate-spin w-5 h-5 border-2 border-[#00FF9D] border-t-transparent rounded-full" />
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                        <span className="font-bold tracking-widest uppercase text-xs md:text-sm">{isSharing ? 'Capturing...' : 'Export Setup Image'}</span>
                                    </Button>
                                </div>
                            )
                        }

                        {/* Formula footer */}
                        <div className="px-4 py-3 text-center border-t border-white/5" style={{ background: '#0a0b0c' }}>
                            <span className="text-[8px] font-mono tracking-[0.2em] opacity-30" style={{ color: '#9ca3af' }}>
                                Position Size = (Balance × Risk%) ÷ |Entry − SL|
                            </span>
                        </div>
                    </GlassPanel > {/* end glass-panel-grid */}

                    {/* Bottom bar with grip lines */}
                    <div className="h-7 border-t border-white/5 flex items-center justify-center gap-8 rounded-b-[28px]" style={{ background: '#0a0b0c' }}>
                        <div className="w-14 h-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.5)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.05)' }} />
                        <div className="w-14 h-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.5)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.05)' }} />
                        <div className="w-14 h-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.5)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.05)' }} />
                    </div>
                </Card >
            </div >

            {/* Undo Toast */}
            {
                showUndoToast && (
                    <div
                        className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 z-50 ${toastExiting ? 'toast-exit' : 'toast-enter'}`}
                        style={{ background: '#121417', borderColor: 'rgba(255,255,255,0.08)' }}
                    >
                        <span className="text-sm text-gray-300">Form reset</span>
                        <button
                            onClick={handleUndo}
                            className="text-sm font-medium hover:opacity-80 transition-opacity"
                            style={{ color: '#00FF9D' }}
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
                )
            }

            {/* Hidden Share Card for Image Generation */}
            {
                outputs.isComplete && (
                    <ShareCard
                        ref={shareCardRef}
                        assetName={inputs.assetClass === 'forex' ? inputs.forexPair : inputs.assetClass.toUpperCase()}
                        direction={outputs.tradeDirection}
                        leverage={inputs.leverage}
                        pnlPercent={outputs.marginRequired > 0 ? ((outputs.totalFee > 0 ? outputs.adjustedProfit : outputs.potentialProfit) / outputs.marginRequired * 100) : 0}
                        pnlValue={outputs.totalFee > 0 ? outputs.adjustedProfit : outputs.potentialProfit}
                        entryPrice={inputs.entryPrice}
                        targetPrice={inputs.targetPrice}
                        stopLossPrice={inputs.assetClass === 'forex' && inputs.stopLossMode === 'pips' ? inputs.stopLossPips + ' pips' : inputs.stopLossPrice}
                        rrr={outputs.totalFee > 0 ? outputs.adjustedRRR : outputs.rrr}
                        locale={locale}
                    />
                )
            }
        </div >
    );
}
