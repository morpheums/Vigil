# TASK-002: Range MCP API helper module

- **ID**: TASK-002
- **Status**: DONE
- **Claimed at**: 2026-03-07
- **Base SHA**: 8f3236b87e12b46dc1ef9600898d8dc0e9811649
- **Group**: 1
- **Wave**: 1
- **Depends on**: none
- **Files**: vigil/backend/range.js
- **Retry count**: 0/3

## Description
Create the Range MCP API helper module (range.js) that wraps all Range API calls using JSON-RPC format. This is the single point of contact for all blockchain data — mobile never calls Range directly.

## Acceptance Criteria
- [x] `range.js` exports callTool() and all 7 named helpers: getAddressPayments, getAddressRisk, getAddressConnections, checkSanctions, getPaymentRisk, getAddressFundedBy, getAddressFeatures
- [x] All calls use the exact JSON-RPC format: POST to https://api.range.org/ai/mcp with jsonrpc 2.0, method "tools/call", params containing name and arguments
- [x] Error handling: throws descriptive errors when Range API returns an error response, and parses data.result.content[0].text correctly

## Test Requirements
- [x] Unit test with mocked fetch that verifies correct JSON-RPC payload structure for each helper
- [x] Test that error responses are caught and thrown with meaningful messages
- [x] Test that response parsing handles the nested content[0].text JSON string correctly

## Implementation Notes
- Use native fetch (Node 18+), NOT node-fetch
- Authorization header: Bearer ${process.env.RANGE_API_KEY}
- Reference: VIGIL_SPEC.md lines 77-111 for exact callTool pattern
- Reference: hydra/context/patterns.md for the complete call pattern
- Each helper maps to a Range tool: get_address_payments, get_address_risk, get_address_connections, check_sanctions, get_payment_risk, get_address_funded_by, get_address_features
- getAddressConnections defaults size=15, getAddressPayments defaults limit=25

## Implementation Log
- Created `vigil/backend/range.js` with callTool() and 7 named helpers following exact patterns from patterns.md
- Created `vigil/backend/__tests__/range.test.js` with 13 tests covering all helpers, error handling, and response parsing
- All 13 tests passing (22 total including db.test.js)
- Uses native fetch (Node 18+), CommonJS module.exports
- Branch: hydra/TASK-002
