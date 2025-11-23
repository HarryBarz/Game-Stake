# EVVM Staking Integration Guide

## Overview

StakeArena is now fully integrated with EVVM staking! Players can stake HGM tokens to earn rewards and get in-game bonuses.

## What's Included

### 1. **Web3 Integration** (`js/Web3Integration.js`)
- Wallet connection (MetaMask)
- Contract interactions
- Signature generation for staking operations
- Network switching to Arbitrum Sepolia

### 2. **Staking UI** (`js/StakingUI.js`)
- Beautiful, modern staking interface
- Real-time balance and staking status
- Stake/Unstake functionality
- Reward claiming
- Auto-refresh every 30 seconds

### 3. **Game Integration** (`js/GameStakingIntegration.js`)
- Staking bonuses applied to game scores
- Faster respawn for stakers
- Health bonuses
- Score multipliers based on staking amount

### 4. **Styling** (`css/staking.css`)
- Gradient backgrounds
- Smooth animations
- Responsive design
- Modern UI/UX

## Setup Instructions

### Step 1: Get Your EVVM ID

After registering your EVVM in the Registry, you need to update the EVVM ID in the code:

1. Find your EVVM ID from the registration transaction
2. Open `js/Web3Integration.js`
3. Find the line with `this.evvmID = '1000';` (appears twice)
4. Replace `'1000'` with your actual EVVM ID (as a string)

**Example:**
```javascript
this.evvmID = '1011'; // Your actual EVVM ID
```

### Step 2: Verify Contract Addresses

The contract addresses are already set from your deployment:
- **Staking Contract**: `0xdB11ba5D0233f05a91409fA0C6f8cFBbB03B627b`
- **EVVM Contract**: `0x29ba6C233FF3a009Ca8263B4A54545Df2b271c47`

If you deployed to a different network or have different addresses, update them in `js/Web3Integration.js`.

### Step 3: Enable Public Staking

Make sure public staking is enabled on your Staking contract. If not, you'll need to:
1. Call `prepareChangeAllowPublicStaking()` as admin
2. Wait 24 hours
3. Call `confirmChangeAllowPublicStaking()`

## How It Works

### For Players:

1. **Connect Wallet**: Click "Staking" button → Connect MetaMask
2. **Stake Tokens**: Enter amount → Click "Stake Tokens"
3. **Get Bonuses**: 
   - 1-10 tokens: 10% score bonus
   - 10-50 tokens: 25% score bonus
   - 50+ tokens: 50% score bonus
4. **Claim Rewards**: Click "Claim Rewards" to get staking rewards

### Staking Bonuses:

- **Score Multiplier**: Higher scores based on staked amount
- **Faster Respawn**: 20% faster respawn time
- **Health Boost**: Extra health on respawn
- **Visual Feedback**: Bonus indicators in game over screen

## Features

### Staking Functions:
- Connect/Disconnect wallet
- View staked amount
- View balance
- Stake tokens (with signature verification)
- Unstake tokens
- Claim rewards
- View staking history

### Game Integration:
- Score multipliers
- Respawn bonuses
- Health boosts
- Visual indicators

## Security

- All transactions require EIP-191 signatures
- Nonce management prevents replay attacks
- Network validation ensures correct chain
- Signature verification on-chain

## Troubleshooting

### "MetaMask not detected"
- Install MetaMask browser extension
- Refresh the page

### "Wrong network"
- The app will prompt to switch to Arbitrum Sepolia
- Click "Approve" in MetaMask

### "Public staking disabled"
- Contact admin to enable public staking
- Or use presale staking if eligible

### "Insufficient balance"
- Get HGM tokens from EVVM treasury
- Or deposit tokens via Treasury contract

### "EVVM ID not set"
- Update the EVVM ID in `Web3Integration.js`
- Make sure you've registered and set the ID on the contract

## Important Notes

1. **EVVM ID Required**: You MUST set your actual EVVM ID in the code for signatures to work
2. **Public Staking**: Must be enabled on the Staking contract
3. **Network**: Currently configured for Arbitrum Sepolia (Chain ID: 421614)
4. **Gas Fees**: Users need ETH on Arbitrum Sepolia for transactions

## Next Steps

1. Set your EVVM ID in the code
2. Test the integration
3. Enable public staking if not already enabled
4. Deploy to your hosting platform
5. Share with players!

## Documentation

- EVVM Staking Docs: https://www.evvm.info/docs/Staking/Introduction
- Contract Addresses: Check your deployment broadcast files
- EVVM ID: From Registry registration transaction

## Enjoy!

Your game now has full EVVM staking integration. Players can stake, earn rewards, and get in-game bonuses!
