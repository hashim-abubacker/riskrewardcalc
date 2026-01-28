"use client";

import { useState } from "react";

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQAccordionProps {
    faqs: FAQItem[];
}

export function FAQAccordion({ faqs }: FAQAccordionProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="space-y-3">
            {faqs.map((faq, index) => (
                <div
                    key={index}
                    className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg overflow-hidden hover:border-[#10B981]/30 transition-colors"
                >
                    <button
                        onClick={() => toggleFAQ(index)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left"
                    >
                        <span className="text-sm md:text-base text-white font-medium pr-4">
                            {faq.question}
                        </span>
                        <svg
                            className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openIndex === index ? 'rotate-180' : ''
                                }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </button>
                    {openIndex === index && (
                        <div className="px-4 pb-4 pt-1">
                            <p className="text-sm text-zinc-400 leading-relaxed">
                                {faq.answer}
                            </p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
