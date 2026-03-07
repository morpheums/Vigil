# TASK-011: ContagionGraph integration + Wallet Detail modal

- **ID**: TASK-011
- **Status**: DONE
- **Group**: 5
- **Wave**: 5
- **Depends on**: TASK-008
- **Files**: vigil/mobile/app/wallet-detail.tsx, vigil/mobile/app/(tabs)/index.tsx
- **Retry count**: 0/3

## Description
Create the Wallet Detail screen (modal/push navigation) that shows full address, ContagionGraph visualization, recent transactions, Refresh Contagion button, and Delete Wallet button. Wire WalletCard tap to navigate here.

## Acceptance Criteria
- [ ] Wallet Detail screen displays: full address, ContagionGraph component (from pre-built docs/ContagionGraph.tsx) with live data from api.getContagionGraph(walletId), contagion score header "Contagion Score: X.X / 10" with color coding
- [ ] Refresh Contagion button triggers api.refreshContagion(walletId) and updates the graph; Delete Wallet button calls api.deleteWallet(walletId) and navigates back
- [ ] WalletCard in index.tsx navigates to wallet-detail screen with walletId param on press

## Test Requirements
- [ ] Wallet detail screen renders ContagionGraph with nodes data from API
- [ ] Refresh button triggers API call and updates displayed score
- [ ] Delete button removes wallet and navigates back to wallet list

## Implementation Notes
- Reference: VIGIL_SPEC.md lines 395-401 for Wallet Detail screen spec
- Reference: VIGIL_SPEC.md lines 405-425 for ContagionGraph component spec
- ContagionGraph.tsx is already in mobile/components/ (copied in TASK-003) — just import and use
- Pass nodes, contagionScore, rootAddress as props to ContagionGraph
- wallet-detail.tsx: new screen file, receives walletId via route params
- Update index.tsx: add onPress to WalletCard that navigates to wallet-detail with walletId
- Show "X of Y neighbors are high risk" above the graph
- Recent transactions: fetch from seen_transactions via a GET endpoint or include in wallet detail response
- Use router.push or router.navigate from expo-router
