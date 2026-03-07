# TASK-017: Rewrite RiskBadge + WalletCard

## Status: DONE
## Group: 2 (Wave 2)
## Depends On: TASK-014

## Description
Rewrite RiskBadge as a pill-style badge and WalletCard to match the HTML .wcard design.

## Files
- Modify: `vigil/mobile/components/RiskBadge.tsx`
- Modify: `vigil/mobile/components/WalletCard.tsx`

## Acceptance Criteria

### RiskBadge
1. Pill layout (no dot): colored text on 15% opacity bg, 30% opacity border
2. Space Mono font, 8px, weight 700, letter-spacing 0.5
3. Levels: VERY LOW (accent), LOW (accent), MEDIUM (warn), HIGH (danger), CRITICAL (critical/#FF2D55)

### WalletCard
1. Card: bg=#181818 (was #111111), borderRadius=14, padding=14, border=#242424
2. Row 1: wallet name (Syne 700 13px) with optional pulsing green dot (isActive prop) | balance + relative timestamp on right
3. Row 2: Network badge (colored pill matching .bn class) + RiskBadge
4. Row 3: Full address in Space Mono 9px, color #444444
5. Row 4: Contagion pill (.cpill) with:
   - bg=#202020, borderRadius=8, border=#2e2e2e
   - Spider emoji + score (Space Mono 700 12px, colored) + "CONTAGION . N risky neighbors" (Space Mono 8px, #888)
   - 3px progress bar: width=score*10%, color matches score
6. Active variant (isActive=true): borderColor=rgba(61,255,160,0.25), 2px accent gradient line at top
7. Risk level derived from contagion_score: <2=VERY LOW, <4=LOW, <6=MEDIUM, <8=HIGH, >=8=CRITICAL
8. Balance shows "N/A" (Wallet type has no balance field)

## Reference
- HTML: `docs/design/screens/screen-01-wallets.html` lines 34-54 (.wcard, .cpill, .bn, .br)
- Current: `vigil/mobile/components/WalletCard.tsx`, `vigil/mobile/components/RiskBadge.tsx`
- Plan: `docs/plans/2026-03-07-screen-redesign.md` Tasks 6-7
