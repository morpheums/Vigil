# Conventions — Vigil

## Code Style
- Backend: Node.js CommonJS or ESM (use native fetch, Node 18+)
- Mobile: TypeScript, React Native / Expo conventions
- No node-fetch — use native fetch

## API Patterns
- All Range API calls go through backend/range.js callTool()
- Never call Range API from mobile code
- Mobile uses useApi.ts hook for all backend communication
- axios for HTTP client on mobile side

## Database
- better-sqlite3 (synchronous) — no await for DB calls
- db.prepare().run() / db.prepare().get() / db.prepare().all()

## Design System (Non-negotiable)
- Match vigil-mockups.html exactly for layout
- Colors: bg #080808, accent #3DFFA0, danger #FF3B30, warn #F5A623
- Fonts: Syne 800 (headlines), Space Mono (mono/tech), Inter (body)
- Dark theme only

## Naming
- Backend files: lowercase kebab or plain (index.js, range.js, contagion.js)
- Mobile components: PascalCase (WalletCard.tsx, ContagionGraph.tsx)
- API routes: lowercase with hyphens

## Error Handling
- Backend: try/catch with error responses
- Mobile: apiError() helper wraps AxiosError
- Range API: catch per-call in Promise.all for resilience

## Network IDs (Exact Strings)
- ethereum, solana, tron, cosmoshub-4, osmosis-1, stellar
- Never use "eth", "sol", etc.
