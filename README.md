# Mini Militia - EVVM Staking Game

A web-based survival game integrated with EVVM staking on Arbitrum Sepolia testnet.

## Features

- 🎮 **Mini Militia Survival Game** - Classic side-scrolling shooter
- 💰 **EVVM Staking Integration** - Stake HGM tokens to unlock game bonuses
- 🔗 **Web3 Wallet Support** - Connect with MetaMask
- 🎯 **Staking Bonuses** - Score multipliers, faster respawn, health boosts
- 📊 **Full Staking UI** - Stake, unstake, and claim rewards

## Tech Stack

- **Frontend**: HTML5 Canvas, JavaScript
- **Web3**: ethers.js v5
- **Blockchain**: Arbitrum Sepolia Testnet
- **Smart Contracts**: EVVM Testnet Contracts

## Setup

1. Clone the repository
2. Install dependencies (if any)
3. Open `mini-militia-fresh/index.html` in a browser or use a local server

## Local Development

### Option 1: Vite Dev Server (Recommended - with hot reloading)

```bash
npm install
npm run dev
```

Opens `http://localhost:8080` with hot module replacement - changes appear instantly!

### Option 2: Simple HTTP Server

```bash
cd mini-militia-fresh
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

## Deployment

### Vercel (Auto-Deploy)

1. Push to GitHub
2. Import repository in Vercel
3. Vercel will auto-detect Vite configuration
4. Framework Preset: **Vite** (auto-detected)
5. Build Command: `npm run build` (auto-detected)
6. Output Directory: `dist` (auto-detected)
7. Deploy!

**Note**: Vercel automatically builds and deploys on every push to `main` branch.

## Configuration

- **EVVM ID**: Set in `js/Web3Integration.js` (currently auto-fetched from contract)
- **Contract Addresses**: Configured in `js/Web3Integration.js`
- **Network**: Arbitrum Sepolia (Chain ID: 421614)

## Game Flow

1. **Landing Page** → Connect Wallet
2. **Staking Page** → Stake HGM tokens
3. **Game** → Play with staking bonuses applied

## Staking Bonuses

- **1-10 tokens**: 10% score bonus, faster respawn
- **10-50 tokens**: 25% score bonus, faster respawn, health boost
- **50+ tokens**: 50% score bonus, faster respawn, health boost

## License

EVVM Noncommercial License v1.0

