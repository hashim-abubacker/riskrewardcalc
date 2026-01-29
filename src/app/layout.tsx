import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/Header";

// Dynamic rendering is handled at page level, not layout

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Critical CSS to prevent flash of unstyled content */}
        <style dangerouslySetInnerHTML={{
          __html: `
          html, body { background-color: #09090B !important; color: #ededed !important; }
          * { box-sizing: border-box; }
        ` }} />
        {/* Favicon for all browsers */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#09090B" />
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
          <Header />

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-[#27272A] px-4 py-6 text-center text-sm text-[#71717A]">
            <p>© {new Date().getFullYear()} RiskRewardCalc. Trade smart, manage risk.</p>
          </footer>
        </div>

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-W1ZCGRKYJC"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-W1ZCGRKYJC');
          `}
        </Script>
      </body>
    </html>
  );
}
