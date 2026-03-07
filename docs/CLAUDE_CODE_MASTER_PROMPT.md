# VIGIL — Claude Code Master Build Prompt
# Paste this entire file at the start of your Claude Code session

---

## WHAT YOU ARE BUILDING

A React Native (Expo) + Node.js app called **Vigil** — a real-time stablecoin wallet watchdog.
Built on top of the Range blockchain intelligence API (MCP).

**Three differentiators vs competing hackathon teams:**
1. **Contagion Score** — maps the wallet's transaction neighborhood, risk-scores all counterparties, shows a visual graph
2. **Act Now Mode** — HIGH/CRITICAL alerts include a contextual action plan, not just a notification
3. **SafeSend** — pre-flight risk check before sending funds

---

## REFERENCE FILES (already created — read these first)

- `VIGIL_SPEC.md` — full technical spec, all features, DB schema, API routes, build order
- `vigil-mockups.html` — pixel-perfect HTML mockups for all 5 screens. Use as exact design reference.
- `vigil-brand.jsx` — brand system: colors, fonts, components. Use these exact values everywhere.

**Read all three files before writing a single line of code.**

---

## DESIGN SYSTEM (non-negotiable — match exactly)

```
Background:   #080808
Surface 1:    #111111
Surface 2:    #181818
Border:       #242424
Accent/Safe:  #3DFFA0  ← Range mint green
Warning:      #F5A623
Danger:       #FF3B30
Critical:     #FF2D55
Text primary: #FFFFFF
Text secondary: #888888
Text muted:   #444444

Fonts:
  Headlines/labels:  Syne 800
  Addresses/amounts: Space Mono 700
  Body copy:         Inter 400
```

---

## PROJECT STRUCTURE — create exactly this

```
vigil/
├── backend/
│   ├── index.js        ← Express server
│   ├── db.js           ← SQLite schema
│   ├── poller.js       ← Polling loop
│   ├── range.js        ← Range API helpers
│   ├── contagion.js    ← Contagion score engine
│   ├── alerts.js       ← Push + email + Act Now
│   ├── .env            ← API keys (never commit)
│   └── package.json
└── mobile/
    ├── app/
    │   ├── (tabs)/
    │   │   ├── index.tsx       ← Wallets tab
    │   │   ├── alerts.tsx      ← Alerts feed
    │   │   └── safesend.tsx    ← SafeSend checker
    │   └── _layout.tsx
    ├── components/
    │   ├── WalletCard.tsx
    │   ├── AlertItem.tsx
    │   ├── ContagionGraph.tsx  ← SVG graph
    │   ├── ActNowCard.tsx      ← Emergency modal
    │   └── RiskBadge.tsx
    ├── constants/
    │   └── networks.ts
    ├── hooks/
    │   └── useApi.ts
    └── package.json
```

---

## RANGE API — EXACT CALL FORMAT

The Range API uses MCP JSON-RPC. This is the ONLY correct way to call it:

```javascript
// backend/range.js
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
  if (data.error) throw new Error(`Range API error: ${data.error.message}`);
  // Result is ALWAYS a JSON string inside data.result.content[0].text
  return JSON.parse(data.result.content[0].text);
}
```

**Tool names (exact strings):**
- `get_address_payments` → params: `{ address, network, limit }`
- `get_address_risk`     → params: `{ address, network }`
- `get_address_connections` → params: `{ address, network, size }`
- `check_sanctions`     → params: `{ address, network }`
- `get_payment_risk`    → params: `{ sender_address, recipient_address, amount, sender_network, recipient_network }`
- `get_address_funded_by` → params: `{ address, network }`
- `get_address_features`  → params: `{ address, network }`

**Network ID strings:**
- Ethereum: `"ethereum"` (NOT "eth")
- Solana: `"solana"`
- Tron: `"tron"`
- Cosmos: `"cosmoshub-4"`
- Osmosis: `"osmosis-1"`
- Stellar: `"stellar"`

---

## RANGE API — EXPECTED RESPONSE SHAPES

### get_address_risk response:
```json
{
  "risk_level": "HIGH",
  "risk_score": 8.2,
  "reasoning": "Address linked to known drainer contracts...",
  "entity": null,
  "malicious_addresses": ["0xabc..."],
  "is_ofac_sanctioned": true,
  "is_token_blacklisted": false
}
```

