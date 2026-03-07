# TASK-007: Express server with all REST routes

- **ID**: TASK-007
- **Status**: DONE
- **Base SHA**: 0c2b72be3763ef3caf1a4bc5511382945ee2b529
- **claimed_at**: 2026-03-07
- **Group**: 3
- **Wave**: 3
- **Depends on**: TASK-001, TASK-002, TASK-004, TASK-005, TASK-006
- **Files**: vigil/backend/index.js
- **Retry count**: 0/3

## Description
Create the Express server (index.js) that ties together all backend modules and exposes the complete REST API: wallet CRUD, contagion endpoints, alerts, risk-check, payment-risk, and health. Starts the polling loop on server boot.

## Acceptance Criteria
- [x] All 9 REST routes implemented exactly as specified: POST/GET/DELETE /wallets, GET /wallets/:id/contagion, POST /wallets/:id/contagion/refresh, GET /alerts, PATCH /alerts/:id/acknowledge, POST /risk-check, POST /payment-risk, GET /health
- [x] POST /wallets triggers initial transaction scan and kicks off async contagion calculation (non-blocking)
- [x] Server starts on PORT from env (default 3000), enables CORS, parses JSON, and starts the poller

## Test Requirements
- [x] Integration test: POST /wallets with valid body returns { id, address, network, label } and status 201
- [x] Integration test: GET /health returns { status: "ok", walletCount, lastPollAt }
- [x] Test: DELETE /wallets/:id removes wallet and returns 204

## Implementation Notes
- Reference: VIGIL_SPEC.md lines 328-368 for exact route specs
- require('dotenv').config() at top
- Import all modules: db.js, range.js, contagion.js, alerts.js, poller.js
- Use express.json() middleware and cors()
- POST /wallets flow: insert wallet, getAddressPayments for initial scan, insert seen_transactions, then calculateContagionScore in background (don't await)
- GET /wallets should include contagion_score and last activity info
- GET /alerts parses act_now_actions from JSON string back to array
- POST /risk-check calls getAddressRisk + checkSanctions, combines results
- POST /payment-risk calls getPaymentRisk
- Start poller with startPoller() after listen()

## Implementation Log
- Created vigil/backend/index.js with all 10 REST routes (POST/GET/DELETE /wallets, GET /wallets/:id/contagion, POST /wallets/:id/contagion/refresh, GET /alerts, PATCH /alerts/:id/acknowledge, POST /risk-check, POST /payment-risk, GET /health)
- Created vigil/backend/__tests__/index.test.js with 16 integration tests using supertest
- All modules mocked (range.js, contagion.js, poller.js, alerts.js, db.js) to use in-memory SQLite
- Added supertest as devDependency
- All 79 tests pass (16 new + 63 existing)
