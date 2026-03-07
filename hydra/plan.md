# Hydra Plan

## Objective
Redesign all 6 Vigil mobile screens to match HTML mockup designs in docs/design/screens/ -- install fonts/bottom-sheet, create theme tokens, rewrite WalletCard/AlertItem/ActNowCard/NetworkChips components, rewrite all 4 screens + wallet-detail, cleanup unused deps

## Discovery Status
- [x] Discovery run: 2026-03-07
- [x] Classification: greenfield (now brownfield — app exists, redesigning UI)
- [x] Reviewers generated: frontend-reviewer, api-reviewer, qa-reviewer, performance-reviewer
- [x] Context collected: 2026-03-07
- [x] Documents generated: using existing plan at docs/plans/2026-03-07-screen-redesign.md

## Status Summary
- Total tasks: 10
- DONE: 10 | READY: 0 | IN_PROGRESS: 0 | IN_REVIEW: 0 | CHANGES_REQUESTED: 0 | BLOCKED: 0 | PLANNED: 0
- Current iteration: 3/40
- Active task: NONE -- ALL TASKS COMPLETE

## Wave Groups

### Wave 1 — Foundation (independent, can run in parallel)
- TASK-013: Install dependencies (fonts, bottom-sheet, gesture-handler) -- DONE
- TASK-014: Create constants/theme.ts + fix networks.ts Osmosis color
- TASK-015: Update app/_layout.tsx (load fonts, GestureHandlerRootView, BottomSheetModalProvider)
- TASK-016: Create components/NetworkChips.tsx

### Wave 2 — Components (depend on Wave 1 theme tokens)
- TASK-017: Rewrite RiskBadge + WalletCard to match HTML mockups
- TASK-018: Rewrite AlertItem + ActNowCard (bottom sheet) to match HTML mockups

### Wave 3 — Screens (depend on Wave 2 components)
- TASK-019: Rewrite Wallets screen (index.tsx) with section labels + Add Wallet bottom sheet
- TASK-020: Rewrite Alerts screen with date grouping + bottom sheet ActNow
- TASK-021: Rewrite SafeSend screen with chip selector + verdict bar

### Wave 4 — Detail + Cleanup
- TASK-022: Rewrite wallet-detail.tsx with stats grid + updated graph + tab layout update
- ~~TASK-023: Cleanup unused files + deps~~ (merged into TASK-022)

## Tasks

### TASK-013: Install dependencies
- **Status**: DONE
- **Group**: 1
- **Depends on**: none
- **Manifest**: hydra/tasks/TASK-013.md
- **Files**: vigil/mobile/package.json
- **Description**: Install @expo-google-fonts/syne, @expo-google-fonts/inter, @gorhom/bottom-sheet, react-native-gesture-handler via npx expo install

### TASK-014: Create theme tokens + fix networks
- **Status**: DONE
- **Group**: 1
- **Depends on**: none
- **Manifest**: hydra/tasks/TASK-014.md
- **Files**: vigil/mobile/constants/theme.ts (NEW), vigil/mobile/constants/networks.ts
- **Description**: Create central design tokens (Colors, NetworkColors, Fonts, Spacing, Radii) matching HTML CSS variables. Fix Osmosis color #5E12A0 -> #750BBB.

### TASK-015: Update root layout for fonts + gesture handler
- **Status**: DONE
- **Group**: 1
- **Depends on**: TASK-013
- **Manifest**: hydra/tasks/TASK-015.md
- **Files**: vigil/mobile/app/_layout.tsx
- **Description**: Load Syne + Inter fonts via useFonts. Wrap in GestureHandlerRootView + BottomSheetModalProvider.

### TASK-016: Create NetworkChips component
- **Status**: DONE
- **Group**: 1
- **Depends on**: TASK-014
- **Manifest**: hydra/tasks/TASK-016.md
- **Files**: vigil/mobile/components/NetworkChips.tsx (NEW)
- **Description**: Two-mode component: grid (Add Wallet) and row (SafeSend). Network-colored selection states.

### TASK-017: Rewrite RiskBadge + WalletCard
- **Status**: DONE
- **Group**: 2
- **Depends on**: TASK-014
- **Manifest**: hydra/tasks/TASK-017.md
- **Files**: vigil/mobile/components/RiskBadge.tsx, vigil/mobile/components/WalletCard.tsx
- **Description**: RiskBadge as pill badge with Space Mono. WalletCard with #181818 bg, contagion pill + progress bar, network/risk badges.

### TASK-018: Rewrite AlertItem + ActNowCard
- **Status**: DONE
- **Group**: 2
- **Depends on**: TASK-014, TASK-015
- **Manifest**: hydra/tasks/TASK-018.md
- **Files**: vigil/mobile/components/AlertItem.tsx, vigil/mobile/components/ActNowCard.tsx
- **Description**: AlertItem with ACT NOW gradient banners + normal mode. ActNowCard as @gorhom/bottom-sheet with TX details box + numbered actions.

### TASK-019: Rewrite Wallets screen
- **Status**: DONE
- **Group**: 3
- **Depends on**: TASK-016, TASK-017, TASK-018
- **Manifest**: hydra/tasks/TASK-019.md
- **Files**: vigil/mobile/app/(tabs)/index.tsx
- **Description**: Remove FAB, add header "Add" button with pulse dot. Add "WATCHING" section label. Replace Modal with BottomSheet for Add Wallet with NetworkChips grid.

### TASK-020: Rewrite Alerts screen
- **Status**: DONE
- **Group**: 3
- **Depends on**: TASK-018
- **Manifest**: hydra/tasks/TASK-020.md
- **Files**: vigil/mobile/app/(tabs)/alerts.tsx
- **Description**: Add "N new" red badge, date grouping (TODAY/YESTERDAY/EARLIER) via SectionList, use rewritten AlertItem + ActNowCard bottom sheet.

### TASK-021: Rewrite SafeSend screen
- **Status**: DONE
- **Group**: 3
- **Depends on**: TASK-014, TASK-016
- **Manifest**: hydra/tasks/TASK-021.md
- **Files**: vigil/mobile/app/(tabs)/safesend.tsx
- **Description**: "Risk Check" intro, NetworkChips row mode, result card with gradient header + detail rows + verdict bar.

### TASK-022: Rewrite wallet-detail + tab layout + cleanup
- **Status**: DONE
- **Group**: 4
- **Depends on**: TASK-017, TASK-019
- **Manifest**: hydra/tasks/TASK-022.md
- **Files**: vigil/mobile/app/wallet-detail.tsx, vigil/mobile/app/(tabs)/_layout.tsx, vigil/mobile/components/ContagionGraph.tsx, vigil/mobile/app/modal.tsx (DELETE), vigil/mobile/constants/Colors.ts (DELETE), vigil/mobile/components/EditScreenInfo.tsx (DELETE), vigil/mobile/components/Themed.tsx (DELETE)
- **Description**: Stats grid (3-col), updated ContagionGraph, "RECENT TRANSACTIONS" section. Tab layout: SafeSend icon -> paperplane, "BY RANGE" subtitle. Remove unused files + @react-native-picker/picker dep. Update app.json splash bg.

## Completed

## Blocked

## Recovery Pointer
- **Current Task:** none
- **Last Action:** Iteration 36 completed
- **Next Action:** Continue work on next READY task
- **Last Checkpoint:** hydra/checkpoints/iteration-036.json
- **Last Commit:** 2b81cbb Design enhancemetns
