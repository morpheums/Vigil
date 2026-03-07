# TASK-021: Rewrite SafeSend Screen

## Status: DONE
## Group: 3 (Wave 3)
## Depends On: TASK-014, TASK-016

## Description
Rewrite SafeSend tab to match screen-05 HTML mockup with chip network selector and verdict bar.

## Files
- Modify: `vigil/mobile/app/(tabs)/safesend.tsx`

## Acceptance Criteria
1. Intro section: "Risk Check" (Syne 800 18px) + "Verify any address before sending funds" (Inter 12px, #888), bordered bottom
2. Form:
   - Recipient address: Space Mono 10px input, #181818 bg, #2e2e2e border, borderRadius 8
   - Network: NetworkChips in row mode (replaces Picker dropdown)
   - Amount USD + My Address: side-by-side row
   - Check button: #181818 bg, #242424 border, Syne 800 14px (text changes to "Checked" after check)
3. Results card (when data returned):
   - Border colored by risk level, with box-shadow
   - Header: gradient bg (risk-colored), emoji + "HIGH RISK" (Syne 800 22px) + "Counterparty risk score" + score (Space Mono 700 13px)
   - Body rows: OFAC SANCTIONED, TOKEN BLACKLISTED, DRAINER LINKS, PAYMENT RISK (Space Mono 9px keys, 10px values)
   - Reasoning: Inter 11px, #888, line-height 1.5
   - Verdict bar: full-width risk-colored bg, Syne 800 12px centered (e.g. "DO NOT SEND -- Sanctioned address")
4. Remove @react-native-picker/picker import
5. Remove local COLORS object — use theme tokens

## Reference
- HTML: `docs/design/screens/screen-05-safesend.html`
- Current: `vigil/mobile/app/(tabs)/safesend.tsx`
