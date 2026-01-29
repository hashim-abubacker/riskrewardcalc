"use client";

import { useState } from "react";
import Link from "next/link";
import { FeedbackButton } from "./FeedbackButton";

// Header component with mobile hamburger menu
export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="border-b border-[#27272A] px-4 py-3 bg-[#09090B]">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-xl font-bold text-[#10B981]">Risk</span>
                    <span className="text-xl font-bold text-white">Reward</span>
                    <span className="text-xl font-bold text-[#3B82F6]">Calc</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6 text-sm text-[#A1A1AA]">
                    <Link href="/" className="hover:text-white transition-colors">Calculator</Link>
                    <Link href="/#faq" className="hover:text-white transition-colors">FAQ</Link>
                    <FeedbackButton />
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-white hover:bg-[#27272A] rounded-md"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                    )}
                </button>
            </div>

            {/* Mobile Navigation Dropdown */}
            {isMenuOpen && (
                <nav className="md:hidden border-t border-[#27272A] mt-3 pt-2 flex flex-col gap-2 text-[#A1A1AA]">
                    <Link
                        href="/"
                        className="px-2 py-2 hover:bg-[#27272A] hover:text-white rounded-md transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Calculator
                    </Link>
                    <Link
                        href="/#faq"
                        className="px-2 py-2 hover:bg-[#27272A] hover:text-white rounded-md transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        FAQ
                    </Link>

                    <div className="pt-2 mt-2 border-t border-[#27272A]">
                        <div className="px-2 py-2">
                            <FeedbackButton />
                        </div>
                    </div>
                </nav>
            )}
        </header>
    );
}
