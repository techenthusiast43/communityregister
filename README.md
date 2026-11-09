# CommunityRegister – BOT Chain dApp

A modern, decentralized membership registration and community verification platform built natively for **BOT Chain**. 

CommunityRegister allows users to create decentralized communities on-chain and enables any wallet address to register as an active member. All community creation, membership joins, departures, and historical records are immutably signed and verified via smart contracts on BOT Chain.

---

## Key Features

1. **Home Dashboard**
   - Live explore view querying real-time community records directly from BOT Chain.
   - Real-time search across community name, description, creator address, or unique ID.
   - Filter by All Communities, Communities Joined by Connected Wallet, or Communities Created by Me.
   - Community status cards displaying active member counts and quick-join/leave actions.

2. **Create Community**
   - Connect Web3 wallet (Reown AppKit, MetaMask, TokenPocket, etc.).
   - Set Community Name and Short Description.
   - Built-in Unique Community ID generator creating deterministic `bytes32` identifiers (`keccak256`).
   - Live card preview before submission.
   - Transaction status feedback with real-time BOT Chain block explorer links (`scan.bohr.life` / `scan.botchain.ai`).

3. **Community Details & Member Roster**
   - Comprehensive view of community metadata, creator wallet, and creation timestamp.
   - One-click **Join Community** and **Leave Community** actions.
   - Complete table of registered member addresses with registration timestamps and block explorer links.
   - Creator-only community detail update actions.

4. **My Communities Dashboard**
   - Filtered tabs: **Created by Me** and **Communities I Joined**.
   - Manage your communities, inspect member counts, or leave groups.

5. **Member Verification Portal**
   - Independent verification tool to check if any wallet address is currently an active member of a given community.
   - Displays on-chain verification badge, first joined date, last activity timestamp, and lifetime join count.
   - "Use My Connected Wallet" quick autofill.

---

## Official BOT Chain Network Configurations

| Parameter | BOT Chain Testnet | BOT Chain Mainnet |
| :--- | :--- | :--- |
| **Network Name** | BOT Chain Testnet | BOT Chain |
| **Chain ID (Decimal)** | `968` | `677` |
| **Chain ID (Hex)** | `0x3c8` | `0x2a5` |
| **RPC URL** | `https://rpc.bohr.life` | `https://rpc.botchain.ai` |
| **Native Token** | `BOT` (18 Decimals) | `BOT` (18 Decimals) |
| **Total Supply** | 150 Million | 150 Million |
| **Block Explorer** | [https://scan.bohr.life](https://scan.bohr.life) | [https://scan.botchain.ai](https://scan.botchain.ai) |
| **Testnet Faucet** | [https://faucet.botchain.ai/basic](https://faucet.botchain.ai/basic) | N/A |

---

## Smart Contract Architecture (`CommunityRegister.sol`)

The smart contract is written in Solidity `^0.8.24` and compiled with optimizer enabled (`runs: 200`).

### Core Interface
- `createCommunity(bytes32 communityId, string name, string description)`: Registers a new unique community.
- `updateCommunity(bytes32 communityId, string name, string description)`: Allows only the original creator to update details.
- `joinCommunity(bytes32 communityId)`: Joins an existing community. Reverts if already a member.
- `leaveCommunity(bytes32 communityId)`: Leaves a community with $O(1)$ gas-efficient swap-and-pop from active member list.
- `getCommunity(bytes32 communityId)`: Returns full metadata, creator, timestamp, and active count.
- `isMember(bytes32 communityId, address member)`: Checks active membership.
- `getMemberCount(bytes32 communityId)`: Returns current active member count.
- `getMembers(bytes32 communityId)`: Returns list of active member addresses.
- `getMemberRecord(bytes32 communityId, address member)`: Returns full historical record (`isActive`, `firstJoinedAt`, `lastJoinedAt`, `leftAt`, `joinCount`).
- `getAllCommunityIds()`: Returns all registered community IDs.
- `getCommunitiesByCreator(address creator)`: Returns communities created by a specific wallet.
- `getUserJoinedCommunities(address user)`: Returns communities ever joined by a specific wallet.

---

## Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite
- **Web3 Integration:** `@reown/appkit`, `@reown/appkit-adapter-wagmi`, `wagmi` 2.x, `viem`, `ethers` v6, `@tanstack/react-query`
- **Smart Contract & Tooling:** Solidity `0.8.24`, Hardhat, `@nomicfoundation/hardhat-toolbox`
- **Icons:** `lucide-react`

---

## Installation & Setup

### 1. Prerequisites
- Node.js (v18+ or v20+)
- npm or pnpm

### 2. Clone and Install Dependencies
```bash
git clone <repo-url> communityRegister
cd communityRegister
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate `.env` with your private key (if deploying) and contract addresses:
```env
PRIVATE_KEY=your_private_key_without_0x
VITE_COMMUNITY_REGISTER_ADDRESS_TESTNET=
VITE_COMMUNITY_REGISTER_ADDRESS_MAINNET=
VITE_WALLETCONNECT_PROJECT_ID=
```

---

## Testing & Verification

Comprehensive Hardhat unit tests verify all business rules:
- Duplicate membership rejection
- Leaving and rejoining (with timestamp preservation)
- Unauthorized community updates (non-creator rejection)
- Input validation (empty names, zero hash community IDs)
- Member verification queries

Run the tests:
```bash
npm run test
```

Expected output:
```text
  CommunityRegister Smart Contract
    Community Creation
      √ should successfully create a new community with valid inputs
      √ should revert if community ID is bytes32(0)
      √ should revert if name or description is empty
      √ should revert if community with the same ID already exists
    Community Updates & Authorization
      √ should allow the creator to update community details
      √ should revert if non-creator tries to update details
      √ should revert updates to non-existent communities
    Membership: Joining, Leaving, and Rejoining
      √ should allow a wallet to join a community and update counts and members list
      √ should prevent duplicate membership (cannot join twice)
      √ should allow a single wallet to join multiple distinct communities
      √ should allow active members to leave the community
      √ should revert if a non-member tries to leave
      √ should allow members who left to rejoin and preserve historical record
    Member Verification & Query Integrity
      √ should accurately return verification status for any community and wallet address
      √ should revert getCommunity or getMemberCount for non-existent community

  15 passing
```

---

## Deploying to BOT Chain

### 1. Deploy to BOT Chain Testnet (Chain ID 968)
Ensure your deployer account has testnet `BOT` from the [BOT Chain Faucet](https://faucet.botchain.ai/basic).
```bash
npm run deploy:testnet
```
This automatically deploys `CommunityRegister` to `https://rpc.bohr.life` and writes the deployed address to `src/contracts/deployedAddresses.json`.

### 2. Deploy to BOT Chain Mainnet (Chain ID 677)
```bash
npm run deploy:mainnet
```

---

## Running the Frontend

Start the Vite development server:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

Build for production:
```bash
npm run build
```

---

## Security & Decentralization Guidelines

1. **No Private Keys Requested:** The dApp never requests, touches, or stores private keys or seed phrases. Transactions are signed strictly through your wallet provider (MetaMask, TokenPocket, Reown AppKit).
2. **Real On-Chain Ledger:** No mock or fake member records. All community information is read directly from the BOT Chain smart contract via RPC queries.
3. **Identity Disclaimer:** Wallet membership proves on-chain cryptographic inclusion; it does not certify real-world legal identity.
4. **Privacy:** No sensitive personal data (e.g. phone numbers, real names, national IDs) is collected or stored on-chain.

