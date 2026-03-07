# TASK-009: AlertItem, ActNowCard components + Alerts tab

- **ID**: TASK-009
- **Status**: DONE
- **Group**: 4
- **Wave**: 4
- **Depends on**: TASK-003, TASK-007
- **Files**: vigil/mobile/components/AlertItem.tsx, vigil/mobile/components/ActNowCard.tsx, vigil/mobile/app/(tabs)/alerts.tsx
- **Retry count**: 0/3

## Description
Build the Alerts tab with alert history feed, AlertItem component (normal vs Act Now variants), and ActNowCard full-screen modal with tappable action list.

## Acceptance Criteria
- [ ] AlertItem renders normal alerts (LOW/MEDIUM) with risk dot, direction, amount, token, network, timestamp; and HIGH/CRITICAL alerts with red/orange "ACT NOW" banner, first 2 actions shown, and "See all actions" link
- [ ] ActNowCard modal displays large risk indicator, transaction summary, numbered action list (tappable: URLs open browser, SafeSend action available), and "Mark as Handled" button
- [ ] Alerts tab shows FlatList sorted by sent_at DESC, pull-to-refresh, optional walletId filter, and unread count in header

## Test Requirements
- [ ] AlertItem renders correct variant (normal vs Act Now) based on risk_level
- [ ] ActNowCard renders all actions from act_now_actions array with correct labels and descriptions
- [ ] "Mark as Handled" triggers API call and updates local state

## Implementation Notes
- Reference: VIGIL_SPEC.md lines 427-455 for Alerts tab spec
- Reference: VIGIL_SPEC.md lines 446-454 for ActNowCard spec
- Use useApi() hook: api.getAlerts(limit, walletId)
- AlertItem: two visual modes — standard (expandable) and Act Now (banner + actions)
- ActNowCard: Modal component, actions with URLs use Linking.openURL()
- SafeSend action should set params for deep-linking to SafeSend tab (will be wired in TASK-012)
- Design: danger #FF3B30 for critical, warning #F5A623 for high, accent #3DFFA0 for safe
- "Mark as Handled" calls the backend (acknowledge alert) — for now, local state toggle is sufficient if endpoint not yet available
