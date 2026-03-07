# Architecture — Vigil

## System Architecture
```
Mobile (Expo/RN) → REST API (Express) → Range MCP API
                                      → SQLite (local DB)
                                      → Expo Push API
                                      → Resend Email API
```

## Project Structure (Target)
```
vigil/
├── backend/
│   ├── index.js           # Express server + all REST routes
│   ├── db.js              # SQLite schema + helpers
│   ├── poller.js          # Polling loop (60s interval)
│   ├── range.js           # Range MCP API helpers (7 tools)
│   ├── contagion.js       # Contagion score engine
│   ├── alerts.js          # Push + email + Act Now logic
│   ├── .env               # API keys
│   └── package.json
└── mobile/
    ├── app/
    │   ├── (tabs)/
    │   │   ├── index.tsx        # Wallets tab
    │   │   ├── alerts.tsx       # Alert history feed
    │   │   └── safesend.tsx     # SafeSend risk checker
    │   └── _layout.tsx
    ├── components/
    │   ├── WalletCard.tsx
    │   ├── AlertItem.tsx
    │   ├── ContagionGraph.tsx   # SVG graph component
    │   ├── ActNowCard.tsx       # Emergency action card
    │   └── RiskBadge.tsx
    ├── hooks/
    │   └── useApi.ts
    ├── constants/
    │   └── networks.ts
    └── package.json
```

## REST API Routes
- POST /wallets — Add wallet + initial scan + contagion
- GET /wallets — List all wallets
- DELETE /wallets/:id — Remove wallet + data
- GET /wallets/:id/contagion — Get contagion graph
- POST /wallets/:id/contagion/refresh — Recalculate contagion
- GET /alerts?limit=50&walletId=optional — Alert history
- POST /risk-check — SafeSend risk check
- POST /payment-risk — Full payment risk assessment
- GET /health — Server health

## Range API Call Format
POST https://api.range.org/ai/mcp
JSON-RPC: { jsonrpc: "2.0", id, method: "tools/call", params: { name, arguments } }
Response: data.result.content[0].text (JSON string, must be parsed)

## Database Schema
5 tables: wallets, seen_transactions, alert_log, contagion_nodes, contagion_edges

## Key Algorithms
- Contagion Score: weighted average of counterparty risk (0-10 scale)
- Act Now Actions: contextual action builder based on tx direction + risk level
- Polling: 60s interval, contagion recalc every 4th cycle
