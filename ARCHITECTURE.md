#  StakeArena Architecture & User Flow

##  **LAYER 1 — SYSTEM ARCHITECTURE OVERVIEW**

```
┌────────────────────────────┐
│        FRONTEND (Web)      │
│  - Connect wallet           │
│  - Deposit/Withdraw screen  │
│  - Staking dashboard        │
│  - Game launcher            │
└───────────────┬────────────┘
                │
                ▼
┌────────────────────────────┐
│         BACKEND API        │
│  - Auth (signature login)  │
│  - Deposits/withdrawals    │
│  - Entitlements (perks)    │
│  - Issue game tokens        │
│  - Session management       │
└───────────────┬────────────┘
                │
                ▼
┌────────────────────────────┐
│      DATABASE (Postgres)   │
│  - Users (wallets)         │
│  - Entitlements (tiers)    │
│  - Deposit history          │
│  - Staking state cache     │
│  - Game session tokens     │
└───────────────┬────────────┘
                │
                ▼
┌────────────────────────────┐
│  INDEXER / GRAPH LISTENER  │
│ - Watches onchain events   │
│   (Deposit, Withdraw,      │
│    Stake, Unstake, Claim)  │
│ - Updates DB                │
└───────────────┬────────────┘
                │
                ▼
┌────────────────────────────┐
│   EVM SMART CONTRACTS      │
│ - Token contract            │
│ - Deposit vault             │
│ - Staking contract          │
│ - Reward distribution       │
└───────────────┬────────────┘
                │
                ▼
┌────────────────────────────┐
│  GAME SERVER (Authoritative)│
│ - Verifies game token       │
│ - Fetches entitlements      │
│ - Applies perks             │
│ - Matchmaking               │
│ - Anti-cheat logic          │
└────────────────────────────┘
```

---

##  **LAYER 2 — USER FLOW (ABSOLUTE FULL LIFECYCLE)**

### **FLOW 0 — User Arrives on Website**

1. Only sees: **Connect Wallet**
2. No UI accessible until connected.

---

### **FLOW 1 — Wallet Connection & Authentication**

#### **Step 1: User clicks Connect Wallet**

Frontend → wallet provider (MetaMask/WalletConnect).

#### **Step 2: Backend issues a nonce**

Frontend calls:

```
GET /auth/nonce
```

Backend returns:

```
nonce: "rnd_129392"
```

#### **Step 3: User signs the nonce**

Wallet → sign message.

#### **Step 4: Backend verifies and creates session**

Frontend sends signature:

```
POST /auth/login
{ address, signature }
```

Backend verifies → returns:

```
sessionToken: "jwt_session_24h"
```

Frontend stores this in memory.

**Now the staking UI is shown.**

---

### **FLOW 2 — Deposit Tokens (Optional)**

*(If your system requires deposit before staking)*

#### **Step 1: User chooses amount to deposit**

Clicks "Deposit 100 tokens".

#### **Step 2: Frontend calls smart contract**

The Deposit Vault contract:

```
deposit(amount)
```

#### **Step 3: Onchain event fires**

`Deposited(address, amount)`

#### **Step 4: Indexer sees deposit**

Updates DB:

```
depositedBalance = old + amount
```

#### **Step 5: Backend returns updated balances**

Frontend fetches:

```
GET /balances
→ { deposited: 100, staked: 0 }
```

---

### **FLOW 3 — Staking (Core Utility)**

#### **Step 1: User clicks "Stake"**

Example: stake 100 tokens.

#### **Step 2: Frontend calls contract**

```
stakingContract.stake(100)
```

#### **Step 3: Transaction mines**

Event:

```
Staked(address, amount, lockUntil)
```

#### **Step 4: Indexer listens**

Updates DB:

```
staked = 100
tier = 1
perk = "+5% damage"
lockUntil = timestamp
```

#### **Step 5: Staking UI updates**

Frontend calls:

```
GET /entitlements
```

Backend responds:

```
{
  staked: 100,
  tier: 1,
  perks: ["5% damage", "unique skin"],
  canPlay: true
}
```

**"Play Game" button unlocks.**

---

### **FLOW 4 — Withdraw (Unstake → Withdraw)**

#### **Step 1: User clicks "Unstake"**

Frontend:

```
stakingContract.unstake(amount)
```

Contract checks:

* Lock period
* Stake balance

Fires event:

```
Unstaked(address, amount)
```

Indexer updates DB:

```
staked = 0
tier = 0
perks = none
```

Backend updates entitlement.

#### **Step 2: Withdraw from vault**

If your vault is separate:

