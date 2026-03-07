# Project Profile — Vigil

## Overview
Vigil is a stablecoin wallet watchdog mobile app built on the Range blockchain intelligence API.
Consumer product: "Range protects institutions. Vigil protects you."

## Classification
- **Type**: greenfield
- **Maturity**: pre-implementation (docs/specs only, no source code yet)

## Stack
- **Backend**: Node.js + Express + SQLite (better-sqlite3)
- **Mobile**: Expo (React Native) + TypeScript
- **Alerts**: Expo Push Notifications + Resend (email)
- **Data Source**: Range MCP API at https://api.range.org/ai/mcp
- **Supported Networks**: ethereum, solana, tron, cosmoshub-4, osmosis-1, stellar

## Package Manager
- npm (backend and mobile)

## Key Dependencies
### Backend
- express ^4.18.2
- better-sqlite3 ^9.4.3
- resend ^3.2.0
- dotenv ^16.4.5
- cors ^2.8.5

### Mobile
- expo (React Native tabs template)
- expo-notifications ~0.28.0
- expo-device ~6.0.0
- react-native-svg 15.2.0
- axios ^1.6.7
- @react-native-picker/picker 2.7.5

## Design System
- Background: #080808
- Surface: #111111 / #181818
- Accent/Safe: #3DFFA0 (Range Mint)
- Warning: #F5A623
- Danger: #FF3B30
- Critical: #FF2D55
- Fonts: Syne 800 (headlines), Space Mono 700 (mono), Inter 400 (body)

## Architecture Patterns
- All Range API calls go through backend/range.js — never from mobile
- SQLite calls are synchronous (better-sqlite3) — no await
- Contagion score runs every 4th poll cycle
- Promise.all for parallel counterparty risk scoring
- useApi.ts hook centralizes all mobile-backend communication
