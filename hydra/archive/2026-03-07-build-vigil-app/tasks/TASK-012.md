# TASK-012: Push notifications registration + error/loading states

- **ID**: TASK-012
- **Status**: DONE
- **Group**: 5
- **Wave**: 5
- **Depends on**: TASK-008, TASK-009, TASK-010
- **Files**: vigil/mobile/app/_layout.tsx, vigil/mobile/app/(tabs)/index.tsx, vigil/mobile/app/(tabs)/alerts.tsx, vigil/mobile/app/(tabs)/safesend.tsx
- **Retry count**: 0/3

## Description
Register Expo push notifications on app start, wire cross-tab deep linking (Act Now SafeSend action navigates to SafeSend tab with pre-filled address), and add proper loading spinners and error states to all screens.

## Acceptance Criteria
- [ ] App registers for Expo push notifications on startup (using expo-notifications + expo-device), stores the push token, and passes it when adding wallets
- [ ] Act Now SafeSend action in Alerts tab deep-links to SafeSend tab with counterparty address pre-filled via router navigation params
- [ ] All three tabs show loading spinners during data fetches and user-friendly error messages on API failures (not raw error text)

## Test Requirements
- [ ] Push notification registration code handles permission denied gracefully (no crash, shows info message)
- [ ] Deep-link from Alerts to SafeSend correctly pre-fills the address field
- [ ] Error states display when API calls fail (mock network error)

## Implementation Notes
- Reference: VIGIL_SPEC.md line 583 for push notification registration
- Reference: VIGIL_SPEC.md line 584 for error states + loading spinners
- Push registration: use Notifications.getExpoPushTokenAsync() in _layout.tsx useEffect
- Store push token in app state (React context or simple state) — pass to addWallet call
- Deep-link: ActNowCard SafeSend action should call router.push('/safesend?address=0x...')
- SafeSend tab reads address from useLocalSearchParams() (already set up in TASK-010)
- Loading: ActivityIndicator with mint color (#3DFFA0)
- Error: styled error card with retry button
- This task modifies files created in TASK-008/009/010 — only adds loading/error states and wiring, no structural changes
