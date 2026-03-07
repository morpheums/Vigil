# TASK-004: Contagion score engine

- **ID**: TASK-004
- **Status**: IMPLEMENTED
- **Base SHA**: 2194e3af8aa3583c8d1d9e71121cc635c03479ea
- **claimed_at**: 2026-03-07
- **Group**: 2
- **Wave**: 2
- **Depends on**: TASK-001, TASK-002
- **Files**: vigil/backend/contagion.js
- **Retry count**: 0/3

## Description
Implement the contagion score engine (contagion.js) that maps a wallet's transaction neighborhood, risk-scores all counterparties in parallel, calculates a weighted contamination score (0-10), and persists the graph to SQLite.

## Acceptance Criteria
- [x] calculateContagionScore(walletId, address, network) fetches up to 15 counterparties via getAddressConnections, risk-scores all in parallel via Promise.all, and returns { contagionScore, nodeCount, highRiskCount, nodes }
- [x] Score uses correct risk weights (VERY_LOW:0, LOW:1, MEDIUM:4, HIGH:8, CRITICAL:10, UNKNOWN:2) and weighted average formula based on transfer counts
- [x] Graph data (nodes + edges) is persisted to contagion_nodes and contagion_edges tables, and wallet.contagion_score is updated

## Test Requirements
- [x] Unit test with mocked Range API calls that verifies score calculation for known input (e.g., 3 LOW + 2 HIGH counterparties)
- [x] Test that getContagionLabel returns correct labels: CLEAN (0-2), LOW RISK (2-4), MODERATE (4-6), CONTAMINATED (6-8), CRITICAL (8-10)
- [x] Test that failed individual risk calls (Promise.all .catch) default to UNKNOWN and don't crash the calculation

## Implementation Notes
- Reference: VIGIL_SPEC.md lines 183-248 for exact algorithm
- Reference: hydra/context/patterns.md for contagion score pattern
- Import getAddressConnections, getAddressRisk from range.js
- Import db helpers from db.js for saving graph data
- Export: calculateContagionScore, getContagionLabel
- Clear old contagion data for wallet before saving new graph
- Each connection.map callback should .catch(() => null) for resilience
- Score formula: sum(riskWeight * transferCount) / totalTransferCount, capped at 10
