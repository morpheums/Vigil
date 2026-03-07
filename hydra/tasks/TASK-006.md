# TASK-006: Polling loop

- **ID**: TASK-006
- **Status**: IMPLEMENTED
- **Base SHA**: 229862b8fa6c89fcb216888c6ecf8c380e1b5d61
- **Claimed at**: 2026-03-07
- **Group**: 2
- **Wave**: 2
- **Depends on**: TASK-001, TASK-002
- **Files**: vigil/backend/poller.js
- **Retry count**: 0/3

## Description
Implement the polling loop (poller.js) that runs every POLL_INTERVAL_SECONDS, checks all wallets for new transactions, diffs against seen_transactions, risk-scores counterparties, fires alerts, and recalculates contagion every 4th cycle.

## Acceptance Criteria
- [ ] startPoller() runs on configurable interval (default 60s from env), iterates all wallets, calls getAddressPayments for each, diffs against seen_transactions by tx_hash
- [ ] New transactions are risk-scored (getAddressRisk + checkSanctions on counterparty), inserted into seen_transactions, and trigger fireAlert with Act Now actions for HIGH/CRITICAL
- [ ] Every 4th poll cycle, contagion scores are recalculated for all wallets via calculateContagionScore

## Test Requirements
- [ ] Unit test the diff logic: given known seen tx hashes and new payments response, correctly identifies only new transactions
- [ ] Test that cycle counter increments and contagion recalc triggers on cycle 4, 8, 12 etc.
- [ ] Test that errors in one wallet don't crash the entire poll cycle (per-wallet try/catch)

## Implementation Notes
- Reference: VIGIL_SPEC.md lines 483-498 for polling loop spec
- Reference: hydra/context/patterns.md for polling pattern
- Import: getAddressPayments, getAddressRisk, checkSanctions from range.js
- Import: fireAlert, buildActNowActions from alerts.js
- Import: calculateContagionScore from contagion.js
- Import: db helpers from db.js
- Export: startPoller, stopPoller (for testing)
- Track cycle count with module-level variable
- Each wallet processed in try/catch — log errors but continue
- Log cycle completion with timestamp and wallet count
