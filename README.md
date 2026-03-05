# RiskRewardCalc — Position Size Calculator

RiskRewardCalc is a free, no-login trading tool that helps crypto, forex, and stock traders calculate optimal position sizes and manage risk effectively.

[![Visit Website](https://img.shields.io/badge/Visit-RiskRewardCalc.com-emerald?style=for-the-badge&logo=google-chrome)](https://riskrewardcalc.com)

## Features

- **Position Size Calculator** — Calculate exact lot sizes based on account balance and risk %
- **Multi-Asset Support** — Dedicated calculators for Crypto, Forex, Stocks, and Futures (F&O)
- **Live Crypto Prices** — Real-time price updates via CoinGecko API
- **Fee-Adjusted Results** — Accounts for exchange maker/taker fees
- **Multiple Targets** — Plan staged exits with T1, T2, T3 target prices
- **Currency Formatting** — Support for USD, INR, EUR, GBP, and more
- **PWA** — Installable on mobile for offline use

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API**: CoinGecko (live crypto prices)
- **Email**: Nodemailer via Hostinger SMTP (feedback form)
- **Deployment**: Hostinger VPS + Cloudflare CDN

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/hashim-abubacker/riskrewardcalc.git
   cd riskrewardcalc
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Copy `.env.example` to `.env` and fill in the required values:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   - `NEXT_PUBLIC_COINGECKO_API_KEY` — Free Demo key from [CoinGecko](https://www.coingecko.com/en/api)
   - `EMAIL_SERVER_HOST` / `EMAIL_SERVER_USER` / `EMAIL_SERVER_PASSWORD` — SMTP credentials for feedback emails
   - `NEXT_PUBLIC_GA_ID` — Google Analytics ID (optional)
   - `NEXT_PUBLIC_CLARITY_ID` — Microsoft Clarity ID (optional)

4. **Run Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Author

👤 **Hashim Abubacker**

- Website: [hashim.in](https://hashim.in/)
- LinkedIn: [@hashim-abubacker](https://www.linkedin.com/in/hashim-abubacker/)
- GitHub: [@hashim-abubacker](https://github.com/hashim-abubacker)
