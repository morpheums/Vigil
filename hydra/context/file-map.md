# File Map — Vigil

## Current Files (docs/specs only — no source code yet)
```
Range/
├── CLAUDE.md                          # Project context for Claude Code
├── docs/
│   ├── VIGIL_SPEC.md                  # Full feature spec (634 lines)
│   ├── CLAUDE_CODE_MASTER_PROMPT.md   # Build prompt with exact API formats
│   ├── DEPENDENCIES.md                # Package.json templates + quick start
│   ├── DEMO_SCRIPT.md                 # Hackathon demo script
│   ├── vigil-mockups.html             # HTML mockups for all 5 screens
│   ├── vigil-brand.jsx                # Brand system: colors, fonts, components
│   ├── ContagionGraph.tsx             # Pre-built SVG graph component
│   ├── useApi.ts                      # Pre-built API hook for mobile
│   ├── emailTemplate.html             # Email template reference
│   ├── mcp.json                       # MCP server config for Range API
│   ├── links.txt                      # Useful links (Range docs)
│   └── api-keys.txt                   # API keys (Range, Resend)
```

## Pre-built Components (in docs/, ready to copy)
- ContagionGraph.tsx — Complete SVG circle layout, 383 lines
- useApi.ts — Complete API hook with types, 273 lines
- vigil-brand.jsx — Brand system reference components

## Files to Create
- vigil/backend/ — 7 files (index.js, db.js, poller.js, range.js, contagion.js, alerts.js, package.json)
- vigil/mobile/ — Expo app with tabs, components, hooks, constants
