import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FeedbackButton } from "@/components/FeedbackButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Position Size Calculator & Crypto Profit Tool | RiskRewardCalc",
  description: "Free Position Size Calculator for Crypto, Forex, and Stocks. Calculate exact lot sizes, stop loss levels, and leverage risk management in seconds.",
  keywords: ["position size calculator", "crypto profit calculator", "lot size calculator", "risk management", "trading calculator", "crypto trading", "forex calculator", "leverage calculator", "RRR calculator"],
  authors: [{ name: "RiskRewardCalc" }],
  metadataBase: new URL('https://riskrewardcalc.com'),

  openGraph: {
    title: "Position Size Calculator & Crypto Profit Tool | RiskRewardCalc",
    description: "Calculate your position size based on wallet risk for crypto, forex, stocks, and futures trading.",
    type: "website",
    url: 'https://riskrewardcalc.com',
    siteName: 'RiskRewardCalc',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'RiskRewardCalc - Position Size Calculator',
      },
    ],
    locale: 'en_US',
  },

  twitter: {
    card: 'summary_large_image',
    title: "Position Size Calculator & Crypto Profit Tool | RiskRewardCalc",
    description: "Calculate your position size based on wallet risk for crypto, forex, stocks, and futures trading.",
    images: ['/og-image.jpg'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10B981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="RiskRewardCalc" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#09090B] text-[#ededed]`}
      >
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="border-b border-[#27272A] px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-[#10B981]">Risk</span>
                <span className="text-xl font-bold text-white">Reward</span>
                <span className="text-xl font-bold text-[#3B82F6]">Calc</span>
              </div>
              {/* Placeholder for settings/language toggle */}
              <nav className="flex items-center gap-4 text-sm text-[#A1A1AA]">
                <a href="/" className="hover:text-white transition-colors">Calculator</a>
                <a href="/blog" className="hover:text-white transition-colors">Blog</a>
                <a href="/#faq" className="hover:text-white transition-colors">FAQ</a>
                <FeedbackButton />
              </nav>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-[#27272A] px-4 py-6 text-center text-sm text-[#71717A]">
            <p>© {new Date().getFullYear()} RiskRewardCalc. Trade smart, manage risk.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
