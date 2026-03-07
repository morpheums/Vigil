# VIGIL — Claude Code Context File
# This file is auto-read by Claude Code at session start.

## Project
Vigil — stablecoin wallet watchdog mobile app built on Range blockchain intelligence API.
Consumer product. "Range protects institutions. Vigil protects you."

## Stack
- Backend: Node.js + Express + SQLite (better-sqlite3)
- Mobile: Expo (React Native) + TypeScript
- Alerts: Expo Push + Resend email
- Data: Range MCP API at https://api.range.org/ai/mcp

## Non-negotiables
- ALL Range API calls go through backend/range.js — never call Range from mobile
- Design system: bg #080808, accent #3DFFA0, danger #FF3B30, warn #F5A623
- Fonts: Syne 800 (headlines), Space Mono (mono/technical), Inter (body)
- Use vigil-mockups.html as ground truth for every screen's layout and components

## Key files to read before building anything
1. VIGIL_SPEC.md — full feature spec
2. vigil-mockups.html — all 5 screen designs
3. CLAUDE_CODE_MASTER_PROMPT.md — exact API formats, algorithms, demo addresses

## Range API call format (never deviate from this)
POST https://api.range.org/ai/mcp
Authorization: Bearer RANGE_API_KEY
Body: { jsonrpc:"2.0", id:Date.now(), method:"tools/call", params:{ name:TOOL_NAME, arguments:PARAMS } }
Response: data.result.content[0].text  ← JSON string, must be JSON.parsed

## Architecture rules
- SQLite calls are synchronous (better-sqlite3) — no await
- Contagion score runs every 4th poll cycle, not every cycle
- Promise.all for parallel counterparty risk scoring in contagion engine
- node-fetch: use require('node-fetch') with "type":"module" in package.json OR use native fetch if Node 18+
- Expo push tokens only work on physical devices

## Supported network ID strings (exact)
ethereum, solana, tron, cosmoshub-4, osmosis-1, stellar

---

# Hydra Framework — Project Instructions

## Architecture
This project uses the Hydra autonomous development pipeline:

```
Objective → Discovery (+ Classification) → Doc Generator → Planner → Implementer → Review Board → Loop → Post-Loop → Complete
```

## Key Files
- `hydra/config.json` — Runtime configuration (mode, iteration, reviewers)
- `hydra/plan.md` — Live task tracker with Recovery Pointer
- `hydra/tasks/` — Individual task manifests with full state
- `hydra/checkpoints/` — Per-iteration JSON snapshots
- `hydra/reviews/` — Review artifacts per task
- `hydra/context/` — Project context from Discovery
- `hydra/docs/` — Generated project documents (PRD, TRD, ADRs)

## Commands
- `/hydra-init` — First-time setup: run Discovery, generate reviewers, create runtime dirs
- `/hydra-start` — Auto-detects project state and continues or starts work (derives objective from context)
- `/hydra-start "objective"` — Override: start a specific new objective (flags: --afk, --yolo, --hitl, --max N)
- `/hydra-status` — Check loop progress, task counts, reviewer board
- `/hydra-task` — Task lifecycle: skip, unblock, add, prioritize, info, list
- `/hydra-pause` — Gracefully pause the loop at next iteration boundary
- `/hydra-log` — View run history: iterations, commits, reviews, blockers
- `/hydra-reset` — Archive current state and reset to clean slate
- `/hydra-clean` — Fully remove Hydra from this project
- `/hydra-review` — Manually trigger review for a task
- `/hydra-discover` — Re-run codebase discovery
- `/hydra-context` — Collect targeted context for an objective type
- `/hydra-simplify` — Post-loop cleanup pass on modified files
- `/hydra-docs` — View or regenerate project documents
- `/hydra-patch` — Lightweight task mode for bug fixes, config changes, and small features
- `/hydra-verify` — Human acceptance testing for completed tasks
- `/hydra-help` — Quick reference for all commands and modes

## The 10 Rules for the Hydra Loop

1. **Always read plan.md first.** The Recovery Pointer tells you exactly where you are.
2. **Files are truth, context is ephemeral.** Write state to files immediately. Never rely on conversational memory.
3. **Follow existing patterns exactly.** Read the pattern reference before implementing. Match the style.
4. **Tests are mandatory.** Every task includes tests. Run them after every change. Don't proceed if failing.
5. **Never skip the review gate.** ALL reviewers must approve. No exceptions.
6. **Address ALL blocking feedback.** When CHANGES_REQUESTED, fix every REJECT item.
7. **One task at a time.** Don't work on multiple tasks simultaneously (unless parallel mode with Agent Teams).
8. **Update Recovery Pointer on every state change.** This is how you survive compaction.
9. **Commit in AFK mode.** Every state transition gets a commit with the hydra: prefix.
10. **HYDRA_COMPLETE means ALL tasks DONE and post-loop finished.** Not before.

## Safety
- Pre-tool guard blocks destructive commands (rm -rf /, DROP TABLE, etc.)
- Security rejections in AFK mode → BLOCKED (requires human review)
- Max retries per task: 3 (configurable in config.json)
- Max consecutive failures: 5 (auto-stops if no progress)

## Recovery
After any interruption (compaction, crash, timeout):
1. Read `hydra/plan.md` → Recovery Pointer
2. Read latest checkpoint in `hydra/checkpoints/`
3. Read active task manifest in `hydra/tasks/`
4. Resume from the Next Action
