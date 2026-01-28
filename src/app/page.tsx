"use client";

import { useState } from "react";
import Calculator from "@/components/Calculator";
import { LocaleSelector } from "@/components/LocaleSelector";
import { FAQAccordion } from "@/components/FAQAccordion";
import { FeedbackButton } from "@/components/FeedbackButton";
import { generateOrganizationSchema, generateWebApplicationSchema } from "@/lib/structured-data";
import { SupportedLocale } from "@/lib/formatters";

const HOMEPAGE_FAQS = [
  {
    question: "Can I use this calculator for Indian Stock Market (Nifty/BankNifty)?",
    answer: "Yes! For Indian Intraday or Delivery equity trades, use the 'Stocks' tab. If you are trading F&O (Futures & Options) like Nifty 50 or BankNifty, switch to the 'Futures' tab. This allows you to input the specific Lot Size (e.g., 25 for Nifty, 15 for BankNifty) to get an accurate position size that respects your risk limit."
  },
  {
    question: "Does this calculator work for Crypto Futures on Binance or Bybit?",
    answer: "Absolutely. Select the 'Crypto' tab to enable decimal precision (e.g., 0.005 BTC). The calculator works for all major exchanges including Binance, Bybit, and KuCoin. It automatically calculates the correct position size whether you are using high leverage (Cross/Isolated) or spot trading."
  },
  {
    question: "Why does my leverage not change my 'Risk Amount'?",
    answer: "This is a common misconception! Leverage only changes the Margin (collateral) needed to open the trade, not how much you lose if your Stop Loss is hit. Our calculator focuses on your 'Wallet Risk'—ensuring that if your Stop Loss is hit, you only lose exactly what you intended (e.g., $10), regardless of whether you used 1x or 100x leverage."
  },
  {
    question: "Is this trading calculator free to use?",
    answer: "Yes, RiskRewardCalc is a 100% free PWA. You can install it on your mobile home screen for offline access."
  }
];

export default function Home() {
  const [locale, setLocale] = useState<SupportedLocale>('en-US');
  const organizationSchema = generateOrganizationSchema();
  const webAppSchema = generateWebApplicationSchema();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": HOMEPAGE_FAQS.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen py-4">
        {/* Main Home Layout */}
        {/* Locale Selector & Feedback Button */}
        <div className="max-w-[1000px] mx-auto px-3 mb-4 flex justify-end gap-2">
          <FeedbackButton />
          <LocaleSelector onLocaleChange={setLocale} />
        </div>

        {/* Calculator */}
        <Calculator locale={locale} />

        {/* SEO Content Block */}
        <div className="max-w-[1000px] mx-auto px-3 mt-8 md:mt-12">
          <div className="bg-[#18181b] border border-[#27272A] rounded-xl p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
              How to use this Position Size Calculator
            </h2>
            <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
              This free Position Size Calculator helps traders manage risk across Crypto, Forex, and Indian Stocks (F&O). Unlike a simple Crypto Profit Calculator, this tool focuses on capital preservation. Perfect for calculating lot sizes on Binance Futures, Bybit, and Nifty Options while respecting your risk tolerance.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq" className="max-w-[1000px] mx-auto px-3 mt-8 md:mt-12 pb-12">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-6 text-center md:text-left">
            Frequently Asked Questions
          </h2>
          <FAQAccordion faqs={HOMEPAGE_FAQS} />
        </div>
      </div>
    </>
  );
}