```
vault.withdraw(amount)
```

Indexer:

```
withdrawnBalance += amount
```

User gets tokens back in wallet.

---

### **FLOW 5 — Launching the Game**

#### **Step 1: User clicks "Play Game"**

Frontend requests:

```
POST /game/token
Authorization: sessionToken
```

#### **Step 2: Backend verifies**

* session valid
* wallet still has staked amount
* entitlements exist

Returns:

```
gameToken = "jwt_60_seconds"
```

#### **Step 3: Game client loads**

HTML5 canvas, Unity, Phaser.

#### **Step 4: Game client connects to Game Server**

```
ws://game.server/join?token=jwt_60s
```

#### **Step 5: Game server verifies token**

* Signature
* Expiry
* Entitlements

Game server asks API:

```
GET /game/entitlements?wallet=0x...
```

Backend returns:

```
{ tier: 2, perks: ["+10% damage", "jetpack boost"] }
```

Game server applies perks.

---

### **FLOW 6 — Match Gameplay**

During match:

* Game server is authoritative
* Client only renders graphics
* Server enforces:

  * Health
  * Damage
  * Speed
  * Perks
  * Jetpack fuel
  * Weapon access

Cheaters can't inject perks because server controls everything.

---

### **FLOW 7 — Rewards (Optional)**

At match end:

* Game server tracks performance
* If staking provides reward multipliers → adds bonus
* Backend writes XP/rewards to DB
* User can **Claim** onchain:
  `claimRewards()`

Indexer updates DB.

---

##  **LAYER 3 — FULL DEVELOPER FLOW (BACKEND + INDEXER)**

### 🔄 **1) INDEXER**

Listens to events on chain:

* Deposited
* Withdrawn
* Staked
* Unstaked
* RewardsClaimed

On each event, indexer:

* Pulls event
* Updates PostgreSQL row
* Emits internal event to backend (optional)

---

### 🧠 **2) BACKEND**

Handles:

* auth
* sessions
* entitlements
* generating game tokens
* reading indexer data
* syncing game results
* sending updates to frontend

---

###  **3) GAME SERVER**

Real-time authoritative server:

#### Startup logic:

* Accepts connection with gameToken
* Verifies with backend
* Loads entitlements → perks

#### In match:

* Processes movement
* Processes firing
* Applies perks server-side
* Sends states to clients

#### After match:

* Sends results → backend/DB
* Backend updates rewards

---

##  **END-TO-END USER STORY (HUMAN VERSION)**

A user comes to your website.

1. Connects wallet
2. Signs a message (login)
3. Sees staking dashboard
4. Deposits tokens
5. Stakes tokens
6. Gets perk tier
7. "Play Game" unlocks
8. Enters match with perks
9. Plays game smoothly
10. After season → claims rewards
11. If needed → unstakes + withdraws tokens

Everything is verifiable, secure, and smooth.

---

## 📋 **Implementation Status**

###  Completed
- [x] Frontend wallet connection (MetaMask)
- [x] Staking contract integration
- [x] EVVM signature generation
- [x] Staking UI
- [x] Basic game integration

###  In Progress
- [ ] Backend API (auth, entitlements, game tokens)
- [ ] Database schema
- [ ] Indexer for onchain events
- [ ] Game server with perk enforcement
- [ ] Session management

###  TODO
- [ ] Deposit/Withdraw vault
- [ ] Reward distribution system
- [ ] Matchmaking system
- [ ] Anti-cheat measures
- [ ] Analytics dashboard

---

##  **Technical Stack**

### Frontend
- HTML5 Canvas
- JavaScript (ES6+)
- ethers.js v5
- WebSocket for game client

### Backend (To Be Implemented)
- Node.js / Express or Python / FastAPI
- PostgreSQL
- JWT for sessions
- WebSocket server for game

### Blockchain
- EVVM Testnet Contracts
- Staking Contract
- EVVM Core Contract

### Indexer (To Be Implemented)
- The Graph or custom indexer
- Event listeners
- Database sync

---

##  **Next Steps**

1. **Backend API Implementation**
   - Auth endpoints (`/auth/nonce`, `/auth/login`)
   - Entitlements endpoint (`/entitlements`)
   - Game token generation (`/game/token`)

2. **Database Schema**
   - Users table
   - Entitlements table
   - Staking state cache
   - Game sessions

3. **Indexer Setup**
   - Event listeners for staking contract
   - Database sync logic
   - Real-time updates

4. **Game Server**
   - WebSocket server
   - Token verification
   - Perk enforcement
   - Matchmaking

---

*Last Updated: $(date)*

