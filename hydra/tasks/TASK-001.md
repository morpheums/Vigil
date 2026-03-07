# TASK-001: Backend package.json, .env template, and SQLite database module

- **ID**: TASK-001
- **Status**: DONE
- **Base SHA**: 8f3236b87e12b46dc1ef9600898d8dc0e9811649
- **claimed_at**: 2026-03-07
- **Group**: 1
- **Wave**: 1
- **Depends on**: none
- **Files**: vigil/backend/package.json, vigil/backend/.env.example, vigil/backend/db.js
- **Retry count**: 0/3

## Description
Create the backend project foundation: package.json with exact dependencies from docs/DEPENDENCIES.md, a .env.example template, and the complete SQLite database module (db.js) with all 5 tables (wallets, seen_transactions, alert_log, contagion_nodes, contagion_edges) plus CRUD helper functions.

## Acceptance Criteria
- [ ] `vigil/backend/package.json` matches the template in docs/DEPENDENCIES.md exactly (no node-fetch, uses native fetch)
- [ ] `vigil/backend/db.js` creates all 5 tables with correct schema from VIGIL_SPEC.md lines 117-178, exports db instance and helper functions
- [ ] Database initializes without errors when `require('./db')` is called (better-sqlite3 synchronous API, no await)

## Test Requirements
- [ ] Unit test that db.js creates all 5 tables and inserts/reads a test wallet
- [ ] Verify UNIQUE(address, network) constraint on wallets table
- [ ] Verify foreign key relationships work correctly

## Implementation Notes
- Copy package.json from docs/DEPENDENCIES.md backend section exactly
- Use better-sqlite3 synchronous API: db.prepare().run(), db.prepare().get(), db.prepare().all()
- Do NOT use node-fetch — project uses Node 18+ native fetch
- .env.example should have placeholder values (never real keys)
- Export helpers: insertWallet, getWallets, deleteWallet, insertSeenTx, getSeenTxHashes, insertAlert, getAlerts, saveContagionGraph, getContagionGraph
- Reference: VIGIL_SPEC.md lines 115-178 for exact schema
- Reference: hydra/context/conventions.md for DB patterns