### get_address_payments response:
```json
{
  "payments": [
    {
      "hash": "0xabc123...",
      "direction": "outgoing",
      "amount_usd": 2500.00,
      "token_symbol": "USDC",
      "counterparty_address": "0x7f26...",
      "counterparty_network": "ethereum",
      "timestamp": "2024-01-15T10:30:00Z",
      "network": "ethereum"
    }
  ]
}
```

### get_address_connections response:
```json
{
  "connections": [
    {
      "address": "0xabc...",
      "network": "ethereum",
      "transfer_count": 12,
      "label": "Binance Hot Wallet"
    }
  ]
}
```

### check_sanctions response:
```json
{
  "is_ofac_sanctioned": false,
  "is_token_blacklisted": true,
  "sanctions_details": [],
  "blacklist_details": [
    { "issuer": "Circle USDC", "date": "2023-06-01" }
  ]
}
```

### get_payment_risk response:
```json
{
  "overall_risk_level": "HIGH",
  "risk_score": 7.8,
  "risk_factors": [
    "Recipient address has prior sanctions exposure",
    "Unusual transaction pattern detected"
  ],
  "sender_risk": { "risk_level": "LOW", "risk_score": 1.2 },
  "recipient_risk": { "risk_level": "HIGH", "risk_score": 8.1 }
}
```

---

## CONTAGION SCORE — EXACT ALGORITHM

```javascript
// contagion.js
const RISK_WEIGHTS = {
  VERY_LOW: 0, LOW: 1, MEDIUM: 4, HIGH: 8, CRITICAL: 10, UNKNOWN: 2
};

async function calculateContagionScore(walletId, address, network) {
  // 1. Get up to 15 counterparties
  const { connections } = await getAddressConnections(address, network, 15);

  // 2. Risk-score ALL counterparties in parallel — do NOT do sequentially
  const riskResults = await Promise.all(
    connections.map(c =>
      getAddressRisk(c.address, c.network).catch(() => null)
    )
  );

  // 3. Build scored nodes
  const nodes = connections.map((c, i) => ({
    address: c.address,
    network: c.network,
    riskLevel: riskResults[i]?.risk_level || 'UNKNOWN',
    riskScore: riskResults[i]?.risk_score || 0,
    label: c.label || null,
    transferCount: c.transfer_count || 1,
  }));

  // 4. Weighted average (heavier weight = more transfers = closer relationship)
  const totalWeight = nodes.reduce((s, n) => s + n.transferCount, 0);
  const weightedSum = nodes.reduce((s, n) =>
    s + (RISK_WEIGHTS[n.riskLevel] * n.transferCount), 0
  );
  const score = totalWeight > 0
    ? Math.min(10, weightedSum / totalWeight)
    : 0;

  // 5. Save to DB + return
  await saveContagionGraph(walletId, address, nodes);
  return {
    contagionScore: parseFloat(score.toFixed(1)),
    nodeCount: nodes.length,
    highRiskCount: nodes.filter(n => ['HIGH','CRITICAL'].includes(n.riskLevel)).length,
    nodes,
  };
}

function getContagionLabel(score) {
  if (score < 2)  return { label: 'CLEAN',        color: '#3DFFA0' };
  if (score < 4)  return { label: 'LOW RISK',      color: '#3DFFA0' };
  if (score < 6)  return { label: 'MODERATE',      color: '#F5A623' };
  if (score < 8)  return { label: 'CONTAMINATED',  color: '#FF3B30' };
  return            { label: 'CRITICAL',          color: '#FF2D55' };
}
```

---

## ACT NOW — ACTION BUILDER

