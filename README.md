# RiskRewardCalc - Position Size Calculator

RiskRewardCalc is a comprehensive trading tool designed to help crypto, forex, and stock traders manage risk effectively.

[![Visit Website](https://img.shields.io/badge/Visit-RiskRewardCalc.com-emerald?style=for-the-badge&logo=google-chrome)](https://riskrewardcalc.com)

## Features

- **Position Size Calculator**: Calculate exact lot sizes based on your account balance and risk percentage.
- **Crypto Integration**: Live price updates for top cryptocurrencies via CoinGecko API.
- **Multi-Asset Support**: specialized calculators for Crypto, Forex, Stocks, and Futures.
- **Risk Management**: Visualize your risk/reward ratio and potential profit/loss.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma (SQLite for dev, Postgres for prod)
- **Auth**: NextAuth.js
- **Deployment**: VPS / Hostinger

## Getting Started

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/riskrewardcalc.git
    cd riskrewardcalc
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Setup**
    Copy `.env.example` to `.env` and fill in the required keys.
    ```bash
    cp .env.example .env
    ```
    
    You will need:
    - **CoinGecko API Key**: Get a free Demo API key from CoinGecko.
    - **NextAuth Secret**: Generate a random string.
    - **Database URL**: Default is a local SQLite file.

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Author

👤 **Hashim Abubacker**

- Website: [hashim.in](https://hashim.in/)
- LinkedIn: [@hashim-abubacker](https://www.linkedin.com/in/hashim-abubacker/)
- Github: [@hashim-abubacker](https://github.com/hashim-abubacker)
