# TASK-003: Expo mobile app scaffold with tab layout and pre-built hooks

- **ID**: TASK-003
- **Status**: PLANNED
- **Group**: 1
- **Wave**: 1
- **Depends on**: none
- **Files**: vigil/mobile/ (Expo scaffold), vigil/mobile/app/_layout.tsx, vigil/mobile/app/(tabs)/_layout.tsx, vigil/mobile/hooks/useApi.ts, vigil/mobile/components/ContagionGraph.tsx, vigil/mobile/constants/networks.ts
- **Retry count**: 0/3

## Description
Initialize the Expo React Native app using the tabs template, configure the dark theme and tab navigation (Wallets, Alerts, SafeSend), copy pre-built components from docs/, and create the networks constant file.

## Acceptance Criteria
- [ ] Expo app initializes with `npx create-expo-app mobile --template tabs` and additional dependencies installed (expo-notifications, expo-device, react-native-svg, axios, @react-native-picker/picker)
- [ ] Tab layout configured with 3 tabs (Wallets/index, Alerts, SafeSend) using dark theme colors (#080808 background, #3DFFA0 accent)
- [ ] Pre-built files copied: docs/useApi.ts to mobile/hooks/useApi.ts, docs/ContagionGraph.tsx to mobile/components/ContagionGraph.tsx; networks.ts created with all 6 supported networks

## Test Requirements
- [ ] Expo app compiles without TypeScript errors (npx expo export --dump-sourcemap or tsc --noEmit)
- [ ] networks.ts exports the correct 6 network IDs: ethereum, solana, tron, cosmoshub-4, osmosis-1, stellar
- [ ] useApi.ts and ContagionGraph.tsx are present and have correct imports

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