```javascript
// alerts.js
function buildActNowActions(tx, riskInfo) {
  const actions = [];
  const isOutgoing = tx.direction === 'outgoing';
  const isHigh = ['HIGH', 'CRITICAL'].includes(riskInfo.risk_level);

  if (isOutgoing && isHigh) {
    actions.push({
      id: 'revoke',
      urgency: 'critical',
      label: '🔒 Revoke token approvals',
      description: 'Open revoke.cash to remove unlimited approvals on this wallet immediately.',
      url: 'https://revoke.cash',
    });
  }

  if (riskInfo.is_ofac_sanctioned || riskInfo.is_token_blacklisted) {
    actions.push({
      id: 'no_interact',
      urgency: 'critical',
      label: '🛑 Do not interact further',
      description: 'This address is OFAC sanctioned. Do not send funds back or acknowledge.',
      url: null,
    });
  }

  if (!isOutgoing && isHigh) {
    actions.push({
      id: 'isolate',
      urgency: 'high',
      label: '🏃 Move clean funds out',
      description: 'Transfer your remaining balance to a different wallet before any further use.',
      url: null,
    });
  }

  if (tx.amount_usd > 500) {
    actions.push({
      id: 'document',
      urgency: 'medium',
      label: '📋 Document this transaction',
      description: 'Screenshot the tx hash and counterparty address for compliance records.',
      url: null,
    });
  }

  // Always append SafeSend check
  actions.push({
    id: 'safesend',
    urgency: 'medium',
    label: '🔍 Check counterparty in SafeSend',
    description: `Run a full risk report on ${tx.counterparty?.slice(0,8)}... before further interaction.`,
    deeplink: `safesend?address=${tx.counterparty}&network=${tx.network}`,
  });

  return actions;
}
```

---

## EXPO PUSH NOTIFICATIONS — EXACT SETUP

```typescript
// In mobile/app/_layout.tsx — run this on app start
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  // projectId is in your app.json under expo.extra.eas.projectId
  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: 'YOUR_EAS_PROJECT_ID', // replace with real value
  })).data;
  return token;
}
```

**Backend push send:**
```javascript
// alerts.js — send via Expo's push API (no SDK needed)
async function sendExpoPush(expoPushToken, { title, body, data }) {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: expoPushToken,
      title,
      body,
      data,
      sound: 'default',
      priority: 'high',
    }),
  });
}
```

---

## RESEND EMAIL — HTML TEMPLATE

