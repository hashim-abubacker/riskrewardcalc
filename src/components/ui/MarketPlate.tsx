import React from 'react';

interface MarketPlateProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    active?: boolean;
    label: string;
}

export const MarketPlate = ({ active = false, label, className = '', ...props }: MarketPlateProps) => {
    return (
        <button
            className={`group market-plate py-3 rounded-lg flex flex-col items-center gap-1.5 ${active ? 'active' : ''} ${className}`}
            {...props}
        >
            <span
                className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 ${active ? 'text-[#00FF9D]' : 'text-[#4b5563] group-hover:text-[#9ca3af]'}`}
            >
                {label}
            </span>
            <div className={`w-1 h-1 rounded-full glow-dot ${active ? 'active' : 'group-hover:bg-[#4b5563]'}`} />
        </button>
    );
};
