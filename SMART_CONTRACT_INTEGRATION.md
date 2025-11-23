# Smart Contract Integration Guide

## Overview

This document describes the smart contract improvements and integration enhancements for the game project.

## New Features

### 1. GameStakingHelper Contract

A helper contract that wraps the Staking contract and provides game-specific utilities.

**Location:** `Testnet-Contracts/src/contracts/game/GameStakingHelper.sol`

**Features:**
- Tier calculation (0-5 based on staked amount)
- Batch operations for multiple users
- Complete staking info in one call
- Event emissions for better frontend tracking
- HGM/Staking token conversion helpers

**Deployment:**
```bash
cd Testnet-Contracts
forge script script/DeployGameHelper.s.sol:DeployGameHelper --rpc-url $RPC_URL --broadcast --verify
```

**Usage:**
```solidity
GameStakingHelper helper = GameStakingHelper(helperAddress);
uint256 tier = helper.getStakingTier(userAddress);
bool canPlay = helper.canPlay(userAddress);
```

### 2. Enhanced Web3Integration

The `Web3Integration.js` class has been significantly enhanced with:

#### New Functions

1. **Transaction Tracking**
   - `waitForTransaction(tx, onStatusUpdate)` - Wait with status callbacks
   - `getTransactionStatus(txHash)` - Check transaction status
   - `watchTransaction(txHash, onUpdate)` - Real-time transaction monitoring

2. **Staking Information**
   - `getStakingTier()` - Get user's tier (0-5)
   - `getUnlockTimes()` - Get unlock timestamps for staking/unstaking
   - `getCompleteStakingInfo()` - Get all staking data in one call
   - `getEstimatedRewards()` - Check reward availability

3. **Enhanced ABI**
   - Added all view functions from Staking contract
   - Added EVVM contract functions
   - Better error handling

#### Example Usage

```javascript
// Get complete staking info
const info = await web3.getCompleteStakingInfo();
console.log(`Tier: ${info.tier}, Staked: ${info.staked}, Can Play: ${info.canPlay}`);

// Watch transaction with updates
await web3.watchTransaction(txHash, (status, data) => {
    console.log(`Transaction status: ${status}`);
});

// Check unlock times
const unlockTimes = await web3.getUnlockTimes();
if (!unlockTimes.canStake) {
    console.log(`Can stake again at: ${unlockTimes.stakeUnlockDate}`);
}
```

## Contract Addresses

### Current Deployment (Arbitrum Sepolia)

- **Staking Contract:** `0xdB11ba5D0233f05a91409fA0C6f8cFBbB03B627b`
- **EVVM Contract:** `0x29ba6C233FF3a009Ca8263B4A54545Df2b271c47`
- **GameStakingHelper:** (Deploy using script above)

## Integration Improvements

### 1. Event Listening

Since the Staking contract doesn't emit events, we use transaction receipts:

```javascript
// Watch for transaction completion
const receipt = await web3.watchTransaction(txHash, (status) => {
    if (status === 'confirmed') {
        // Update UI
        refreshStakingData();
    }
});
```

### 2. Real-time Updates

```javascript
// Poll for updates
setInterval(async () => {
    const info = await web3.getCompleteStakingInfo();
    updateUI(info);
}, 5000); // Every 5 seconds
```

### 3. Better Error Handling

All functions now provide detailed error messages:

```javascript
try {
    await web3.stake(amount);
} catch (error) {
    // Error messages are now more descriptive
    console.error(error.message);
}
```

## Tier System

The game uses a 5-tier system based on staked amount:

- **Tier 0:** No staking (0 tokens)
- **Tier 1:** 1-9 staking tokens
- **Tier 2:** 10-24 staking tokens
- **Tier 3:** 25-49 staking tokens
- **Tier 4:** 50-99 staking tokens
- **Tier 5:** 100+ staking tokens

Tiers can be used to determine:
- Game perks (damage boost, speed, etc.)
- Access to special features
- Reward multipliers

## Transaction Flow

### Staking Flow

1. User enters HGM amount
2. Frontend calculates staking tokens: `HGM / 5083`
3. Generate unique nonce (checks if used)
4. Generate signatures (staking + EVVM)
5. Send transaction
6. Watch transaction status
7. Update UI on confirmation

### Unstaking Flow

1. User enters staking token amount
2. Check unlock times
3. Validate amount (can't unstake more than staked)
4. Check if full unstake (requires full unlock time)
5. Generate signatures
6. Send transaction
7. Watch for confirmation

## Helper Contract Integration

To use the GameStakingHelper contract in your frontend:

```javascript
// Add to Web3Integration constructor
this.HELPER_ADDRESS = '0x...'; // Deploy and add address
this.HELPER_ABI = [
    "function getStakingTier(address user) external view returns (uint256)",
    "function getCompleteStakingInfo(address user) external view returns (uint256 staked, uint256 tier, bool canStake, bool canUnstake, uint256 stakeUnlockTime, uint256 fullUnstakeUnlockTime)",
    "function canPlay(address user) external view returns (bool)",
    "function calculateHGMForStaking(uint256 stakingTokens) external pure returns (uint256)",
    "function calculateStakingFromHGM(uint256 hgmTokens) external pure returns (uint256)"
];

// Setup helper contract
this.helperContract = new ethers.Contract(
    this.HELPER_ADDRESS,
    this.HELPER_ABI,
    this.signer
);
```

## Best Practices

1. **Always check nonce uniqueness** before generating signatures
2. **Validate unlock times** before allowing unstaking
3. **Use transaction watching** for better UX
4. **Cache contract data** to reduce RPC calls
5. **Handle errors gracefully** with user-friendly messages

## Testing

Test the integration:

```javascript
// Test complete flow
async function testStaking() {
    const web3 = new Web3Integration();
    await web3.connectWallet();
    
    // Get initial state
    const before = await web3.getCompleteStakingInfo();
    console.log('Before:', before);
    
    // Stake
    const tx = await web3.stakeHGM('10000');
    await web3.watchTransaction(tx.hash);
    
    // Get updated state
    const after = await web3.getCompleteStakingInfo();
    console.log('After:', after);
}
```

## Next Steps

1. Deploy GameStakingHelper contract
2. Update frontend to use helper contract
3. Implement tier-based game perks
4. Add reward claiming UI
5. Add batch operations for leaderboards

## Troubleshooting

### "Invalid signature" error
- Check EVVM ID matches contract
- Ensure nonce is unique
- Verify message format matches contract

### "Nonce already used" error
- The nonce generation now checks for uniqueness
- If still failing, wait a moment and retry

### Transaction timeout
- Check network connection
- Verify contract addresses are correct
- Ensure sufficient gas

## Support

For issues or questions:
- Check contract addresses in `Web3Integration.js`
- Verify EVVM ID is set correctly
- Check network (Arbitrum Sepolia: 421614)

