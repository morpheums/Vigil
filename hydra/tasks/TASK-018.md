# TASK-018: Rewrite AlertItem + ActNowCard

## Status: DONE
## Group: 2 (Wave 2)
## Depends On: TASK-014, TASK-015

## Description
Rewrite AlertItem with two distinct card modes (ACT NOW vs Normal) and ActNowCard as a @gorhom/bottom-sheet.

## Files
- Modify: `vigil/mobile/components/AlertItem.tsx`
- Modify: `vigil/mobile/components/ActNowCard.tsx`

## Acceptance Criteria

### AlertItem
1. **ACT NOW mode** (HIGH/CRITICAL):
   - Card border: rgba(255,59,48,0.35) for HIGH, rgba(255,45,85,0.4) for CRITICAL
   - Banner: gradient bg, emoji (lightning for HIGH, skull for CRITICAL) + "ACT NOW" (Syne 800 11px) + timestamp
   - Body: 36x36 icon box (directional arrow) + title (Syne 700 12px) + "NEW" pill (if unread) + network badge + risk badge
   - Action preview: first 2 actions as rows with emoji+label+arrow, then "+ N more . tap to open"
2. **Normal mode** (LOW/MEDIUM):
   - Single body row: 36x36 icon box + title + badges + timestamp
   - No banner, no action preview
3. Direction arrow: parse "Sent" vs "Received" from message string

### ActNowCard
1. Replace `<Modal>` with `BottomSheetModal` from @gorhom/bottom-sheet
2. Handle bar: 40x4px, #2e2e2e bg
3. Sheet bg: #111111, top borderRadius 28px
4. Risk header: 52x52 emoji box + "HIGH RISK" (Syne 800 26px) + score bar (4px, gradient warn->danger) + score text
5. TX details box: #181818 bg, rows for DIRECTION, AMOUNT, NETWORK, TO, OFAC (Space Mono 9px labels + values)
6. Actions: numbered 01-04, color-coded by urgency (critical=red, high=warn, medium=accent), Syne 700 label + Inter 11px description
7. "Mark as Handled" button: #181818 bg, #242424 border, Syne 700 13px
8. Props: accept `bottomSheetRef` via forwardRef, or use visible prop with internal useEffect to present/dismiss

## Reference
- AlertItem HTML: `docs/design/screens/screen-03-alerts.html` lines 35-60
- ActNowCard HTML: `docs/design/screens/screen-04-actnow.html` lines 19-49
- Current: `vigil/mobile/components/AlertItem.tsx`, `vigil/mobile/components/ActNowCard.tsx`
- Plan: `docs/plans/2026-03-07-screen-redesign.md` Tasks 9-10
