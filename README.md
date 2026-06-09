# nexaedge-token-tools# NexaEdge Token Tools

On-chain utilities for the **NEXA** SPL token on Solana mainnet.

|Field       |Value                                         |
|------------|----------------------------------------------|
|Mint Address|`D7h9MvFDkVxPYeJwSTcE7VkKXo6mygCHYph36P8oeic2`|
|Network     |Solana Mainnet-Beta                           |
|Total Supply|100,000,000 NEXA                              |
|Status      |Minted — not yet in public circulation        |

🔍 [View on Solscan](https://solscan.io/token/D7h9MvFDkVxPYeJwSTcE7VkKXo6mygCHYph36P8oeic2)

-----

## Quick Start

```bash
npm install
```

### Check token mint info (supply, decimals, authorities)

```bash
node check_nexa_balance.js
```

Sample output:

```
── NEXA Token Info ──────────────────────────────
  Mint Address : D7h9MvFDkVxPYeJwSTcE7VkKXo6mygCHYph36P8oeic2
  Decimals     : 6
  Total Supply : 100,000,000 NEXA
  Mint Auth    : null (frozen)
  Freeze Auth  : null
─────────────────────────────────────────────────
```

### Check a specific wallet’s NEXA balance

```bash
node check_nexa_balance.js <YOUR_WALLET_ADDRESS>
```

-----

## About NexaEdge

NexaEdge is a pre-seed protocol designed to aggregate idle smartphone compute into a distributed edge AI inference network.

- Website: [nexaedge.org](https://nexaedge.org)
- Contact: [contact@nexaedge.org](mailto:contact@nexaedge.org)
- X: [@nexaedge_](https://x.com/nexaedge_)
- Telegram: [t.me/NexaEdge7](https://t.me/NexaEdge7)

> This repository contains tooling only. No tokens are distributed at this stage.
> NEXA is minted on-chain but not yet in public circulation.
