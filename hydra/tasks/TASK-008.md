# TASK-008: WalletCard, RiskBadge components + Wallets tab

- **ID**: TASK-008
- **Status**: PLANNED
- **Group**: 4
- **Wave**: 4
- **Depends on**: TASK-003, TASK-007
- **Files**: vigil/mobile/components/WalletCard.tsx, vigil/mobile/components/RiskBadge.tsx, vigil/mobile/app/(tabs)/index.tsx
- **Retry count**: 0/3

## Description
Build the Wallets tab (main screen) with wallet list, add wallet bottom sheet, WalletCard component showing label/network/risk/contagion score pill, and RiskBadge component for color-coded risk display.

## Acceptance Criteria
- [ ] RiskBadge renders color-coded badge (green/yellow/orange/red) based on risk level string, WalletCard displays label, network badge, risk badge, contagion score pill with "X/10 - N risky neighbors" format, and last activity timestamp
- [ ] Wallets tab shows FlatList of WalletCard components, pull-to-refresh calls api.getWallets(), and empty state message "No wallets yet. Add your first to start watching."
- [ ] Add Wallet bottom sheet/modal with address input, network picker (6 networks from constants), optional label, optional alert email, and "Watch Wallet" button that calls api.addWallet()

## Test Requirements
- [ ] RiskBadge renders correct colors for each risk level (LOW=green, MEDIUM=yellow, HIGH=orange, CRITICAL=red)
- [ ] WalletCard renders all required fields from wallet data
- [ ] Add wallet form validates that address and network are required before submission

## Implementation Notes
- Reference: VIGIL_SPEC.md lines 374-403 for Wallets tab spec
- Use useApi() hook from hooks/useApi.ts for all data fetching
- Design system: bg #080808, surface #111111/#181818, accent #3DFFA0, border #242424
- Contagion score pill: color-coded based on getContagionLabel logic (0-2 green, 2-4 green, 4-6 yellow, 6-8 orange, 8-10 red)
- Network picker: use @react-native-picker/picker with networks from constants/networks.ts
- FlatList with pull-to-refresh (RefreshControl)
- WalletCard should be tappable (onPress) — navigation to detail will be added in TASK-011
