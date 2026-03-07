import { useState } from "react";

const ACCENT = "#3DFFA0";
const ACCENT_DIM = "rgba(61,255,160,0.12)";
const ACCENT_GLOW = "rgba(61,255,160,0.35)";
const BG = "#080808";
const SURFACE = "#111111";
const SURFACE2 = "#181818";
const BORDER = "#242424";
const TEXT = "#FFFFFF";
const TEXT2 = "#888888";
const TEXT3 = "#3A3A3A";
const WARN = "#F5A623";
const DANGER = "#FF3B30";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes pulse-ring {
    0% { transform: scale(1); opacity: 0.8; }
    100% { transform: scale(2.6); opacity: 0; }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-up-1 { animation: fade-up 0.5s 0.05s ease both; }
  .fade-up-2 { animation: fade-up 0.5s 0.15s ease both; }
  .fade-up-3 { animation: fade-up 0.5s 0.25s ease both; }
`;

function LogoMark({ size = 32, invert = false }) {
  const bg = invert ? "#000" : ACCENT;
  const fg = invert ? ACCENT : "#080808";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill={bg} />
      <path d="M16 6L8 9.5V17C8 21.4 11.4 25.5 16 27C20.6 25.5 24 21.4 24 17V9.5L16 6Z" fill={fg} />
      <circle cx="16" cy="17" r="3" fill={bg} />
      <circle cx="16" cy="17" r="1.4" fill={fg} />
    </svg>
  );
}

function Wordmark({ size = "lg", invert = false }) {
  const fs = size === "lg" ? 26 : size === "md" ? 18 : 13;
  const subFs = size === "lg" ? 9 : 7;
  const iconSz = size === "lg" ? 34 : size === "md" ? 26 : 18;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <LogoMark size={iconSz} invert={invert} />
      <div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: fs, color: invert ? "#000" : TEXT, letterSpacing: "-0.02em", lineHeight: 1 }}>VIGIL</div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: subFs, color: invert ? "#00000088" : ACCENT, letterSpacing: "0.15em", marginTop: 2 }}>BY RANGE</div>
      </div>
    </div>
  );
}

function PulseDot({ color = ACCENT, size = 8 }) {
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, opacity: 0.4, animation: "pulse-ring 2s ease-out infinite" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, animation: "blink 2s ease-in-out infinite" }} />
    </div>
  );
}

function RiskBadge({ level }) {
  const map = {
    VERY_LOW: { color: ACCENT, label: "VERY LOW" }, LOW: { color: ACCENT, label: "LOW" },
    MEDIUM: { color: WARN, label: "MEDIUM" }, HIGH: { color: DANGER, label: "HIGH" },
    CRITICAL: { color: "#FF2D55", label: "CRITICAL" }, UNKNOWN: { color: TEXT2, label: "UNKNOWN" },
  };
  const { color, label } = map[level] || map.UNKNOWN;
  return <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}40`, borderRadius: 4, padding: "2px 7px", letterSpacing: "0.1em" }}>{label}</span>;
}

function NetworkBadge({ network }) {
  const nets = { ethereum: { label: "ETH", color: "#627EEA" }, solana: { label: "SOL", color: "#9945FF" }, tron: { label: "TRX", color: "#FF4040" }, cosmos: { label: "ATOM", color: "#6B75CA" }, stellar: { label: "XLM", color: "#0099CC" } };
  const { label, color } = nets[network] || { label: network.toUpperCase(), color: TEXT2 };
  return <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}35`, borderRadius: 4, padding: "2px 7px", letterSpacing: "0.08em" }}>{label}</span>;
}

function Card({ children, style, span2 }) {
  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, gridColumn: span2 ? "span 2" : undefined, ...style }}>
      {children}
    </div>
  );
}

function SectionLabel({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: ACCENT, letterSpacing: "0.2em" }}>{label}</div>
      <div style={{ flex: 1, height: 1, background: BORDER }} />
    </div>
  );
}

function Swatch({ color, name, hex, glow }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: color, border: color === BG || color === "#000" ? `1px solid ${BORDER}` : "none", boxShadow: glow ? `0 0 18px ${ACCENT_GLOW}` : "none" }} />
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: TEXT2, textAlign: "center", lineHeight: 1.5 }}>{name}<br /><span style={{ color: TEXT3 }}>{hex}</span></div>
    </div>
  );
}

function WalletCard({ label, address, network, risk, balance, lastActivity, isActive }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ background: hov ? SURFACE2 : "transparent", border: `1px solid ${hov ? "#333" : BORDER}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all 0.2s", position: "relative", overflow: "hidden" }}>
      {isActive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            {isActive && <PulseDot size={7} />}
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: TEXT }}>{label}</span>
          </div>
          <div style={{ display: "flex", gap: 5 }}><NetworkBadge network={network} /><RiskBadge level={risk} /></div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, color: TEXT }}>${balance}</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: TEXT2, marginTop: 2 }}>{lastActivity}</div>
        </div>
      </div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: TEXT3, marginTop: 9 }}>{address}</div>
    </div>
  );
}