```javascript
// alerts.js
function buildAlertEmail(wallet, tx, riskInfo, actNowActions) {
  const isUrgent = ['HIGH', 'CRITICAL'].includes(riskInfo.risk_level);
  const riskColor = isUrgent ? '#FF3B30' : riskInfo.risk_level === 'MEDIUM' ? '#F5A623' : '#3DFFA0';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="background:#080808;font-family:'Helvetica Neue',sans-serif;padding:32px;max-width:480px;margin:0 auto;">
  <div style="margin-bottom:24px;display:flex;align-items:center;gap:10px;">
    <span style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-0.02em;">VIGIL</span>
    <span style="font-size:9px;color:#3DFFA0;letter-spacing:0.15em;font-family:monospace;">BY RANGE</span>
  </div>

  <div style="background:#111;border:1px solid ${riskColor}40;border-radius:12px;overflow:hidden;margin-bottom:20px;">
    <div style="background:${riskColor}15;padding:16px 20px;border-bottom:1px solid ${riskColor}30;">
      <div style="font-size:20px;font-weight:900;color:${riskColor};">${isUrgent ? '🚨' : '⚠️'} ${riskInfo.risk_level} RISK</div>
      <div style="font-size:12px;color:#888;margin-top:4px;">${tx.direction.toUpperCase()} transaction on ${wallet.label || wallet.address.slice(0,8)+'...'}</div>
    </div>
    <div style="padding:16px 20px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="font-family:monospace;font-size:10px;color:#666;padding:4px 0;">AMOUNT</td><td style="font-family:monospace;font-size:11px;color:#fff;text-align:right;">${tx.amount_usd ? '$'+tx.amount_usd.toFixed(2) : '—'} ${tx.token_symbol}</td></tr>
        <tr><td style="font-family:monospace;font-size:10px;color:#666;padding:4px 0;">NETWORK</td><td style="font-family:monospace;font-size:11px;color:#fff;text-align:right;">${tx.network}</td></tr>
        <tr><td style="font-family:monospace;font-size:10px;color:#666;padding:4px 0;">COUNTERPARTY</td><td style="font-family:monospace;font-size:11px;color:#fff;text-align:right;">${tx.counterparty?.slice(0,16)}...</td></tr>
        <tr><td style="font-family:monospace;font-size:10px;color:#666;padding:4px 0;">RISK SCORE</td><td style="font-family:monospace;font-size:11px;color:${riskColor};text-align:right;font-weight:700;">${riskInfo.risk_score} / 10</td></tr>
      </table>
    </div>
  </div>

  ${actNowActions.length > 0 ? `
  <div style="background:#111;border:1px solid #242424;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
    <div style="font-family:monospace;font-size:9px;color:#444;letter-spacing:0.15em;margin-bottom:12px;">RECOMMENDED ACTIONS</div>
    ${actNowActions.slice(0,3).map((a,i) => `
      <div style="padding:8px 0;border-bottom:1px solid #1e1e1e;">
        <div style="font-size:12px;font-weight:700;color:#fff;">${a.label}</div>
        <div style="font-size:11px;color:#666;margin-top:2px;">${a.description}</div>
        ${a.url ? `<a href="${a.url}" style="font-family:monospace;font-size:9px;color:#3DFFA0;margin-top:4px;display:inline-block;">${a.url} →</a>` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div style="font-family:monospace;font-size:9px;color:#333;text-align:center;">
    Vigil by Range · Powered by enterprise blockchain intelligence
  </div>
</body>
</html>`;
}
```

---

## DEMO ADDRESSES (tested and ready to use)

### For adding to wallet tracker (high activity, lots of transactions):
```
# Ethereum — Binance Hot Wallet (thousands of txns, good for showing activity)
Address: 0x28C6c06298d514Db089934071355E5743bf21d60
Network: ethereum

# Solana — active DeFi wallet
Address: 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM
Network: solana
```

### For SafeSend / risk demo (known high-risk / sanctioned):
```
# Ethereum — OFAC sanctioned Tornado Cash router
Address: 0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b
Network: ethereum

# Tron — known high-risk address
Address: TZ4UXDV5ZhNW7fb2AMSbgfAEZ7hWsnYS2g
Network: tron
```

---

## BUILD ORDER — STRICT SEQUENCE (4 hours)

### HOUR 1 — Backend core (no mobile yet)
1. `cd vigil/backend && npm init -y`
2. Install: `npm i express better-sqlite3 node-fetch resend dotenv cors`
3. Create `.env` with your keys
4. Build `db.js` — all 5 tables
5. Build `range.js` — `callTool` + all 7 helpers
6. **TEST NOW**: `node -e "require('./range').getAddressRisk('0x28C6c06298d514Db089934071355E5743bf21d60','ethereum').then(console.log)"`
7. Do not proceed to Hour 2 until Range API responds correctly

### HOUR 2 — Backend features
1. Build `contagion.js` — full algorithm
2. Build `poller.js` — polling loop + 4th-cycle contagion
3. Build `alerts.js` — push + email + action builder
4. Build `index.js` — all REST routes
5. Start server: `node index.js`
6. **TEST**: `curl -X POST localhost:3000/wallets -H "Content-Type:application/json" -d '{"address":"0x28C6c06298d514Db089934071355E5743bf21d60","network":"ethereum","label":"Test"}'`

### HOUR 3 — Mobile foundation
1. `npx create-expo-app mobile --template tabs`
2. `cd mobile && npx expo install expo-notifications react-native-svg axios @react-native-picker/picker`
3. Build constants, RiskBadge, NetworkBadge
4. Build Wallets tab + add wallet modal
5. Build Alerts tab with basic AlertItem

### HOUR 4 — Differentiators + polish
1. Build ContagionGraph SVG component
2. Build ActNowCard modal
3. Add contagion score pill to WalletCard
4. Build SafeSend tab
5. Wire up Expo push token registration
6. Test full flow on device

---

## CRITICAL CONSTRAINTS

- Use `node-fetch` v2 in backend (`require`), NOT v3 (ESM only) — OR add `"type":"module"` to package.json
- SQLite `better-sqlite3` is synchronous — no `await` needed for DB calls
- Range API rate limit: be conservative, use `Promise.all` only for contagion (controlled burst)
- Contagion runs every 4th poll cycle, NOT every cycle — it makes 15+ API calls per wallet
- Never store the Range API key in mobile code — all Range calls go through YOUR backend
- Expo push tokens only work on physical devices, not simulators

---

## ENVIRONMENT VARIABLES NEEDED BEFORE STARTING

```bash
# backend/.env
RANGE_API_KEY=          # https://app.range.org/keys
RESEND_API_KEY=         # https://resend.com
RESEND_FROM_EMAIL=onboarding@resend.dev      # the "from" email you verified in Resend
PORT=3000
POLL_INTERVAL_SECONDS=60

# mobile — set in app.config.js or .env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000  # NOT localhost — use real IP for device testing
```

**Get your local IP:** `ipconfig getifaddr en0` (Mac) or `ipconfig` (Windows)
