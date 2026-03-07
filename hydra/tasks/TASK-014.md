# TASK-014: Create Theme Tokens + Fix Networks

## Status: DONE
## Group: 1 (Wave 1)
## Depends On: none

## Description
Create central design tokens file matching HTML mockup CSS variables. Fix Osmosis network color.

## Files
- Create: `vigil/mobile/constants/theme.ts`
- Modify: `vigil/mobile/constants/networks.ts`

## Acceptance Criteria
1. `theme.ts` exports: Colors, NetworkColors, Fonts, Spacing, Radii
2. Colors match HTML `:root` exactly: bg=#080808, s1=#111111, s2=#181818, s3=#202020, border=#242424, border2=#2e2e2e, accent=#3DFFA0, warn=#F5A623, danger=#FF3B30, critical=#FF2D55, t1=#FFFFFF, t2=#888888, t3=#444444
3. Fonts object has keys for Syne_700Bold, Syne_800ExtraBold, SpaceMono, Inter_400Regular, Inter_500Medium, Inter_600SemiBold
4. Osmosis color in networks.ts changed from `#5E12A0` to `#750BBB`

## Implementation
See `docs/plans/2026-03-07-screen-redesign.md` Task 2 and Task 3 for exact code.

## Reference
- HTML CSS variables: `docs/design/screens/screen-01-wallets.html` line 8
- Osmosis color: `docs/design/screens/screen-06-addwallet.html` line 176
