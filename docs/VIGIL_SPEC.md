# Vigil — Stablecoin Wallet Watchdog
## Claude Code Spec (Hackathon Build) · by Range

---

## Overview
A React Native (Expo) mobile app + Node.js backend that monitors stablecoin wallets across multiple blockchains in real time. Users add wallet addresses, set alert preferences, and get notified instantly (push + email) when any transaction is detected.

**Differentiators vs every other team:**
1. **Contagion Score** — maps your wallet's transaction graph, risk-scores all counterparties, returns a neighborhood contamination score + visual graph
2. **Act Now Mode** — when HIGH/CRITICAL alerts fire, shows a contextual emergency action card, not just a notification
3. **SafeSend** tab — pre-flight risk check before sending funds

---

## Tech Stack
- **Mobile:** Expo (React Native), TypeScript
- **Backend:** Node.js + Express + SQLite (`better-sqlite3`)
- **Alerts:** Expo Push Notifications + Resend (email)
- **Blockchain Data:** Range MCP API — `https://api.range.org/ai/mcp`
- **Supported Networks:** `ethereum`, `solana`, `tron`, `cosmoshub-4`, `osmosis-1`, `stellar`

---

## Project Structure
```
vigil/
├── backend/
│   ├── index.js           # Express server + all REST routes
│   ├── db.js              # SQLite schema + helpers
│   ├── poller.js          # Polling loop
│   ├── range.js           # Range MCP API helpers
│   ├── contagion.js       # Contagion score engine ← NEW
│   ├── alerts.js          # Push + email + Act Now logic ← UPDATED
│   └── package.json
├── mobile/
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── index.tsx        # Wallets tab
│   │   │   ├── alerts.tsx       # Alert history feed
│   │   │   └── safesend.tsx     # SafeSend risk checker
│   │   └── _layout.tsx
│   ├── components/
│   │   ├── WalletCard.tsx
│   │   ├── AlertItem.tsx
│   │   ├── ContagionGraph.tsx   # ← NEW: SVG graph component
│   │   ├── ActNowCard.tsx       # ← NEW: Emergency action card
│   │   └── RiskBadge.tsx
│   ├── hooks/
│   │   └── useApi.ts
│   ├── constants/
│   │   └── networks.ts
│   └── package.json
└── README.md
```

---

## Environment Variables

### Backend `.env`
```
RANGE_API_KEY=your_range_api_key_here
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.devvigil@yourdomain.com
PORT=3000
POLL_INTERVAL_SECONDS=60
```

### Mobile `.env`
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

---

## Range API Helper — `range.js`

All calls use MCP JSON-RPC:

```javascript
const BASE = 'https://api.range.org/ai/mcp';

async function callTool(toolName, params) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RANGE_API_KEY}`
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name: toolName, arguments: params }
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return JSON.parse(data.result.content[0].text);
}

// Exported helpers:
// getAddressPayments(address, network, limit=25)
// getAddressRisk(address, network)
// getAddressConnections(address, network, size=15)
// checkSanctions(address, network)
// getPaymentRisk(sender, recipient, amount, senderNet, recipientNet)
// getAddressFundedBy(address, network)        ← used by Contagion
// getAddressFeatures(address, network)        ← used by Contagion
```

---

## Database Schema — `db.js`

```sql
CREATE TABLE wallets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT NOT NULL,
  network TEXT NOT NULL,
  label TEXT,
  expo_push_token TEXT,
  alert_email TEXT,
  contagion_score REAL DEFAULT NULL,         -- cached, recalculated hourly
  contagion_updated_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(address, network)
);

CREATE TABLE seen_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_id INTEGER NOT NULL,
  tx_hash TEXT NOT NULL,
  amount_usd REAL,
  direction TEXT,        -- 'incoming' | 'outgoing'
  token_symbol TEXT,
  counterparty TEXT,
  risk_level TEXT,       -- from get_address_risk on counterparty
  risk_score REAL,
  seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(wallet_id) REFERENCES wallets(id)
);

