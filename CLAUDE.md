# VIGIL — Claude Code Context File
# This file is auto-read by Claude Code at session start.

## Project
Vigil — stablecoin wallet watchdog mobile app built on Range blockchain intelligence API.
Consumer product. "Range protects institutions. Vigil protects you."

## Stack
- Backend: Node.js + Express + SQLite (better-sqlite3)
- Mobile: Expo (React Native) + TypeScript
- Alerts: Expo Push + Resend email
- Data: Range MCP API at https://api.range.org/ai/mcp

## Non-negotiables
- ALL Range API calls go through backend/range.js — never call Range from mobile
- Design system: bg #080808, accent #3DFFA0, danger #FF3B30, warn #F5A623
- Fonts: Syne 800 (headlines), Space Mono (mono/technical), Inter (body)
- Use vigil-mockups.html as ground truth for every screen's layout and components

## Key files to read before building anything
1. VIGIL_SPEC.md — full feature spec
2. vigil-mockups.html — all 5 screen designs
3. CLAUDE_CODE_MASTER_PROMPT.md — exact API formats, algorithms, demo addresses

## Range API call format (never deviate from this)
POST https://api.range.org/ai/mcp
Authorization: Bearer RANGE_API_KEY
Body: { jsonrpc:"2.0", id:Date.now(), method:"tools/call", params:{ name:TOOL_NAME, arguments:PARAMS } }
Response: data.result.content[0].text  ← JSON string, must be JSON.parsed

## Architecture rules
- SQLite calls are synchronous (better-sqlite3) — no await
- Contagion score runs every 4th poll cycle, not every cycle
- Promise.all for parallel counterparty risk scoring in contagion engine
- node-fetch: use require('node-fetch') with "type":"module" in package.json OR use native fetch if Node 18+
- Expo push tokens only work on physical devices

## Supported network ID strings (exact)
ethereum, solana, tron, cosmoshub-4, osmosis-1, stellar