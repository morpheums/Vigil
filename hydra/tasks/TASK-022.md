# TASK-022: Rewrite wallet-detail + tab layout + cleanup

## Status: DONE
## Group: 4 (Wave 4)
## Depends On: TASK-017, TASK-019

## Description
Rewrite wallet-detail screen, update tab layout, update ContagionGraph, and clean up unused files/deps.

## Files
- Modify: `vigil/mobile/app/wallet-detail.tsx`
- Modify: `vigil/mobile/app/(tabs)/_layout.tsx`
- Modify: `vigil/mobile/components/ContagionGraph.tsx`
- Modify: `vigil/mobile/app.json` (splash backgroundColor)
- Delete: `vigil/mobile/app/modal.tsx`
- Delete: `vigil/mobile/constants/Colors.ts`
- Delete: `vigil/mobile/components/EditScreenInfo.tsx`
- Delete: `vigil/mobile/components/Themed.tsx`
- Remove dep: `@react-native-picker/picker`

## Acceptance Criteria

### wallet-detail.tsx
1. Back row: "< Back" Space Mono 10px accent color
2. Detail header: wallet name (Syne 800 16px) + network badge + risk badge inline, address (Space Mono 9px #444)
3. Stats grid: 3-column row:
   - BALANCE: "N/A" (Space Mono 700 14px) + "BALANCE" label (Space Mono 8px #444)
   - CONTAGION: score (colored) + "CONTAGION" label
   - LAST TX: relative time + "LAST TX" label
   - Each stat: #181818 bg, borderRadius 10, border #242424, padding 10
4. Contagion section: big score (Syne 800 32px) + "/ 10" + subtitle
5. Refresh button: accent-10 bg + accent border (subtler than solid)
6. "RECENT TRANSACTIONS" section header with placeholder

### Tab Layout (_layout.tsx)
1. SafeSend icon: paperplane.fill (iOS) / send (Android)
2. HeaderTitle: add "BY RANGE" subtitle (Space Mono 7px, accent, letter-spacing 2.5)
3. Tab bar style: bg #111111, border #242424

### ContagionGraph
1. Remove scoreHeader section (moved to wallet-detail)
2. Root node: 20px outer radius, 12px inner (was 24/16)
3. Graph wrap: bg #181818, borderRadius 14, height 180

### Cleanup
1. Delete modal.tsx, Colors.ts, EditScreenInfo.tsx, Themed.tsx
2. Remove modal route from _layout.tsx Stack
3. Uninstall @react-native-picker/picker
4. Update app.json splash backgroundColor to #080808
5. TypeScript compiles clean (no missing import errors)

## Reference
- HTML: `docs/design/screens/screen-02-contagion.html`
- Current files: see each file path above
