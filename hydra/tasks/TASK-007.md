# TASK-007: Express server with all REST routes

- **ID**: TASK-007
- **Status**: PLANNED
- **Group**: 3
- **Wave**: 3
- **Depends on**: TASK-001, TASK-002, TASK-004, TASK-005, TASK-006
- **Files**: vigil/backend/index.js
- **Retry count**: 0/3

## Description
Create the Express server (index.js) that ties together all backend modules and exposes the complete REST API: wallet CRUD, contagion endpoints, alerts, risk-check, payment-risk, and health. Starts the polling loop on server boot.

## Acceptance Criteria
- [ ] All 9 REST routes implemented exactly as specified: POST/GET/DELETE /wallets, GET /wallets/:id/contagion, POST /wallets/:id/contagion/refresh, GET /alerts, POST /risk-check, POST /payment-risk, GET /health
- [ ] POST /wallets triggers initial transaction scan and kicks off async contagion calculation (non-blocking)
- [ ] Server starts on PORT from env (default 3000), enables CORS, parses JSON, and starts the poller

## Test Requirements
- [ ] Integration test: POST /wallets with valid body returns { id, address, network, label } and status 201
- [ ] Integration test: GET /health returns { status: "ok", walletCount, lastPollAt }
- [ ] Test: DELETE /wallets/:id removes wallet and associated seen_transactions, contagion data, and alert_log entries

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
