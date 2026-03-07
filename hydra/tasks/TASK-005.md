# TASK-005: Alerts module with Act Now actions

- **ID**: TASK-005
- **Status**: PLANNED
- **Group**: 2
- **Wave**: 2
- **Depends on**: TASK-001, TASK-002
- **Files**: vigil/backend/alerts.js
- **Retry count**: 0/3

## Description
Implement the alerts module (alerts.js) with Expo push notifications, Resend email sending, Act Now action builder, and alert logging to SQLite.

## Acceptance Criteria
- [ ] buildActNowActions(tx, riskInfo) returns correct contextual actions based on tx.direction, riskInfo.risk_level, sanctions status, and amount — always includes safesend_check as last action
- [ ] fireAlert(wallet, tx, riskInfo, actNowActions) sends Expo push (if token present), Resend email (if email present), and logs to alert_log table with JSON-serialized act_now_actions and channels
- [ ] Alert messages follow the spec format: prefix emoji, direction, amount, token, network, counterparty risk, and "Tap for Act Now actions" for urgent alerts

## Test Requirements
- [ ] Unit test buildActNowActions with: outgoing HIGH tx (should include revoke action), incoming HIGH tx (should include isolate action), sanctioned address (should include do_not_interact), tx > $500 (should include document action)
- [ ] Unit test fireAlert with mocked push/email that verifies correct message format and DB logging
- [ ] Test that channels array correctly reflects which channels were used

## Implementation Notes
- Reference: VIGIL_SPEC.md lines 251-537 for Act Now and alerts logic
- Expo push: POST to https://exp.host/--/api/v2/push/send with { to, title, body, data }
- Resend email: use Resend SDK with process.env.RESEND_API_KEY
- Import db from db.js for alert_log insertion
- Export: buildActNowActions, fireAlert, sendExpoPush, sendResendEmail
- Act Now urgency levels: critical, high, medium
- Always add safesend_check action as last item
