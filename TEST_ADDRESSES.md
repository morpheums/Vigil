# VIGIL — Verified Test Addresses
# Source: https://docs.range.org/risk-api/product-info/test-addresses
# All addresses below produce known, predictable results from the Range API.

---

## 🚨 HIGH RISK / MALICIOUS (Score 10)

| Network      | Address                                          | Expected Score | Notes |
|--------------|--------------------------------------------------|----------------|-------|
| Solana       | 42RLPACwZPx3vYYmxSueqsogfynBDqXK298EDsNoyoHi   | 10             | Directly malicious |
| Ethereum     | 0x08723392ed15743cc38513c4925f5e6be5c17243      | 10             | Directly malicious |

---

## 🟢 LOW RISK / CLEAN (Score 1–3)

| Network      | Address                                                        | Expected Score | Notes |
|--------------|----------------------------------------------------------------|----------------|-------|
| Solana       | 6AwuGoRLd54NTjAWeYZBVHnK4reK78FYpsqe6Z2PvU27                 | 1              | Binance deposit address |
| Solana       | TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA                  | 1              | Token Program (attribution override) |
| BNB Chain    | 0x279ac60785a2fcb85550eb243b9a42a543171cc7                    | 3              | Clean |
| Polygon      | 0xd56e4eab23cb81f43168f9f45211eb027b9ac7cc                    | 3              | Clean |
| Base         | 0x23055618898e202386e6c13955a58d3c68200bfb                    | 3              | Clean |
| Arbitrum     | 0x0711dd777ae626ef5e0a4f50e199c7a0e0666857                    | 3              | Clean |
| Bitcoin      | 3BMEXs4aRnQRKBXtfrvmxYMyt3wWkSsnHb                           | 3              | Clean |
| Tron         | TXJgMdjVX5dKiQaUi9QobwNxtSQaFqccvd                           | 3              | Clean |
| Stellar      | GB3RMPTL47E4ULVANHBNCXSXM2ZA5JFY5ISDRERPCXNJUDEO73QFZUNK    | 1              | Clean |
| Osmosis      | osmo1tl43tjmylclp37jduelnwrzeyuef2unxn9c04wrlakmgvzsnmgtqqet6za | 1          | Clean |
| Cosmos Hub   | cosmos10d07y265gmmuvt4z0w9aw880jnsr700j6zn9kn                 | 1              | Clean |

---

## 🛑 SANCTIONS & BLACKLIST (OFAC Confirmed)

| Network      | Address                                          | Sanction Detail |
|--------------|--------------------------------------------------|-----------------|
| Solana       | 42RLPACwZPx3vYYmxSueqsogfynBDqXK298EDsNoyoHi   | OFAC — Sokolovski Rolan |
| Ethereum     | 0x08723392ed15743cc38513c4925f5e6be5c17243      | OFAC — Lazarus Group (APT-C-26) |
| Tron         | TBHTJqAy4DhHhmT3dNceJYNRz4SdLofLre             | OFAC — Wang Yunhe (Trafficcarb) |
| Bitcoin      | 3bsyz7qrfsi3nsaov1ff724qagrepjvuhm              | OFAC — Vasinskyi Yaroslav |

---

## 🪙 TOKEN RISK (Solana mint addresses)

| Token        | Mint Address                                     | Expected Risk | Notes |
|--------------|--------------------------------------------------|---------------|-------|
| USDC         | EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v   | LOW           | Freeze/mint authority HIGH is expected — overall LOW |
| USDT         | Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB   | LOW           | Regulated stablecoin |
| Wrapped SOL  | So11111111111111111111111111111111111111112      | LOW           | Core infrastructure |
| JUP          | JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN   | LOW           | Established DeFi |
| Pyth         | HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3  | LOW           | Oracle infrastructure |
| BONK         | DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263  | MEDIUM/HIGH   | Meme token — good for testing risk factors |
| WIF          | EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm  | MEDIUM/HIGH   | Meme token |
| POPCAT       | 7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr  | MEDIUM/HIGH   | Meme token |

---

## 🎬 RECOMMENDED DEMO FLOW

### Step 1 — Add a wallet to track (Contagion demo)
```
Address: 6AwuGoRLd54NTjAWeYZBVHnK4reK78FYpsqe6Z2PvU27
Network: solana
Why: Binance deposit — high activity, rich contagion graph
```

### Step 2 — SafeSend: show a sanctioned address getting flagged
```
Address: 0x08723392ed15743cc38513c4925f5e6be5c17243
Network: ethereum
Why: OFAC sanctioned Lazarus Group — will show 🛑 SANCTIONED result
```

### Step 3 — SafeSend: Tron variant (shows cross-chain coverage)
```
Address: TBHTJqAy4DhHhmT3dNceJYNRz4SdLofLre
Network: tron
Why: OFAC sanctioned — good for showing multi-chain support
```

### Step 4 — Show a clean address passing SafeSend
```
Address: cosmos10d07y265gmmuvt4z0w9aw880jnsr700j6zn9kn
Network: cosmoshub-4
Why: Score 1 — demonstrates the green "✅ Looks safe to send" result
```

---

## ⚠️ IMPORTANT NOTES

- Response values may shift slightly over time as Range updates its threat
  intelligence, but the general risk profile (HIGH vs LOW) will stay stable.
- The Token Program address (TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)
  is a great demo of attribution override — it's near malicious addresses
  but scores 1 because Range recognizes it as a verified system program.
- USDC/USDT will show HIGH for freeze_authority and minting_authority —
  this is expected and correct. Make sure your UI doesn't panic on this.
- For the Payment Risk endpoint, the docs note some test scenarios are still
  TBD ([To Do]) — use real addresses you control for payment risk testing.

---

## 🔗 Source
https://docs.range.org/risk-api/product-info/test-addresses
