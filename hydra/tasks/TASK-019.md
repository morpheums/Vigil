# TASK-019: Rewrite Wallets Screen

## Status: DONE
## Group: 3 (Wave 3)
## Depends On: TASK-016, TASK-017, TASK-018

## Description
Rewrite the Wallets tab (index.tsx) to match screen-01 + screen-06 HTML mockups.

## Files
- Modify: `vigil/mobile/app/(tabs)/index.tsx`

## Acceptance Criteria
1. Remove FAB button (+)
2. Add header-right: pulsing green dot + "Add" button (accent bg, Syne 700 12px, borderRadius 8)
3. Add "WATCHING" section label (Space Mono 9px, #444, letter-spacing 0.18em) with wallet count badge (Space Mono 9px, #888, #181818 bg)
4. Use rewritten WalletCard — first wallet gets isActive=true
5. Replace `<Modal>` with BottomSheetModal for Add Wallet:
   - Handle bar + header: "Watch a Wallet" (Syne 800 18px) + close button (28x28 round, #181818 bg)
   - Address field: Space Mono 10px, #181818 bg, #2e2e2e border, accent focus glow
   - Helper text: "Paste any ETH, SOL, TRX, ATOM, OSMO or XLM address"
   - Network picker: NetworkChips in grid mode
   - Label + Email: side-by-side row, both optional (Space Mono labels with "OPTIONAL" tag)
   - Submit: "Watch Wallet" with shield emoji, accent bg, Syne 800 15px, borderRadius 12
6. Remove `@react-native-picker/picker` import
7. Use `useNavigation` + `setOptions` to configure headerRight

## Reference
- Screen-01: `docs/design/screens/screen-01-wallets.html`
- Screen-06: `docs/design/screens/screen-06-addwallet.html`
- Current: `vigil/mobile/app/(tabs)/index.tsx`