CREATE TABLE alert_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_id INTEGER NOT NULL,
  tx_hash TEXT NOT NULL,
  message TEXT,
  risk_level TEXT,
  act_now_actions TEXT,  -- JSON array of suggested actions ← NEW
  channels TEXT,         -- JSON array: ["push", "email"]
  acknowledged INTEGER DEFAULT 0,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Contagion graph cache (nodes + edges)
CREATE TABLE contagion_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_id INTEGER NOT NULL,
  address TEXT NOT NULL,
  network TEXT NOT NULL,
  risk_level TEXT,
  risk_score REAL,
  label TEXT,            -- entity name if known
  is_root INTEGER DEFAULT 0,
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(wallet_id) REFERENCES wallets(id)
);

CREATE TABLE contagion_edges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_id INTEGER NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  transfer_count INTEGER,
  FOREIGN KEY(wallet_id) REFERENCES wallets(id)
);
```

---

## Feature 1: Contagion Score Engine — `contagion.js`

### What it does
Maps the wallet's transaction neighborhood and calculates how "infected" the surrounding addresses are. Most teams will only check if YOUR wallet is risky. Vigil shows you that your wallet is clean but 2 of the 8 people who sent you money are HIGH risk — and you didn't know.

### Algorithm
```javascript
async function calculateContagionScore(address, network) {
  // Step 1: Get all counterparties (up to 15)
  const connections = await getAddressConnections(address, network, size=15);

  // Step 2: Risk-score each counterparty in parallel (Promise.all)
  const riskResults = await Promise.all(
    connections.map(c => getAddressRisk(c.address, c.network).catch(() => null))
  );

  // Step 3: Map risk levels to numeric weights
  const riskWeights = {
    VERY_LOW: 0, LOW: 1, MEDIUM: 4, HIGH: 8, CRITICAL: 10, UNKNOWN: 2
  };

  // Step 4: Weighted average based on transfer volume proximity
  // Heavier weight to addresses with higher transfer volume to/from root
  const scored = connections.map((c, i) => ({
    address: c.address,
    network: c.network,
    riskLevel: riskResults[i]?.risk_level || 'UNKNOWN',
    riskScore: riskResults[i]?.risk_score || 0,
    transferCount: c.transfer_count || 1,
  }));

  const totalWeight = scored.reduce((s, n) => s + n.transferCount, 0);
  const weightedRisk = scored.reduce((s, n) => {
    return s + (riskWeights[n.riskLevel] * n.transferCount);
  }, 0);

  // Contagion score: 0–10
  const rawScore = totalWeight > 0 ? weightedRisk / totalWeight : 0;
  const contagionScore = Math.min(10, rawScore);

  // Step 5: Persist graph to DB
  saveContagionGraph(walletId, address, scored);

  return {
    contagionScore: parseFloat(contagionScore.toFixed(1)),
    nodeCount: scored.length,
    highRiskCount: scored.filter(n => n.riskLevel === 'HIGH' || n.riskLevel === 'CRITICAL').length,
    nodes: scored,
  };
}
```

### Contagion Score Labels
| Score | Label       | Color  |
|-------|-------------|--------|
| 0–2   | CLEAN       | green  |
| 2–4   | LOW RISK    | green  |
| 4–6   | MODERATE    | yellow |
| 6–8   | CONTAMINATED| orange |
| 8–10  | CRITICAL    | red    |

### When it runs
- On wallet add (initial scan)
- Every 4 poll cycles (not every poll — this makes 15 API calls per wallet)
- On-demand via `POST /wallets/:id/contagion`

---

## Feature 2: Act Now Mode — updates to `alerts.js`

### What it does
Every other app just sends a push notification "hey something happened." Vigil answers the follow-up question every user has: **"okay, what do I actually do?"** When a HIGH or CRITICAL alert fires, the notification and the in-app card both include a contextual action plan.

### Action Generation Logic
```javascript
function buildActNowActions(tx, riskInfo) {
  const actions = [];

  if (tx.direction === 'outgoing' && (riskInfo.risk_level === 'HIGH' || riskInfo.risk_level === 'CRITICAL')) {
    actions.push({
      id: 'revoke',
      label: '🔒 Revoke token approvals',
      description: 'Open revoke.cash to remove any unlimited token approvals on this wallet',
      url: `https://revoke.cash`,
      urgency: 'critical',
    });
  }

  if (riskInfo.is_ofac_sanctioned || riskInfo.is_token_blacklisted) {
    actions.push({
      id: 'do_not_interact',
      label: '🛑 Do not interact further',
      description: 'This address is OFAC sanctioned. Do not send funds back or acknowledge the transaction.',
      urgency: 'critical',
    });
  }

  if (tx.direction === 'incoming' && riskInfo.risk_level === 'HIGH') {
    actions.push({
      id: 'isolate',
      label: '🏃 Move clean funds out',
      description: 'Transfer your remaining balance to a different wallet before interacting further.',
      urgency: 'high',
    });
  }

  if (tx.amount_usd > 500) {
    actions.push({
      id: 'document',
      label: '📋 Document this transaction',
      description: 'Screenshot the transaction hash and counterparty now for any future compliance needs.',
      urgency: 'medium',
    });
  }

  // Always include SafeSend prompt
  actions.push({
    id: 'safesend_check',
    label: '🔍 Check counterparty in SafeSend',
    description: `Run a full risk report on ${tx.counterparty.slice(0,8)}... before any further interaction.`,
    counterparty: tx.counterparty,
    urgency: 'medium',
  });

  return actions;
}
```

### Alert Message Format
```
🚨 HIGH RISK TRANSACTION DETECTED

