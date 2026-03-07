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
- DONE: 12 | READY: 0 | IN_PROGRESS: 0 | IN_REVIEW: 0 | CHANGES_REQUESTED: 0 | BLOCKED: 0 | PLANNED: 0
- Current iteration: 10/40
- Active task: NONE — ALL TASKS COMPLETE

## Wave Groups

### Wave 1 — Backend Foundation + Mobile Scaffold
- TASK-001: Backend package.json, .env template, and db.js
- TASK-002: Range MCP API helper module (range.js)
- TASK-003: Expo mobile app scaffold

### Wave 2 — Backend Core Features
- TASK-004: Contagion score engine (contagion.js)
- TASK-005: Alerts module with Act Now actions (alerts.js)
- TASK-006: Polling loop (poller.js)

### Wave 3 — Backend API Server
- TASK-007: Express server with all REST routes (index.js)

### Wave 4 — Mobile Screens + Components
- TASK-008: WalletCard, RiskBadge + Wallets tab
- TASK-009: AlertItem, ActNowCard + Alerts tab
- TASK-010: SafeSend tab

### Wave 5 — Integration Features
- TASK-011: ContagionGraph integration + Wallet Detail modal
- TASK-012: Push notifications + error/loading states

## Tasks

### TASK-001: Backend package.json, .env template, and SQLite database module
- **Status**: DONE
- **Group**: 1
- **Depends on**: none
- **Manifest**: hydra/tasks/TASK-001.md

### TASK-002: Range MCP API helper module
- **Status**: DONE
- **Group**: 1
- **Depends on**: none
- **Manifest**: hydra/tasks/TASK-002.md

### TASK-003: Expo mobile app scaffold with tab layout and pre-built hooks
- **Status**: DONE
- **Group**: 1
- **Depends on**: none
- **Manifest**: hydra/tasks/TASK-003.md

### TASK-004: Contagion score engine
- **Status**: DONE
- **Group**: 2
- **Depends on**: TASK-001, TASK-002
- **Manifest**: hydra/tasks/TASK-004.md

### TASK-005: Alerts module with Act Now actions
- **Status**: DONE
- **Group**: 2
- **Depends on**: TASK-001, TASK-002
- **Manifest**: hydra/tasks/TASK-005.md

### TASK-006: Polling loop
- **Status**: DONE
- **Group**: 2
- **Depends on**: TASK-001, TASK-002
- **Manifest**: hydra/tasks/TASK-006.md

### TASK-007: Express server with all REST routes
- **Status**: DONE
- **Group**: 3
- **Depends on**: TASK-001, TASK-002, TASK-004, TASK-005, TASK-006
- **Manifest**: hydra/tasks/TASK-007.md

### TASK-008: WalletCard, RiskBadge components + Wallets tab
- **Status**: DONE
- **Group**: 4
- **Depends on**: TASK-003, TASK-007
- **Manifest**: hydra/tasks/TASK-008.md

### TASK-009: AlertItem, ActNowCard components + Alerts tab
- **Status**: DONE
- **Group**: 4
- **Depends on**: TASK-003, TASK-007
- **Manifest**: hydra/tasks/TASK-009.md

### TASK-010: SafeSend tab with risk check form
- **Status**: DONE
- **Group**: 4
- **Depends on**: TASK-003, TASK-007
- **Manifest**: hydra/tasks/TASK-010.md

### TASK-011: ContagionGraph integration + Wallet Detail modal
- **Status**: DONE
- **Group**: 5
- **Depends on**: TASK-008
- **Manifest**: hydra/tasks/TASK-011.md

### TASK-012: Push notifications + error/loading states
- **Status**: DONE
- **Group**: 5
- **Depends on**: TASK-008, TASK-009, TASK-010
- **Manifest**: hydra/tasks/TASK-012.md

## Completed
- [x] TASK-001: Backend package.json, .env template, and db.js -> DONE
- [x] TASK-002: Range MCP API helper module -> DONE
- [x] TASK-003: Expo mobile scaffold -> DONE
- [x] TASK-004: Contagion score engine -> DONE
- [x] TASK-005: Alerts module with Act Now actions -> DONE
- [x] TASK-006: Polling loop -> DONE
- [x] TASK-007: Express server with all REST routes -> DONE
- [x] TASK-008: WalletCard, RiskBadge + Wallets tab -> DONE
- [x] TASK-009: AlertItem, ActNowCard + Alerts tab -> DONE
- [x] TASK-010: SafeSend tab with risk check form -> DONE
- [x] TASK-011: ContagionGraph integration + Wallet Detail modal -> DONE
- [x] TASK-012: Push notifications + error/loading states -> DONE

## Blocked

## Recovery Pointer
- **Current Task:** none
- **Last Action:** Iteration 14 completed
- **Next Action:** Continue work on next READY task
- **Last Checkpoint:** hydra/checkpoints/iteration-014.json
- **Last Commit:** d836f1a hydra: add Vigil logo, DB seed, fix Range API MCP session handling
