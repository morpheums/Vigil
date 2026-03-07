# Patterns — Vigil

## Range API Call Pattern
```javascript
async function callTool(toolName, params) {
  const res = await fetch('https://api.range.org/ai/mcp', {
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
  return JSON.parse(data.result.content[0].text);
}
```

## Contagion Score Pattern
1. Get 15 counterparties via get_address_connections
2. Risk-score all in parallel via Promise.all + getAddressRisk
3. Weighted average: riskWeight * transferCount / totalTransferCount
4. Scale: 0-10, labels: CLEAN/LOW RISK/MODERATE/CONTAMINATED/CRITICAL

## Act Now Actions Pattern
- Build contextual action list based on tx.direction + riskInfo.risk_level
- Always include SafeSend check as last action
- Store as JSON array in alert_log.act_now_actions

## Mobile API Hook Pattern
- useApi() returns object with all API methods
- axios client with 30s timeout (60s for contagion refresh)
- All responses go through apiError() wrapper

## Alert Pattern
- LOW/MEDIUM → info notification
- HIGH/CRITICAL → Act Now mode with action cards
- Channels: push (Expo) + email (Resend)
- Log everything to alert_log table

## Polling Pattern
- Every POLL_INTERVAL_SECONDS (default 60)
- Diff new transactions against seen_transactions
- Every 4th cycle: recalculate contagion scores
