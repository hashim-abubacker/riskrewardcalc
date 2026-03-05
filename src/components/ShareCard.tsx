import React, { forwardRef } from 'react';
import { formatCurrency as intlFormatCurrency, formatNumber as intlFormatNumber, SupportedLocale } from '@/lib/formatters';

interface ShareCardProps {
    assetName: string;
    direction: 'LONG' | 'SHORT' | null;
    leverage: string;
    pnlPercent: number;
    pnlValue: number;
    entryPrice: string;
    targetPrice: string;
    stopLossPrice: string;
    rrr: number;
    locale: SupportedLocale;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
    ({ assetName, direction, leverage, pnlPercent, pnlValue, entryPrice, targetPrice, stopLossPrice, rrr, locale }, ref) => {

        const formatNumber = (num: number, decimals: number = 2) => {
            if (isNaN(num) || !isFinite(num)) return '0';
            return intlFormatNumber(num, locale, decimals);
        };

        const formatCurrency = (num: number) => {
            if (isNaN(num) || !isFinite(num)) return intlFormatCurrency(0, locale);
            return intlFormatCurrency(num, locale);
        };

        const isProfit = pnlValue >= 0;
        const colorClass = isProfit ? 'text-[#00FF9D]' : 'text-[#ef4444]';
        const sign = isProfit ? '+' : '';

        // Generate current date
        const dateString = new Date().toLocaleString(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });

        return (
            <div
                ref={ref}
                className="absolute left-[-9999px] top-[-9999px] flex flex-col bg-[#050607] text-white overflow-hidden pointer-events-none"
                style={{
                    width: '1080px',
                    height: '1080px',
                    fontFamily: "'Inter', sans-serif"
                }}
            >
                {/* Background Styling - Glowing Obsidian effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#121417] to-[#050607]" />

                {/* Decorative glowing orbs */}
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full filter blur-[100px] opacity-20" style={{ background: isProfit ? '#00FF9D' : '#ef4444' }} />
                <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] rounded-full filter blur-[120px] opacity-10" style={{ background: '#3b82f6' }} />

                {/* Grid Overlay for texture */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="relative z-10 flex flex-col h-full p-16 justify-between">
                    {/* Header: App Brand / User */}
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col justify-center">
                            <span className="text-3xl font-bold tracking-wider mb-2">
                                <span className="text-[#00FF9D]">Risk</span> <span className="text-[#ffffff]">Reward</span> <span className="text-[#3b82f6]">Calc</span>
                            </span>
                            <span className="text-[1.3rem] text-[#9ca3af] font-medium tracking-wide">
                                Smart Position Size & Risk Calculator
                            </span>
                        </div>
                        <div className="text-xl text-[#6b7280] font-mono tracking-widest leading-relaxed pt-1">{dateString}</div>
                    </div>

                    {/* Main Content Body */}
                    <div className="flex-1 flex flex-col justify-center mt-12">
                        {/* Asset & Position Info */}
                        <div className="flex items-center gap-6 mb-8 h-20">
                            <span className="text-7xl font-black tracking-tight leading-[1]">{assetName}</span>
                            <div className="flex items-center gap-4">
                                <span className={`text-4xl font-bold leading-[1] mt-1 ${direction === 'LONG' ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                                    {direction || 'TRADE'}
                                </span>
                                <span className="text-3xl font-black text-[#ffffff] px-1 leading-[1] mt-1 opacity-50">|</span>
                                <span className="text-4xl text-[#d1d5db] font-mono leading-[1] mt-1">{leverage}x</span>
                            </div>
                        </div>

                        {/* Huge ROI / PNL */}
                        <div className="mb-24 mt-4">
                            <div className={`text-[12rem] leading-none font-black tracking-tighter drop-shadow-2xl ${colorClass}`} style={{ textShadow: `0 0 80px ${isProfit ? 'rgba(0, 255, 157, 0.4)' : 'rgba(239, 68, 68, 0.4)'}` }}>
                                {sign}{formatNumber(pnlPercent)}%
                            </div>
                        </div>

                        {/* Trade Details Grid */}
                        <div className="grid grid-cols-2 gap-x-16 gap-y-12 max-w-4xl mt-auto">
                            <div className="flex flex-col gap-2">
                                <span className="text-3xl text-[#9ca3af] uppercase tracking-widest font-semibold">Entry Price</span>
                                <span className="text-5xl font-mono font-bold text-[#ffffff] shadow-sm">{entryPrice}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-3xl text-[#9ca3af] uppercase tracking-widest font-semibold">Target Price</span>
                                <span className="text-5xl font-mono font-bold text-[#ffffff] shadow-sm">{targetPrice || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-3xl text-[#9ca3af] uppercase tracking-widest font-semibold">Stop Loss</span>
                                <span className="text-5xl font-mono font-bold text-[#ffffff] shadow-sm">{stopLossPrice || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-3xl text-[#9ca3af] uppercase tracking-widest font-semibold">Risk/Reward</span>
                                <span className="text-5xl font-mono font-bold text-[#00FF9D] shadow-sm">1 : {formatNumber(rrr)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-16 pt-8 border-t border-[rgba(255,255,255,0.1)] flex justify-between items-center">
                        <div className="text-2xl text-[#6b7280] font-medium tracking-wide">
                            Created with riskrewardcalc.com
                        </div>
                        <img src="/apple-touch-icon.png" alt="Favicon" className="w-14 h-14 rounded-[14px]" />
                    </div>
                </div>
            </div>
        );
    }
);

ShareCard.displayName = 'ShareCard';
