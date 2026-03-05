import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    prefixNode?: React.ReactNode;
    suffixNode?: React.ReactNode;
    containerClassName?: string;
    hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', containerClassName = '', prefixNode, suffixNode, hasError, ...props }, ref) => {
        return (
            <div
                className={`input-glow-container rounded-lg px-3 py-3 flex items-center gap-1 ${hasError ? 'border-red-500 focus-within:border-red-500 ring-1 ring-red-500/20' : 'border-[#3A3A3A]'
                    } ${containerClassName}`}
            >
                {prefixNode && <div className="shrink-0">{prefixNode}</div>}
                <input
                    ref={ref}
                    className={`bg-transparent border-none font-mono text-base text-white focus:ring-0 w-full outline-none ${className}`}
                    {...props}
                />
                {suffixNode && <div className="shrink-0">{suffixNode}</div>}
            </div>
        );
    }
);

Input.displayName = 'Input';