OUTGOING 2,500 USDC on Ethereum
To: 0x7f26...38E5 · Risk: HIGH (8.2/10)

Recommended actions:
1. 🔒 Revoke token approvals immediately
2. 🔍 Check counterparty in SafeSend
3. 📋 Document this transaction

Tap to open Act Now →
```

---

## REST API — `index.js`

```
POST /wallets
  Body: { address, network, label, expoPushToken, alertEmail }
  → Insert wallet
  → Run initial tx scan (populate seen_transactions)
  → Run initial contagion score (async, non-blocking)
  → Returns: { id, address, network, label }

GET /wallets
  → All wallets with contagion_score, latest risk, last activity

DELETE /wallets/:id
  → Remove wallet + seen_transactions + contagion data

GET /wallets/:id/contagion
  → Returns { contagionScore, nodeCount, highRiskCount, nodes[], edges[] }
  → Used to render the graph on mobile

POST /wallets/:id/contagion/refresh
  → Triggers fresh contagion calculation
  → Returns updated score

GET /alerts?limit=50&walletId=optional
  → Returns alert_log with act_now_actions parsed from JSON
  → Sorted by sent_at DESC

POST /risk-check
  Body: { address, network }
  → getAddressRisk + checkSanctions
  → Returns { riskLevel, riskScore, reasoning, isSanctioned, isBlacklisted }

POST /payment-risk
  Body: { senderAddress, senderNetwork, recipientAddress, recipientNetwork, amountUsd }
  → getPaymentRisk
  → Returns full risk assessment

GET /health
  → { status: "ok", walletCount, lastPollAt }
```

---

## Mobile Spec

### Tab 1: Wallets (index.tsx)
```
Header: "Vigil" wordmark + shield icon + green/red pulse dot

[+ Add Wallet] → bottom sheet:
  - Address input
  - Network picker (ETH, SOL, TRX, ATOM, OSMO, XLM)
  - Label (optional)
  - Email for alerts (optional)
  - [Watch Wallet] button

Wallet list (FlatList of WalletCard):
  WalletCard shows:
  - Label + network badge + risk badge
  - Balance (if available)
  - "Last activity: X mins ago"
  - CONTAGION SCORE PILL ← NEW
    Shows score/10 with color coding
    e.g. "🕸 Contagion: 6.2 — 2 risky neighbors"
  - Tap card → opens Wallet Detail screen

Wallet Detail screen (modal/push):
  - Full address
  - ContagionGraph component (see below)
  - Recent transactions list
  - [Refresh Contagion] button
  - [Delete Wallet] button

Empty state: "No wallets yet. Add your first to start watching."
```

### ContagionGraph Component (components/ContagionGraph.tsx)
```
Props: { nodes: ContagionNode[], rootAddress: string }

