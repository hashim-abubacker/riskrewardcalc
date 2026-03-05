import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'neon' | 'structural';
}

export const Button = ({ children, variant = 'structural', className = '', ...props }: ButtonProps) => {
    const baseClasses = "w-full py-4 rounded-lg font-bold uppercase tracking-[0.3em] text-xs transition-all shadow-lg active:scale-[0.98]";

    const variants = {
        neon: "bg-primary text-black hover:bg-[#00FF9D]/80", // Using primary text
        structural: "bg-[#0a0b0c] border border-white/5 text-gray-500 hover:text-white hover:border-white/10"
    };

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
