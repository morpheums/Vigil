# Hydra Plan

## Objective
Build the Vigil stablecoin wallet watchdog app: Node.js/Express backend with SQLite, Range MCP API integration, contagion score engine, Act Now alerts, and Expo React Native mobile app with Wallets, Alerts, and SafeSend tabs — as specified in VIGIL_SPEC.md

## Discovery Status
- [x] Discovery run: 2026-03-07
- [x] Classification: greenfield
- [x] Reviewers generated: frontend-reviewer, api-reviewer, qa-reviewer, performance-reviewer
- [x] Context collected: 2026-03-07
- [x] Documents generated: using existing VIGIL_SPEC.md + DEPENDENCIES.md

## Status Summary
- Total tasks: 12
- DONE: 0 | READY: 0 | IN_PROGRESS: 0 | IN_REVIEW: 0 | CHANGES_REQUESTED: 0 | BLOCKED: 0 | PLANNED: 12
- Current iteration: 0/40
- Active task: none

## Wave Groups

### Wave 1 — Backend Foundation + Mobile Scaffold (no file overlap, all independent)
- TASK-001: Backend package.json, .env template, and db.js (database schema + helpers)
- TASK-002: Range MCP API helper module (range.js)
- TASK-003: Expo mobile app scaffold with tab layout, constants, and pre-built hooks

### Wave 2 — Backend Core Features (depend on Wave 1 backend files)
- TASK-004: Contagion score engine (contagion.js) — depends on TASK-001, TASK-002
- TASK-005: Alerts module with Act Now actions (alerts.js) — depends on TASK-001, TASK-002
- TASK-006: Polling loop (poller.js) — depends on TASK-001, TASK-002

### Wave 3 — Backend API Server (depends on all backend modules)
- TASK-007: Express server with all REST routes (index.js) — depends on TASK-001 through TASK-006

### Wave 4 — Mobile Screens + Components (depend on API hook + backend)
- TASK-008: WalletCard, RiskBadge components + Wallets tab (index.tsx) — depends on TASK-003, TASK-007
- TASK-009: AlertItem, ActNowCard components + Alerts tab (alerts.tsx) — depends on TASK-003, TASK-007
- TASK-010: SafeSend tab with risk check form (safesend.tsx) — depends on TASK-003, TASK-007

### Wave 5 — Integration Features (depend on mobile screens)
- TASK-011: ContagionGraph integration + Wallet Detail modal — depends on TASK-008
- TASK-012: Push notifications registration + error/loading states — depends on TASK-008, TASK-009, TASK-010

## Tasks

### TASK-001: Backend package.json, .env template, and SQLite database module
- **Status**: IMPLEMENTED
- **Group**: 1
- **Depends on**: none
- **Manifest**: hydra/tasks/TASK-001.md

### TASK-002: Range MCP API helper module
- **Status**: IMPLEMENTED
- **Group**: 1
- **Depends on**: none
- **Manifest**: hydra/tasks/TASK-002.md

### TASK-003: Expo mobile app scaffold with tab layout and pre-built hooks
- **Status**: IN_PROGRESS
- **Group**: 1
- **Depends on**: none
- **Manifest**: hydra/tasks/TASK-003.md

### TASK-004: Contagion score engine
- **Status**: PLANNED
- **Group**: 2
- **Depends on**: TASK-001, TASK-002
- **Manifest**: hydra/tasks/TASK-004.md

### TASK-005: Alerts module with Act Now actions
- **Status**: PLANNED
- **Group**: 2
- **Depends on**: TASK-001, TASK-002
- **Manifest**: hydra/tasks/TASK-005.md

### TASK-006: Polling loop
- **Status**: PLANNED
- **Group**: 2
- **Depends on**: TASK-001, TASK-002
- **Manifest**: hydra/tasks/TASK-006.md

### TASK-007: Express server with all REST routes
- **Status**: PLANNED
- **Group**: 3
- **Depends on**: TASK-001, TASK-002, TASK-004, TASK-005, TASK-006
- **Manifest**: hydra/tasks/TASK-007.md

### TASK-008: WalletCard, RiskBadge components + Wallets tab
- **Status**: PLANNED
- **Group**: 4
- **Depends on**: TASK-003, TASK-007
- **Manifest**: hydra/tasks/TASK-008.md

### TASK-009: AlertItem, ActNowCard components + Alerts tab
- **Status**: PLANNED
- **Group**: 4
- **Depends on**: TASK-003, TASK-007
- **Manifest**: hydra/tasks/TASK-009.md

### TASK-010: SafeSend tab with risk check form
- **Status**: PLANNED
- **Group**: 4
- **Depends on**: TASK-003, TASK-007
- **Manifest**: hydra/tasks/TASK-010.md

### TASK-011: ContagionGraph integration + Wallet Detail modal
- **Status**: PLANNED
- **Group**: 5
- **Depends on**: TASK-008
- **Manifest**: hydra/tasks/TASK-011.md

### TASK-012: Push notifications + error/loading states
- **Status**: PLANNED
- **Group**: 5
- **Depends on**: TASK-008, TASK-009, TASK-010
- **Manifest**: hydra/tasks/TASK-012.md

## Completed

## Blocked

## Recovery Pointer
- **Current Task:** TASK-003
- **Last Action:** Claimed TASK-003, created branch hydra/TASK-003
- **Next Action:** Create Expo app scaffold with create-expo-app
- **Last Checkpoint:** hydra/checkpoints/iteration-004.json
- **Last Commit:** 8f3236b