Renders an SVG force-directed graph:
  - Root wallet: large white circle in center
  - Counterparty nodes: smaller circles, color by risk level
    GREEN = LOW/VERY_LOW, YELLOW = MEDIUM, ORANGE = HIGH, RED = CRITICAL
  - Edges: thin lines connecting root to each node
  - On tap of a node: show address + risk level + "Check in SafeSend" button

Keep it simple for hackathon — static layout is fine:
  - Root in center
  - Nodes arranged in a circle around it
  - Use React Native SVG or a simple View-based layout
  - Animate nodes fading in with staggered delay

Above graph show:
  "Contagion Score: X.X / 10"  ← large number, color coded
  "X of Y neighbors are high risk"
```

### Tab 2: Alerts (alerts.tsx)
```
Header: "Alerts" + unread count badge

FlatList of AlertItem:
  Normal alert (LOW/MEDIUM risk):
  - Risk dot + direction + amount + token + network
  - Timestamp
  - Tap to expand: full tx details

  HIGH/CRITICAL alert — ACT NOW MODE: ← NEW
  - Red/orange banner at top of card: "⚡ ACT NOW"
  - Direction + amount + risk badge
  - Action list (first 2 actions shown, truncated):
    e.g. "🔒 Revoke approvals  →"
         "🔍 SafeSend check  →"
  - [See all actions] expands full ActNowCard
  - [Mark as handled] dismisses the urgency state

ActNowCard component (components/ActNowCard.tsx):
  Full-screen modal triggered by tapping ACT NOW alert:
  - Large risk indicator at top: 🚨 HIGH RISK
  - Transaction summary
  - Numbered action list, each action is tappable:
    - Actions with URLs open the browser
    - SafeSend action deep-links to SafeSend tab with address pre-filled
  - [Mark as Handled] button — updates alert acknowledged = 1

Pull to refresh reloads alerts.
```

### Tab 3: SafeSend (safesend.tsx)
```
Header: "SafeSend"
Subtitle: "Check any address before sending funds"

Accepts deep-link params: ?address=0x... (pre-fills from Act Now)

Form:
  - Recipient Address
  - Network picker
  - Amount USD (optional)
  - My Address (optional, for full payment risk)
  - [Check Risk] button

Results card:
  - Risk level: 🟢 LOW / 🟡 MEDIUM / 🔴 HIGH / 💀 CRITICAL
  - Risk score: X/10
  - OFAC Sanctioned: ✅ / 🚫
  - Token Blacklisted: ✅ / 🚫
  - Reasoning
  - Verdict banner (green/yellow/red/black)
```

---

## Polling Loop — `poller.js`
```
Every POLL_INTERVAL_SECONDS (default 60):
  1. Load all wallets
  2. For each wallet:
     a. getAddressPayments(address, network, limit=25)
     b. Diff against seen_transactions
     c. For each NEW tx:
        - getAddressRisk(counterparty)
        - checkSanctions(counterparty)
        - Insert into seen_transactions
        - Build Act Now actions if HIGH/CRITICAL
        - fireAlert(wallet, tx, riskInfo, actNowActions)
  3. Every 4th cycle: recalculate contagion for all wallets
  4. Log cycle completion + timestamp