function AlertItem({ direction, amount, token, network, risk, time, isNew }) {
  const riskColor = risk === "HIGH" || risk === "CRITICAL" ? DANGER : risk === "MEDIUM" ? WARN : ACCENT;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: `${riskColor}15`, border: `1px solid ${riskColor}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
        {direction === "incoming" ? "↓" : "↑"}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: TEXT }}>{direction === "incoming" ? "Received" : "Sent"} {amount} {token}</span>
          {isNew && <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: ACCENT, background: ACCENT_DIM, border: `1px solid ${ACCENT}40`, borderRadius: 3, padding: "1px 5px", letterSpacing: "0.1em" }}>NEW</span>}
        </div>
        <div style={{ display: "flex", gap: 5, marginTop: 4 }}><NetworkBadge network={network} /><RiskBadge level={risk} /></div>
      </div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: TEXT2, flexShrink: 0 }}>{time}</div>
    </div>
  );
}

function SafeSendDemo() {
  const [checked, setChecked] = useState(false);
  return (
    <div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: TEXT2, letterSpacing: "0.1em", marginBottom: 7 }}>RECIPIENT ADDRESS</div>
      <div style={{ background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "9px 12px", marginBottom: 10, fontFamily: "'Space Mono', monospace", fontSize: 10, color: TEXT3, wordBreak: "break-all" }}>0x7f268357A8c2552623316e2562D90e642bB538E5</div>
      <button onClick={() => setChecked(true)} style={{ width: "100%", padding: "10px", background: checked ? ACCENT_DIM : ACCENT, border: `1px solid ${checked ? ACCENT + "60" : ACCENT}`, borderRadius: 8, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: checked ? ACCENT : "#000", transition: "all 0.2s" }}>
        {checked ? "✓ Check complete" : "Check Risk →"}
      </button>
      {checked && (
        <div style={{ marginTop: 10, background: `${DANGER}10`, border: `1px solid ${DANGER}35`, borderRadius: 10, padding: 14, animation: "fade-up 0.3s ease both" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, color: DANGER }}>🚨 HIGH RISK</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: TEXT2 }}>8.2 / 10</span>
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: TEXT2, lineHeight: 1.6, marginBottom: 10 }}>
            Linked to known drainer contracts.<br />
            OFAC: <span style={{ color: DANGER }}>SANCTIONED</span> · Token blacklist: <span style={{ color: DANGER }}>YES</span>
          </div>
          <div style={{ padding: "7px 12px", background: `${DANGER}18`, borderRadius: 6, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 11, color: DANGER, textAlign: "center" }}>
            🛑 DO NOT SEND — Sanctioned address
          </div>
        </div>
      )}
    </div>
  );
}

export default function VigilBrand() {
  const [tab, setTab] = useState("brand");

  return (
    <div style={{ background: BG, minHeight: "100vh", color: TEXT, fontFamily: "'Inter', sans-serif" }}>
      <style>{css}</style>

      {/* Range parent bar */}
      <div style={{ background: "#000", borderBottom: `1px solid ${BORDER}`, padding: "7px 28px", display: "flex", alignItems: "center", gap: 10 }}>
        <svg width="13" height="13" viewBox="0 0 30 30" fill="none"><path d="M15 0L0 7.5V22.5L15 30L30 22.5V7.5L15 0Z" fill={ACCENT} opacity="0.9" /></svg>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: TEXT2, letterSpacing: "0.15em" }}>POWERED BY <span style={{ color: ACCENT }}>RANGE</span> INTELLIGENCE · ENTERPRISE-GRADE BLOCKCHAIN SECURITY FOR EVERYONE</span>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "44px 32px 36px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center", borderBottom: `1px solid ${BORDER}` }}>
        <div className="fade-up-1">
          <div style={{ marginBottom: 18 }}><Wordmark size="lg" /></div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 38, color: TEXT, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: 14 }}>
            Your stablecoins,<br /><span style={{ color: ACCENT }}>always watching.</span>
          </h1>
          <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.75, maxWidth: 380, marginBottom: 22 }}>
            Range protects institutions with enterprise-grade blockchain intelligence. Vigil puts that same power in your pocket — real-time alerts the moment anything touches your wallets, across every chain.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: ACCENT, borderRadius: 8, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: "#000", cursor: "pointer" }}>Download app →</div>
            <div style={{ padding: "10px 18px", border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13, color: TEXT2, cursor: "pointer" }}>View demo</div>
          </div>
        </div>

        {/* Mock phone */}
        <div className="fade-up-2" style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: 230, background: "#0C0C0C", border: `1px solid #2C2C2C`, borderRadius: 34, padding: "18px 14px 22px", boxShadow: `0 0 80px rgba(0,0,0,0.9), 0 0 0 1px #2A2A2A inset, 0 0 40px ${ACCENT}08` }}>
            <div style={{ width: 54, height: 5, background: "#1A1A1A", borderRadius: 10, margin: "0 auto 14px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Wordmark size="sm" />
              <PulseDot size={7} />
            </div>
            {[{ label: "Main Wallet", net: "ethereum", risk: "LOW", bal: "12,400" }, { label: "DeFi Fund", net: "solana", risk: "MEDIUM", bal: "3,820" }].map((w, i) => (
              <div key={i} style={{ background: "#181818", border: `1px solid #242424`, borderRadius: 10, padding: "10px 11px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 11, color: TEXT, marginBottom: 4 }}>{w.label}</div>
                    <div style={{ display: "flex", gap: 4 }}><NetworkBadge network={w.net} /><RiskBadge level={w.risk} /></div>
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: TEXT }}>${w.bal}</div>
                </div>
              </div>
            ))}
            <div style={{ background: `${DANGER}12`, border: `1px solid ${DANGER}35`, borderRadius: 10, padding: "10px 11px" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 14 }}>🚨</span>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 11, color: TEXT }}>High risk tx detected</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: TEXT2, marginTop: 2 }}>Outgoing · 2,500 USDC · ETH</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px", borderBottom: `1px solid ${BORDER}`, display: "flex" }}>
        {["brand", "components", "positioning"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: tab === t ? ACCENT : TEXT2, background: "none", border: "none", borderBottom: `2px solid ${tab === t ? ACCENT : "transparent"}`, padding: "14px 20px", cursor: "pointer", textTransform: "uppercase", transition: "all 0.15s" }}>{t}</button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 32px 80px" }}>

        {tab === "brand" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            <Card className="fade-up-1">
              <SectionLabel label="App Name & Concept" />
              <div style={{ marginBottom: 18 }}><Wordmark size="md" /></div>
              <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.75, marginBottom: 16 }}>
                <strong style={{ color: TEXT }}>VIGIL</strong> — from Latin <em>vigilia</em>: the act of staying watchful and alert. A consumer product built entirely on Range's enterprise backbone. The <span style={{ color: ACCENT, fontFamily: "'Space Mono', monospace", fontSize: 11 }}>BY RANGE</span> lock-up signals institutional credibility without enterprise complexity.
              </p>
              <div style={{ height: 1, background: BORDER, margin: "16px 0" }} />
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: TEXT2, letterSpacing: "0.12em", marginBottom: 10 }}>TAGLINE OPTIONS</div>
              {["★  Your stablecoins, always watching.", "   Enterprise security. Personal scale.", "   Know the instant anything moves.", "   The Vigil your wallets deserve."].map((t, i) => (
                <div key={i} style={{ fontFamily: i === 0 ? "'Syne', sans-serif" : "'Inter', sans-serif", fontWeight: i === 0 ? 700 : 400, fontSize: i === 0 ? 14 : 13, color: i === 0 ? TEXT : TEXT2, padding: "8px 0", borderBottom: i < 3 ? `1px solid ${BORDER}` : "none" }}>{t}</div>
              ))}
            </Card>

            <Card>
              <SectionLabel label="Color System" />
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: TEXT2, letterSpacing: "0.1em", marginBottom: 12 }}>INHERITED FROM RANGE</div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
                <Swatch color="#000000" name="Pure Black" hex="#000000" />
                <Swatch color={BG}      name="App BG"    hex="#080808" />
                <Swatch color={SURFACE} name="Surface"   hex="#111111" />
                <Swatch color={TEXT}    name="Text"      hex="#FFFFFF" />
                <Swatch color={ACCENT}  name="Range Mint★" hex="#3DFFA0" glow />
              </div>
              <div style={{ height: 1, background: BORDER, margin: "0 0 16px" }} />
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: TEXT2, letterSpacing: "0.1em", marginBottom: 12 }}>SEMANTIC ALERT STATES</div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <Swatch color={ACCENT}  name="Safe / Low" hex="#3DFFA0" />
                <Swatch color={WARN}    name="Medium"     hex="#F5A623" />
                <Swatch color={DANGER}  name="High"       hex="#FF3B30" />
                <Swatch color="#FF2D55" name="Critical"   hex="#FF2D55" />
                <Swatch color={TEXT2}   name="Unknown"    hex="#888888" />
              </div>
            </Card>

            <Card>
              <SectionLabel label="Typography" />
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 30, color: TEXT, letterSpacing: "-0.03em", lineHeight: 1 }}>Syne 800</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: TEXT2, marginTop: 6 }}>Headlines, wallet labels, alert titles — bold, decisive, premium</div>
                </div>
                <div style={{ height: 1, background: BORDER }} />
                <div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 14, color: TEXT }}>Space Mono 700</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: TEXT2, marginTop: 6 }}>Addresses, hashes, amounts, badges — technical, precise, monospace</div>
                </div>
                <div style={{ height: 1, background: BORDER }} />
                <div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 14, color: TEXT2, lineHeight: 1.7 }}>Inter 400 — Body copy, descriptions, secondary text. Clean, readable, invisible.</div>
                </div>
              </div>
            </Card>

            <Card>
              <SectionLabel label="Logo Variants" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { bg: "#000", content: <Wordmark size="md" />, label: "Primary — dark bg" },
                  { bg: "#000", content: <LogoMark size={46} />, label: "Icon only" },
                  { bg: ACCENT, content: <Wordmark size="md" invert />, label: "On accent" },
                  { bg: SURFACE2, content: (
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: TEXT2, textAlign: "center", lineHeight: 1.8 }}>
                      App Icon 1024×1024<br /><span style={{ color: ACCENT }}>Mint shield on black</span>
                    </div>
                  ), label: "App store" },
                ].map((v, i) => (
                  <div key={i}>
                    <div style={{ background: v.bg, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 70 }}>{v.content}</div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: TEXT3, marginTop: 6, letterSpacing: "0.05em" }}>{v.label}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === "components" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Card>
              <SectionLabel label="Wallet Cards" />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <WalletCard label="Main Wallet" address="0x742d35Cc6634C0532...8e5" network="ethereum" risk="LOW" balance="12,400.00" lastActivity="2 min ago" isActive />
                <WalletCard label="DeFi Fund" address="7xKp9R...mNq2jW" network="solana" risk="MEDIUM" balance="3,820.50" lastActivity="18 min ago" />
                <WalletCard label="Cold Storage" address="T9yLmK3Vbx...rPq7" network="tron" risk="VERY_LOW" balance="48,200.00" lastActivity="3 days ago" />
              </div>
            </Card>

            <Card>
              <SectionLabel label="Alert Feed" />
              <AlertItem direction="incoming" amount="2,500" token="USDC" network="ethereum" risk="HIGH" time="2m ago" isNew />
              <AlertItem direction="outgoing" amount="500" token="USDT" network="tron" risk="LOW" time="14m ago" />
              <AlertItem direction="incoming" amount="18,000" token="USDC" network="solana" risk="MEDIUM" time="1h ago" />
              <AlertItem direction="outgoing" amount="100" token="USDT" network="ethereum" risk="CRITICAL" time="2h ago" />
            </Card>

            <Card>
              <SectionLabel label="Risk & Network Badges" />
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: TEXT2, letterSpacing: "0.1em", marginBottom: 8 }}>RISK LEVELS</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                {["VERY_LOW", "LOW", "MEDIUM", "HIGH", "CRITICAL", "UNKNOWN"].map(l => <RiskBadge key={l} level={l} />)}
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: TEXT2, letterSpacing: "0.1em", marginBottom: 8 }}>NETWORKS</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["ethereum", "solana", "tron", "cosmos", "stellar"].map(n => <NetworkBadge key={n} network={n} />)}
              </div>
            </Card>

            <Card>
              <SectionLabel label="SafeSend Risk Check" />
              <SafeSendDemo />
            </Card>
          </div>
        )}

        {tab === "positioning" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Card span2>
              <SectionLabel label="Brand Architecture" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 20, alignItems: "center" }}>
                <div style={{ background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 22 }}>
                  <div style={{ fontSize: 24, marginBottom: 10 }}>🏦</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: TEXT2, marginBottom: 4 }}>RANGE</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: TEXT3, letterSpacing: "0.1em", marginBottom: 14 }}>THE INFRASTRUCTURE LAYER</div>
                  <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.75 }}>Powers exchanges, protocols, and financial institutions. Enterprise APIs, "Book a demo" sales motion. Trusted by Noble, Squads, Stellar Foundation. <strong style={{ color: TEXT }}>Enterprises only.</strong></div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 1, height: 30, background: BORDER }} />
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: ACCENT }}>→</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: TEXT3, letterSpacing: "0.1em", textAlign: "center" }}>BUILDS ON</div>
                  <div style={{ width: 1, height: 30, background: BORDER }} />
                </div>
                <div style={{ background: `${ACCENT}08`, border: `1px solid ${ACCENT}30`, borderRadius: 14, padding: 22 }}>
                  <div style={{ fontSize: 24, marginBottom: 10 }}>🛡️</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: ACCENT, marginBottom: 4 }}>VIGIL</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: ACCENT, letterSpacing: "0.1em", opacity: 0.7, marginBottom: 14 }}>THE CONSUMER LAYER</div>
                  <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.75 }}>Puts that same intelligence in every user's pocket. Real-time wallet monitoring, instant push/email alerts, SafeSend risk check. <strong style={{ color: TEXT }}>Zero blockchain expertise required.</strong></div>
                </div>
              </div>
            </Card>

            <Card>
              <SectionLabel label="Target Users" />
              {[
                { emoji: "💼", title: "The Active DeFi User", desc: "Manages 3–10 wallets across chains. Fears waking up to a drained account." },
                { emoji: "📈", title: "The Stablecoin Earner", desc: "Parks USDC/USDT in yield. Needs to react fast if funds move unexpectedly." },
                { emoji: "👤", title: "The Non-Technical Holder", desc: "Has crypto but doesn't follow on-chain activity. Needs plain-English alerts instantly." },
              ].map((u, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i < 2 ? `1px solid ${BORDER}` : "none" }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{u.emoji}</span>
                  <div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: TEXT, marginBottom: 4 }}>{u.title}</div>
                    <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.6 }}>{u.desc}</div>
                  </div>
                </div>
              ))}
            </Card>

            <Card>
              <SectionLabel label="Hackathon Pitch" />
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: TEXT, lineHeight: 1.3, marginBottom: 20, letterSpacing: "-0.02em" }}>
                "Range protects institutions.<br />
                <span style={{ color: ACCENT }}>Vigil protects you."</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { stat: "100+", label: "chains Range monitors" },
                  { stat: "21",   label: "intelligence tools via MCP" },
                  { stat: "<60s", label: "alert latency" },
                  { stat: "$0",   label: "to get started" },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 14px", background: SURFACE2, borderRadius: 8, border: `1px solid ${BORDER}` }}>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 15, color: ACCENT }}>{s.stat}</span>
                    <span style={{ fontSize: 12, color: TEXT2 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
