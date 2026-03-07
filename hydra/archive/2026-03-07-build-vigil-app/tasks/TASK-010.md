# TASK-010: SafeSend tab with risk check form

- **ID**: TASK-010
- **Status**: DONE
- **Group**: 4
- **Wave**: 4
- **Depends on**: TASK-003, TASK-007
- **Files**: vigil/mobile/app/(tabs)/safesend.tsx
- **Retry count**: 0/3

## Description
Build the SafeSend tab — a pre-flight risk checker that lets users verify any address before sending funds. Includes form with address/network/amount/sender inputs and a results card showing risk level, OFAC status, and verdict.

## Acceptance Criteria
- [ ] SafeSend form accepts: recipient address (required), network picker (required), amount USD (optional), sender address (optional for full payment risk), and "Check Risk" button
- [ ] Results card shows: risk level with color-coded emoji, risk score X/10, OFAC Sanctioned status, Token Blacklisted status, reasoning text, and verdict banner (green/yellow/red/black background)
- [ ] Accepts deep-link params (route params ?address=0x...) to pre-fill the address field from Act Now actions

## Test Requirements
- [ ] Form validates recipient address and network are required before submission
- [ ] Results card renders correct risk level colors and OFAC/blacklist indicators
- [ ] Deep-link pre-fill works when address param is provided via navigation

## Implementation Notes
- Reference: VIGIL_SPEC.md lines 458-479 for SafeSend tab spec
- Use useApi() hook: api.riskCheck({ address, network }) for basic check, api.paymentRisk({...}) when sender address provided
- Network picker: same as Wallets tab, using constants/networks.ts
- Results card verdict colors: green (#3DFFA0) for LOW, yellow (#F5A623) for MEDIUM, red (#FF3B30) for HIGH, black/dark (#1a1a1a) with red border for CRITICAL
- Use useLocalSearchParams() or route params for deep-link address pre-fill
- Loading state while risk check runs (can take a few seconds)
- Clear results when form inputs change