```

---

## Alerts Logic — `alerts.js`
```javascript
async function fireAlert(wallet, tx, riskInfo, actNowActions) {
  const isUrgent = ['HIGH', 'CRITICAL'].includes(riskInfo.risk_level);
  const prefix = isUrgent ? '🚨' : '⚠️';

  const message = [
    `${prefix} ${tx.direction.toUpperCase()} ${tx.amount_usd ? '$' + tx.amount_usd.toFixed(2) : ''} ${tx.token_symbol} on ${tx.network}`,
    `Counterparty risk: ${riskInfo.risk_level}`,
    isUrgent ? `Tap for Act Now actions →` : `Tx: ${tx.tx_hash?.slice(0, 10)}...`,
  ].join('\n');

  // Expo push
  if (wallet.expo_push_token) {
    await sendExpoPush(wallet.expo_push_token, {
      title: isUrgent ? '🚨 Act Now — Vigil Alert' : '👁 Vigil Alert',
      body: message,
      data: { alertType: isUrgent ? 'act_now' : 'info', txHash: tx.tx_hash },
    });
  }

  // Email (Resend)
  if (wallet.alert_email) {
    await sendResendEmail(wallet, message, tx, riskInfo, actNowActions);
  }

  // Log to DB
  db.prepare(`
    INSERT INTO alert_log (wallet_id, tx_hash, message, risk_level, act_now_actions, channels)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    wallet.id, tx.tx_hash, message, riskInfo.risk_level,
    JSON.stringify(actNowActions),
    JSON.stringify([wallet.expo_push_token ? 'push' : null, wallet.alert_email ? 'email' : null].filter(Boolean))
  );
}
```

---

## Design System — match Vigil brand

Use the brand identity as the style reference:
- Background: `#080808`
- Surface: `#111111` / `#181818`
- Border: `#242424`
- Accent / Safe: `#3DFFA0` (Range Mint)
- Warning: `#F5A623`
- Danger: `#FF3B30`
- Critical: `#FF2D55`
- Font (headlines): Syne 800
- Font (addresses/amounts): Space Mono
- Font (body): Inter

---

## Build Order — 4 hours

### Hour 1 — Backend foundation
- [ ] `npm init`, install deps: `express better-sqlite3 node-fetch resend dotenv cors`
- [ ] `db.js` — all tables including contagion_nodes + contagion_edges
- [ ] `range.js` — `callTool` + all 7 helper functions
- [ ] Test: hit `get_address_risk` with a real address → confirm JSON response

### Hour 2 — Core backend features
- [ ] `contagion.js` — full score algorithm + DB persistence
- [ ] `poller.js` — polling loop with diff detection + contagion every 4th cycle
- [ ] `alerts.js` — push + email + Act Now action builder
- [ ] `index.js` — all REST routes including `/wallets/:id/contagion`

### Hour 3 — Mobile app
- [ ] `npx create-expo-app vigil --template tabs`
- [ ] `constants/networks.ts` + `RiskBadge` + `NetworkBadge` components
- [ ] Wallets tab: list + add wallet modal + contagion score pill on WalletCard
- [ ] Alerts tab: AlertItem with Act Now banner for HIGH/CRITICAL

### Hour 4 — Polish + differentiators shine
- [ ] `ContagionGraph.tsx` — SVG circle layout, color-coded nodes, tap interaction
- [ ] `ActNowCard.tsx` — full-screen modal, tappable actions, deep-link to SafeSend
- [ ] SafeSend tab + deep-link support (`?address=`)
- [ ] Register Expo push notifications on app start
- [ ] Error states + loading spinners everywhere
- [ ] Test full flow on device

---

## Demo Script (judges)

1. **Open app** → show Wallets screen
2. **Add a real ETH wallet** (use a known exchange hot wallet with lots of activity)
3. **Show Contagion Score loading** — "while other apps just watch your wallet, Vigil maps your entire neighborhood"
4. **Tap the wallet** → show ContagionGraph with colored nodes
   - Point to any red/orange node: "this counterparty is HIGH risk — you didn't send to them, they sent to you. But now you're connected."
5. **Switch to Alerts tab** → show an existing HIGH risk alert with Act Now card
   - Tap Act Now → show the action list: "we don't just tell you what happened, we tell you what to do"
6. **SafeSend tab** → paste a known sanctioned address → show 🛑 result
7. **Show email received** on phone
8. Close with: *"Range protects institutions. Vigil protects you — and tells you what to do about it."*

---

## Key APIs to get before starting
- **Range API Key:** https://app.range.org/keys
- **Resend (email):** https://resend.com — free tier, 3,000 emails/month

## Dependencies

### Backend
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.4.3",
    "node-fetch": "^3.3.2",
    "resend": "^3.2.0",
    "dotenv": "^16.4.5",
    "cors": "^2.8.5"
  }
}
```

### Mobile (additions to Expo template)
```json
{
  "dependencies": {
    "expo-notifications": "~0.28.0",
    "react-native-svg": "15.2.0",
    "axios": "^1.6.7",
    "@react-native-picker/picker": "2.7.5"
  }
}
```
