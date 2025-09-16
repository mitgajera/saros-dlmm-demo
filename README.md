# Saros DLMM Demo

A comprehensive demonstration application showcasing the power of Saros DLMM (Dynamic Liquidity Market Maker) SDKs. This project demonstrates real-world usage of position management, automated rebalancing, limit orders, and advanced analytics for DeFi liquidity providers.

## 🚀 Features

### Core Functionality
- **Portfolio Analytics Dashboard** - Real-time position tracking, PnL analysis, and risk metrics
- **Advanced Position Management** - Create, modify, and close LP positions with multiple strategies
- **Smart Rebalancing Tools** - Automated rebalancing with momentum, mean reversion, and volatility-adjusted strategies
- **Limit Orders & Stop Loss** - Advanced order types leveraging DLMM bins for precise execution
- **Strategy Simulator** - Backtest and simulate LP strategies with historical data
- **Telegram Bot Integration** - Manage positions and get alerts via Telegram

### Technical Highlights
- **Real SDK Integration** - Uses `@saros-finance/dlmm-sdk` and `@saros-finance/sdk`
- **Production Ready** - Comprehensive error handling, loading states, and user feedback
- **Modern UI/UX** - Beautiful, responsive design with smooth animations
- **Type Safety** - Full TypeScript implementation with proper type definitions
- **Modular Architecture** - Clean separation of concerns with reusable components

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Solana (Devnet/Mainnet)
- **SDKs**: 
  - `@saros-finance/dlmm-sdk` - DLMM operations
  - `@saros-finance/sdk` - AMM, Stake, Farm operations
- **Wallet**: Solana Wallet Adapter
- **UI Components**: Custom components with Tailwind CSS

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mitgajera/saros-dlmm-demo.git
   cd saros-dlmm-demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your configuration:
   ```env
   NEXT_PUBLIC_SOLANA_NETWORK=devnet
   NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
   ```

4. **Run the development server**
```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### Getting Started
1. **Connect Wallet** - Use the wallet button in the top right to connect your Solana wallet
2. **View Positions** - Navigate to the Positions page to see your LP positions
3. **Analyze Performance** - Check the Analytics page for detailed performance metrics
4. **Rebalance Positions** - Use the Rebalance page to optimize your liquidity distribution
5. **Manage Orders** - Create and manage limit orders on the Orders page
6. **Simulate Strategies** - Test different strategies using the Simulator
7. **Connect Telegram** - Set up the Telegram bot for remote management

### Key Features Explained

#### Portfolio Analytics
- **Real-time Metrics**: Total value, fees earned, APY, and risk scores
- **Position Analysis**: Individual position performance and risk assessment
- **Risk Management**: Concentration risk, impermanent loss, and volatility analysis
- **Recommendations**: AI-powered suggestions for position optimization

#### Smart Rebalancing
- **Multiple Strategies**: Centered, momentum, mean reversion, volatility-adjusted
- **Risk Profiles**: Conservative, balanced, and aggressive approaches
- **Real-time Preview**: See distribution changes before executing
- **Gas Estimation**: Cost analysis for rebalancing operations

#### Limit Orders
- **Advanced Order Types**: Buy/sell orders with precise price targeting
- **Stop Loss Orders**: Risk management with automatic position closure
- **Order Book**: Real-time market depth visualization
- **Order Management**: Cancel, modify, and track order status

#### Strategy Simulator
- **Backtesting**: Test strategies against historical data
- **Multiple Strategies**: Compare passive, active, momentum, and mean reversion
- **Risk Metrics**: Sharpe ratio, max drawdown, volatility analysis
- **Performance Visualization**: Charts and detailed metrics

## 🏗️ Architecture

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── analytics/         # Portfolio analytics dashboard
│   ├── orders/            # Limit orders management
│   ├── positions/         # Position management
│   ├── rebalance/         # Smart rebalancing
│   ├── simulator/         # Strategy simulator
│   ├── telegram/          # Telegram bot integration
│   └── page.tsx           # Home page
├── components/            # Reusable UI components
│   ├── MetricCard.tsx     # Metric display component
│   ├── Nav.tsx           # Navigation component
│   ├── PositionTable.tsx # Position table component
│   └── RebalanceForm.tsx # Rebalancing form
├── lib/                   # Core business logic
│   ├── dlmm-service.ts   # DLMM operations service
│   ├── portfolio-service.ts # Portfolio analytics service
│   ├── limit-order-service.ts # Order management service
│   ├── strategy-simulator.ts # Strategy simulation service
│   ├── saros-config.ts   # Configuration and utilities
│   └── dlmm.ts          # DLMM distribution helpers
└── providers.tsx         # React context providers
```

### Key Services

#### DLMM Service (`lib/dlmm-service.ts`)
- Position management (create, modify, close)
- Real-time position data fetching
- Market data and pair information
- Transaction building and execution

#### Portfolio Service (`lib/portfolio-service.ts`)
- Portfolio metrics calculation
- Risk analysis and scoring
- Performance tracking
- Rebalancing recommendations

#### Limit Order Service (`lib/limit-order-service.ts`)
- Order creation and management
- Stop loss order handling
- Order book management
- Order execution monitoring

#### Strategy Simulator (`lib/strategy-simulator.ts`)
- Strategy backtesting
- Performance metrics calculation
- Risk analysis
- Historical data simulation

## 🔧 Configuration

### Network Configuration
The application supports both Devnet and Mainnet configurations:

```typescript
// src/lib/saros-config.ts
export const NETWORKS = {
  devnet: {
    rpc: 'https://api.devnet.solana.com',
    name: 'Devnet',
    active: true
  },
  mainnet: {
    rpc: 'https://api.mainnet-beta.solana.com',
    name: 'Mainnet',
    active: false
  }
};
```

### Trading Pairs
Supported trading pairs are configured in the same file:

```typescript
export const TRADING_PAIRS = {
  'SOL/USDC': {
    base: TOKEN_ADDRESSES.SOL,
    quote: TOKEN_ADDRESSES.USDC,
    name: 'SOL/USDC',
    active: true
  },
  // ... more pairs
};

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Built with ❤️ for the Saros 