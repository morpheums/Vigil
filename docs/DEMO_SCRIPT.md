# VIGIL — Demo Script
# Print this and hold it during the judge presentation.
# Each beat is ~30 seconds. Total: ~4 minutes.

─────────────────────────────────────────────────────────────────
BEAT 1 — THE HOOK  (~20s)
─────────────────────────────────────────────────────────────────
SAY:
  "Range protects institutions like Noble and Stellar Foundation
   with enterprise-grade blockchain intelligence.
   Vigil puts that exact same power in your pocket."

DO:
  → Show app open on the Wallets tab (empty or pre-loaded)

─────────────────────────────────────────────────────────────────
BEAT 2 — ADD A WALLET  (~30s)
─────────────────────────────────────────────────────────────────
SAY:
  "Let me add a real Ethereum wallet. This is a Binance hot wallet —
   hundreds of transactions a day."

DO:
  → Tap [+ Add Wallet]
  → Paste: 0x28C6c06298d514Db089934071355E5743bf21d60
  → Network: Ethereum
  → Label: "Binance Hot"
  → Tap [Watch Wallet]

SAY (while it loads):
  "While most apps just start watching for new transactions,
   Vigil immediately maps the wallet's entire neighborhood."

─────────────────────────────────────────────────────────────────
BEAT 3 — CONTAGION SCORE  (~45s)  ← THE DIFFERENTIATOR
─────────────────────────────────────────────────────────────────
SAY:
  "See this — the Contagion Score.
   Not just 'is your wallet risky' but 'who have you been
   transacting with, and are THEY risky?'"

DO:
  → Tap the wallet card
  → Show the ContagionGraph screen

SAY:
  "Every circle is a real counterparty. Green = safe.
   Red means they've been flagged by Range's intelligence network."

  → Point to any red/orange node:
  "This address is HIGH risk. You didn't send to them —
   they sent to you. But now there's a link.
   No other consumer app shows you this."

─────────────────────────────────────────────────────────────────
BEAT 4 — ACT NOW MODE  (~45s)  ← THE OTHER DIFFERENTIATOR
─────────────────────────────────────────────────────────────────
SAY:
  "Now the other thing that makes Vigil different.
   Every other app sends you a notification and leaves you hanging.
   Vigil tells you what to DO."

DO:
  → Switch to Alerts tab
  → Tap a HIGH RISK alert with the red ACT NOW banner
  → Show the ActNowCard modal

SAY:
  → Point to the action list:
  "Revoke your token approvals. Move your funds.
   We deep-link directly to the tools you need.
   Tap this — it opens revoke.cash with one tap."

─────────────────────────────────────────────────────────────────
BEAT 5 — SAFESEND  (~30s)
─────────────────────────────────────────────────────────────────
SAY:
  "Before you send funds anywhere, run a SafeSend check."

DO:
  → Switch to SafeSend tab
  → Paste: 0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b
  → Network: Ethereum
  → Tap [Check Risk]

SAY (while it loads):
  "This is the Tornado Cash router — OFAC sanctioned."

DO:
  → Show the 🛑 SANCTIONED result card

SAY:
  "Vigil catches this before you make a transaction
   that could have serious legal consequences."

─────────────────────────────────────────────────────────────────
BEAT 6 — SHOW THE EMAIL  (~15s)
─────────────────────────────────────────────────────────────────
SAY:
  "And the moment anything high-risk touches your wallet,
   you get a push notification AND an email."

DO:
  → Switch to phone's email app (have it pre-loaded/screenshot ready)
  → Show the Vigil alert email with the action items

─────────────────────────────────────────────────────────────────
BEAT 7 — CLOSE  (~20s)
─────────────────────────────────────────────────────────────────
SAY:
  "Vigil runs on the same intelligence engine that enterprises
   pay thousands of dollars a month to access.
   We made it free, mobile, and actionable.

   Range protects institutions.
   Vigil protects you — and tells you what to do about it."

─────────────────────────────────────────────────────────────────
LIKELY JUDGE QUESTIONS — PREP THESE
─────────────────────────────────────────────────────────────────

Q: "How is this different from existing wallet trackers?"
A: "Most trackers (Etherscan alerts, Nansen) just notify you.
    None of them give you a Contagion Score on your neighborhood
    or tell you what actions to take. We use Range's 21 intelligence
    tools — that's the enterprise moat."

Q: "How does the contagion score work?"
A: "We pull your 15 most recent counterparties via Range's
    get_address_connections tool, risk-score each one in parallel,
    then compute a weighted average based on transaction volume.
    Addresses you transact with more frequently weigh heavier."

Q: "What's the business model?"
A: "Freemium. Free tier: 2 wallets, 24h alert delay.
    Pro ($4.99/mo): unlimited wallets, real-time alerts,
    full contagion graphs. Range benefits from consumer
    distribution funneling into enterprise sales."

Q: "Is the Range API production-ready?"
A: "Yes — Range is already live with Noble, Stellar Foundation,
    and Squads. We're just exposing the same API to consumers."

─────────────────────────────────────────────────────────────────
DEMO ADDRESSES (keep these ready to paste)
─────────────────────────────────────────────────────────────────

WALLET TO ADD (high activity):
  0x28C6c06298d514Db089934071355E5743bf21d60  [ethereum]
  (Binance Hot Wallet — many transactions, good contagion graph)

SAFESEND DEMO (OFAC sanctioned):
  0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b  [ethereum]
  (Tornado Cash router — will show 🛑 SANCTIONED)

BACKUP HIGH-RISK:
  TZ4UXDV5ZhNW7fb2AMSbgfAEZ7hWsnYS2g         [tron]
  (Known high-risk Tron address)
