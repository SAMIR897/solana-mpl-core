# Solana SPL Token & MPL Core NFT Lifecycle

[![Solana](https://img.shields.io/badge/Solana-Devnet-14F195?logo=solana)](https://solana.com/)
[![Metaplex](https://img.shields.io/badge/Metaplex-MPL--Core-black?logo=solana)](https://developers.metaplex.com/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

End-to-end TypeScript scripts covering the full lifecycle of **SPL Tokens** and **Metaplex Core (MPL Core)** assets on Solana Devnet — from minting to burning.

---

## Background

### SPL Tokens
Solana's token model separates the token definition from individual balances:
- **Mint Account** — stores supply, decimals, and authorities.
- **Associated Token Account (ATA)** — a PDA derived from the wallet + mint. Every holder has their own.

### Why MPL Core?
Legacy Metaplex NFTs needed **4 accounts** per asset (Mint, ATA, Metadata PDA, Master Edition PDA), locking ~0.0106 SOL in rent each.

MPL Core collapses everything into **one account**:
- ~85% cheaper (~0.0029 SOL rent)
- No ATA needed for transfers — ownership lives on the asset itself
- Burning closes the account and refunds all the rent

---

## What's in here

| # | What it does | Script |
|---|---|---|
| 1 | Create an SPL token, mint 1000, transfer 250 to another wallet | `src/1-spl-token.ts` |
| 2 | Mint an NFT using MPL Core (`createV1`) | `src/2-mint-mpl-core-nft.ts` |
| 3 | Update the NFT name and metadata URI as update authority (`updateV1`) | `src/3-update-nft.ts` |
| 4 | Transfer NFT to a different wallet (`transferV1`) | `src/4-transfer-nft.ts` |
| 5 | Burn the NFT and get the rent back (`burnV1`) | `src/5-burn-nft.ts` |

---

## Project structure

```
src/
├── 1-spl-token.ts         # SPL mint, ATAs, mint supply, transfer
├── 2-mint-mpl-core-nft.ts # Mint MPL Core asset via Umi
├── 3-update-nft.ts        # Mutate name & URI on-chain
├── 4-transfer-nft.ts      # Transfer ownership (no ATA needed)
├── 5-burn-nft.ts          # Burn asset, close account, reclaim rent
├── run-all.ts             # Runs 1-5 sequentially
└── utils/
    └── helpers.ts         # Keypair loading, Umi setup, airdrop helper
```

---

## Setup

**Requirements:** Node.js v18+, npm

```bash
git clone https://github.com/SAMIR897/solana-mpl-core-assignmentsolana-mpl-core-assignment.git
cd solana-mpl-core-assignment
npm install
cp .env.example .env
```

Edit `.env` with your keypair path or private key:
```env
RPC_ENDPOINT=https://api.devnet.solana.com
PRIVATE_KEY_PATH=/path/to/your/id.json
```

If you leave it empty, the scripts generate keypairs automatically under `keys/` and try to airdrop devnet SOL. If airdrop is rate-limited, grab some from [faucet.solana.com](https://faucet.solana.com/).

---

## Running

Run each task individually:
```bash
npm run task1:spl-token
npm run task2:mint-nft
npm run task3:update-nft
npm run task4:transfer-nft
npm run task5:burn-nft
```

Or run the full lifecycle end-to-end:
```bash
npm run run:all
```

Each script prints Solana Explorer links for every transaction so you can verify everything on-chain.

---

## On-chain proof (Devnet)

These are actual transactions from a full run:

| Operation | Explorer |
|---|---|
| SPL Token Mint | [7Rns9Bbp...HQ5rY](https://explorer.solana.com/address/7Rns9Bbp7m8ojT2yCdnY68BadT6Kfd88RTZ5YBuHQ5rY?cluster=devnet) |
| SPL Transfer (250 tokens) | [View Tx](https://explorer.solana.com/tx/YQaX1ni2h4hArJhpvkVUF2EFHW2wv9uhuyQTZdWAnLtEEURx5myw77Q8EznJBS7WF78qcP4u943oDx3xLTw4LcT?cluster=devnet) |
| MPL Core Mint | [View Tx](https://explorer.solana.com/tx/5fWswGPbWhmJwW78Ps8FXQBwzGG41FervWFujjQvgYJdTCb7RjjEqk7yCN5infX2pDzjYZf6cwG18jRvJzvSu54x?cluster=devnet) |
| Metadata Update | [View Tx](https://explorer.solana.com/tx/yjQkMnhbD4iZzKqGuNjtJ28HiGyLXcN7i2hfQw2uE8K3EfJdvKLaVJw74M12yRVfPqEU9iJmGLkVfWuWE5XSRMT?cluster=devnet) |
| NFT Transfer | [View Tx](https://explorer.solana.com/tx/4MSxbruEBaGNtXzbjiz1Dqyxg3xqVWUD3nhi58vwcmbPgCBFUWQTJ1AARF4tjSafhC5A3XKGAG2GwxyXVihKeRGN?cluster=devnet) |
| Burn & Rent Reclaim | [View Tx](https://explorer.solana.com/tx/2MkSDv7Ywe4Q3mfNACz8N4XUEP4WXLAcr2Gwr8NRkpNabgYve23asWGRQ1XCF6CQaghJ9DrcRmbei9BzVe4qXy74?cluster=devnet) |

---

## License

MIT
