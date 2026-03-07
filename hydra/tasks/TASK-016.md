# TASK-016: Create NetworkChips Component

## Status: DONE
## Group: 1 (Wave 1)
## Depends On: TASK-014

## Description
Create a reusable NetworkChips component with two layout modes: grid (for Add Wallet bottom sheet) and row (for SafeSend).

## Files
- Create: `vigil/mobile/components/NetworkChips.tsx`

## Acceptance Criteria
1. Component accepts props: `networks?, selected, onSelect, layout: 'grid' | 'row'` -- DONE
2. Grid mode: 3-column flexWrap layout, each cell shows colored dot + symbol (Space Mono 700 9px) + full name (Inter 9px) -- DONE
3. Row mode: horizontal ScrollView with chip buttons -- DONE
4. Selected state: network-colored border (80% opacity) + network-colored bg (10% opacity) -- DONE
5. Unselected: border=#242424, transparent bg -- DONE
6. Uses theme tokens from constants/theme.ts -- DONE

## Reference
- Grid design: `docs/design/screens/screen-06-addwallet.html` lines 154-185 (.net-grid, .net-btn)
- Row design: `docs/design/screens/screen-05-safesend.html` lines 75-81 (.net-row, .net-chip)
- Plan: `docs/plans/2026-03-07-screen-redesign.md` Task 5

## Implementation Log
- 2026-03-07: Created NetworkChips.tsx with grid and row layout modes. TypeScript check passes clean. All acceptance criteria met.
