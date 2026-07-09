"use client";

import { useState } from "react";

interface CopyButtonProps {
    valueToCopy: string;
    className?: string;
}

export function CopyButton({ valueToCopy, className = "" }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            await navigator.clipboard.writeText(valueToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={`p-1.5 text-gray-500 hover:text-[#00FF9D] hover:bg-[#00FF9D]/10 rounded-md transition-all ${className}`}
            title="Copy to clipboard"
            aria-label="Copy to clipboard"
        >
            {copied ? (
                // Check icon
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#00FF9D]">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            ) : (
                // Copy icon
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            )}
        </button>
    );
}
