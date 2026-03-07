# TASK-003: Expo mobile app scaffold with tab layout and pre-built hooks

- **ID**: TASK-003
- **Status**: IMPLEMENTED
- **claimed_at**: 2026-03-07
- **Base SHA**: 8f3236b87e12b46dc1ef9600898d8dc0e9811649
- **Group**: 1
- **Wave**: 1
- **Depends on**: none
- **Files**: vigil/mobile/ (Expo scaffold), vigil/mobile/app/_layout.tsx, vigil/mobile/app/(tabs)/_layout.tsx, vigil/mobile/hooks/useApi.ts, vigil/mobile/components/ContagionGraph.tsx, vigil/mobile/constants/networks.ts
- **Retry count**: 0/3

## Description
Initialize the Expo React Native app using the tabs template, configure the dark theme and tab navigation (Wallets, Alerts, SafeSend), copy pre-built components from docs/, and create the networks constant file.

## Acceptance Criteria
- [x] Expo app initializes with `npx create-expo-app mobile --template tabs` and additional dependencies installed (expo-notifications, expo-device, react-native-svg, axios, @react-native-picker/picker)
- [x] Tab layout configured with 3 tabs (Wallets/index, Alerts, SafeSend) using dark theme colors (#080808 background, #3DFFA0 accent)
- [x] Pre-built files copied: docs/useApi.ts to mobile/hooks/useApi.ts, docs/ContagionGraph.tsx to mobile/components/ContagionGraph.tsx; networks.ts created with all 6 supported networks

## Test Requirements
- [x] Expo app compiles without TypeScript errors (npx tsc --noEmit passes clean)
- [x] networks.ts exports the correct 6 network IDs: ethereum, solana, tron, cosmoshub-4, osmosis-1, stellar
- [x] useApi.ts and ContagionGraph.tsx are present and have correct imports

## Implementation Notes
- Run `npx create-expo-app mobile --template tabs` in the vigil/ directory
- Install additional deps: `npx expo install expo-notifications expo-device react-native-svg` then `npm install axios @react-native-picker/picker`
- Copy docs/ContagionGraph.tsx to mobile/components/ContagionGraph.tsx
- Copy docs/useApi.ts to mobile/hooks/useApi.ts
- Create mobile/constants/networks.ts with network objects: { id, name, symbol, icon_emoji }
- Configure _layout.tsx with dark theme, Syne font for headers
- Configure (tabs)/_layout.tsx with 3 tabs: index.tsx (Wallets), alerts.tsx, safesend.tsx
- Tab bar: dark background, mint accent for active tab
- Reference: VIGIL_SPEC.md project structure, docs/DEPENDENCIES.md for exact install commands

## Implementation Log
- Created Expo app via `npx create-expo-app mobile --template tabs` in vigil/
- Installed: expo-notifications, expo-device, react-native-svg, axios, @react-native-picker/picker
- Copied docs/useApi.ts -> hooks/useApi.ts (exact copy)
- Copied docs/ContagionGraph.tsx -> components/ContagionGraph.tsx (exact copy)
- Created constants/networks.ts with 6 networks (ethereum, solana, tron, cosmoshub-4, osmosis-1, stellar)
- Rewrote app/_layout.tsx: dark theme (#080808), Vigil branded DarkTheme, notification handler configured
- Rewrote app/(tabs)/_layout.tsx: 3 tabs (Wallets/shield, Alerts/bell, SafeSend/search), dark tab bar with #3DFFA0 accent
- Created placeholder screens: index.tsx (Wallets), alerts.tsx (Alerts), safesend.tsx (SafeSend)
- Removed template default two.tsx tab
- TypeScript compiles clean (npx tsc --noEmit passes with 0 errors)
- All 6 network IDs verified via runtime check
