# TASK-020: Rewrite Alerts Screen

## Status: DONE
## Group: 3 (Wave 3)
## Depends On: TASK-018

## Description
Rewrite the Alerts tab to match screen-03 HTML mockup with date grouping and updated header.

## Files
- Modify: `vigil/mobile/app/(tabs)/alerts.tsx`

## Acceptance Criteria
1. Header: "Alerts" (Syne 800 18px) + red "N new" badge (danger bg, white text, Space Mono 700 9px, borderRadius 20)
2. Date grouping: SectionList with "TODAY" / "YESTERDAY" / "EARLIER" section headers (Space Mono 9px, #444, letter-spacing 0.18em)
3. Use rewritten AlertItem (ACT NOW banners for HIGH/CRITICAL, compact rows for LOW/MEDIUM)
4. ActNowCard triggers as bottom sheet (not full-screen modal)
5. Remove custom header View — use Expo Router's built-in header via _layout.tsx

## Date Grouping Logic
```typescript
function getDateGroup(sentAt: string): string {
  const date = new Date(sentAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  if (date >= today) return 'TODAY';
  if (date >= yesterday) return 'YESTERDAY';
  return 'EARLIER';
}
```

## Reference
- HTML: `docs/design/screens/screen-03-alerts.html`
- Current: `vigil/mobile/app/(tabs)/alerts.tsx`
