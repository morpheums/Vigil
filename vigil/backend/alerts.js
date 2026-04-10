const db = require('./db');

/**
 * Build contextual Act Now actions based on transaction and risk info.
 * @param {object} tx - Transaction object with direction, amount_usd, counterparty, token_symbol, network, tx_hash
 * @param {object} riskInfo - Risk info with risk_level, is_ofac_sanctioned, is_token_blacklisted
 * @returns {Array} Array of action objects
 */
function buildActNowActions(tx, riskInfo) {
  const actions = [];

  if (tx.direction === 'outgoing' && (riskInfo.risk_level === 'HIGH' || riskInfo.risk_level === 'CRITICAL')) {
    actions.push({
      id: 'revoke',
      label: 'Revoke token approvals',
      description: 'Open revoke.cash to remove any unlimited token approvals on this wallet',
      url: 'https://revoke.cash',
      urgency: 'critical',
    });
  }

  if (riskInfo.is_ofac_sanctioned || riskInfo.is_token_blacklisted) {
    actions.push({
      id: 'do_not_interact',
      label: 'Do not interact further',
      description: 'This address is OFAC sanctioned. Do not send funds back or acknowledge the transaction.',
      urgency: 'critical',
    });
  }

  if (tx.direction === 'incoming' && riskInfo.risk_level === 'HIGH') {
    actions.push({
      id: 'isolate',
      label: 'Move clean funds out',
      description: 'Transfer your remaining balance to a different wallet before interacting further.',
      urgency: 'high',
    });
  }

  if (tx.amount_usd > 500) {
    actions.push({
      id: 'document',
      label: 'Document this transaction',
      description: 'Copy the transaction hash for your records.',
      tx_hash: tx.tx_hash,
      urgency: 'medium',
    });
  }

  // Always include SafeSend prompt as last action
  const counterpartySlice = tx.counterparty ? tx.counterparty.slice(0, 8) : 'unknown';
  actions.push({
    id: 'safesend_check',
    label: 'Check counterparty in SafeSend',
    description: `Run a full risk report on ${counterpartySlice}... before any further interaction.`,
    counterparty: tx.counterparty,
    network: tx.counterparty_network || tx.network,
    urgency: 'medium',
  });

  return actions;
}

/**
 * Send an Expo push notification.
 * @param {string} expoPushToken - The Expo push token
 * @param {object} payload - { title, body, data }
 */
async function sendExpoPush(expoPushToken, { title, body, data }) {
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: expoPushToken,
      title,
      body,
      data: data || {},
    }),
  });
  return res.json();
}

/**
 * Send an alert email via Resend SDK.
 * @param {object} wallet - Wallet object with alert_email, address, network
 * @param {string} message - Alert message text
 * @param {object} tx - Transaction object
 * @param {object} riskInfo - Risk info object
 * @param {Array} actNowActions - Array of Act Now action objects
 */
async function sendResendEmail(wallet, message, tx, riskInfo, actNowActions) {
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const isUrgent = ['HIGH', 'CRITICAL'].includes(riskInfo.risk_level);
  const html = buildAlertEmail(wallet, tx, riskInfo, actNowActions);

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  return resend.emails.send({
    from: `Vigil Alerts <${fromEmail}>`,
    to: wallet.alert_email,
    subject: isUrgent ? 'Act Now - Vigil Alert' : 'Vigil Alert',
    html,
  });
}

function buildAlertEmail(wallet, tx, riskInfo, actNowActions) {
  const isUrgent   = ['HIGH', 'CRITICAL'].includes(riskInfo.risk_level);
  const isCritical = riskInfo.risk_level === 'CRITICAL';
  const riskColor  = isCritical ? '#FF2D55' : isUrgent ? '#FF3B30' : riskInfo.risk_level === 'MEDIUM' ? '#F5A623' : '#3DFFA0';
  const bgTint     = isCritical ? '#1f0510' : isUrgent ? '#1a0605' : '#0d0d0d';
  const borderTint = isCritical ? '#4a1020' : isUrgent ? '#3a1210' : '#242424';
  const emoji      = isCritical ? '\u{1F480}' : isUrgent ? '\u{1F6A8}' : '\u{26A0}\u{FE0F}';

  const directionLabel = tx.direction === 'incoming' ? '\u2193 INCOMING' : '\u2191 OUTGOING';
  const dirColor       = tx.direction === 'incoming' && !isUrgent ? '#3DFFA0' : riskColor;
  const amountSign     = tx.direction === 'incoming' ? '+' : '\u2212';
  const amountDisplay  = tx.amount_usd ? `${amountSign}$${tx.amount_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '\u2014';

  const networkLabels = {
    ethereum:      { symbol: 'ETH',  color: '#627EEA' },
    solana:        { symbol: 'SOL',  color: '#9945FF' },
    tron:          { symbol: 'TRX',  color: '#FF3B30' },
    'cosmoshub-4': { symbol: 'ATOM', color: '#6B75CA' },
    'osmosis-1':   { symbol: 'OSMO', color: '#750BBB' },
    stellar:       { symbol: 'XLM',  color: '#0099CC' },
  };
  const net = networkLabels[tx.network] || { symbol: tx.network?.toUpperCase(), color: '#888' };

  const ofacStatus     = riskInfo.is_ofac_sanctioned  ? '\u{1F6AB} YES' : '\u2713 No';
  const ofacColor      = riskInfo.is_ofac_sanctioned  ? '#FF3B30' : '#3DFFA0';
  const blacklistStatus = riskInfo.is_token_blacklisted ? '\u{1F6AB} YES' : '\u2713 No';
  const blacklistColor  = riskInfo.is_token_blacklisted ? '#FF3B30' : '#3DFFA0';

  const dateStr = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  });

  const actionUrgencyColor = (urgency) => {
    if (urgency === 'critical') return '#FF3B30';
    if (urgency === 'high')     return '#F5A623';
    return '#3DFFA0';
  };

  const actionsHtml = (actNowActions || []).slice(0, 3).map(action => `
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#161616;border:1px solid #242424;border-left:3px solid ${actionUrgencyColor(action.urgency)};border-radius:0 10px 10px 0;margin-bottom:8px;">
      <tr>
        <td style="padding:13px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:700;font-size:17px;color:#ffffff;margin-bottom:4px;">${action.label}</div>
                <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;color:#ccc;line-height:1.5;">${action.description}</div>
              </td>
              ${action.url ? `
              <td align="right" style="vertical-align:middle;padding-left:12px;white-space:nowrap;">
                <a href="${action.url}" style="font-family:'Courier New',Courier,monospace;font-size:14px;color:${actionUrgencyColor(action.urgency)};text-decoration:none;font-weight:700;">Open \u2192</a>
              </td>` : ''}
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#050505;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#050505;padding:32px 16px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">

  <!-- HEADER -->
  <tr>
    <td style="background:#000;border:1px solid #1e1e1e;border-radius:14px 14px 0 0;padding:18px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:900;font-size:20px;color:#fff;letter-spacing:-0.02em;">VIGIL</span>
          </td>
          <td align="right">
            <span style="font-family:'Courier New',Courier,monospace;font-size:13px;color:#888;letter-spacing:0.1em;">SECURITY ALERT</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- RISK BANNER -->
  <tr>
    <td style="background:linear-gradient(135deg,${bgTint} 0%,#0d0d0d 100%);border-left:1px solid ${borderTint};border-right:1px solid ${borderTint};padding:22px 28px 18px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <div style="font-family:'Courier New',Courier,monospace;font-size:11px;color:${riskColor};letter-spacing:0.2em;margin-bottom:7px;">RISK LEVEL</div>
            <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:900;font-size:32px;color:${riskColor};letter-spacing:-0.03em;line-height:1;">${emoji} ${riskInfo.risk_level} RISK</div>
            <div style="font-family:'Courier New',Courier,monospace;font-size:12px;color:#ddd;margin-top:8px;">Score: ${riskInfo.risk_score ?? '\u2014'} / 10 &nbsp;\u00B7&nbsp; ${tx.direction === 'incoming' ? 'Incoming' : 'Outgoing'} transaction</div>
          </td>
          <td align="right" style="vertical-align:top;">
            <div style="background:${riskColor}12;border:1px solid ${riskColor}35;border-radius:8px;padding:8px 14px;display:inline-block;text-align:center;">
              <div style="font-family:'Courier New',Courier,monospace;font-weight:700;font-size:22px;color:${riskColor};line-height:1;">${riskInfo.risk_score ?? '?'}</div>
              <div style="font-family:'Courier New',Courier,monospace;font-size:10px;color:${riskColor};letter-spacing:0.08em;margin-top:3px;">/ 10</div>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- TRANSACTION DETAILS -->
  <tr>
    <td style="background:#0f0f0f;border-left:1px solid #1e1e1e;border-right:1px solid #1e1e1e;padding:20px 28px;">

      <div style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#aaa;letter-spacing:0.2em;margin-bottom:14px;">TRANSACTION DETAILS</div>

      <!-- Amount -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
        style="background:#161616;border:1px solid #242424;border-radius:10px;margin-bottom:8px;">
        <tr>
          <td style="padding:16px 18px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <div style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#aaa;letter-spacing:0.14em;margin-bottom:6px;">AMOUNT</div>
                  <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:900;font-size:24px;color:#fff;letter-spacing:-0.02em;">${amountDisplay} <span style="color:#ccc;font-size:17px;font-weight:400;">${tx.token_symbol || ''}</span></div>
                </td>
                <td align="right" style="vertical-align:middle;">
                  <div style="background:${dirColor}12;border:1px solid ${dirColor}30;border-radius:6px;padding:6px 12px;">
                    <span style="font-family:'Courier New',Courier,monospace;font-weight:700;font-size:11px;color:${dirColor};letter-spacing:0.08em;">${directionLabel}</span>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Details table -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
        style="background:#161616;border:1px solid #242424;border-radius:10px;margin-bottom:20px;">
        <tr>
          <td style="padding:11px 16px;border-bottom:1px solid #1e1e1e;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#aaa;letter-spacing:0.12em;">NETWORK</td>
              <td align="right">
                <span style="background:${net.color}18;border:1px solid ${net.color}35;border-radius:4px;padding:2px 8px;font-family:'Courier New',Courier,monospace;font-weight:700;font-size:11px;color:${net.color};letter-spacing:0.08em;">${net.symbol}</span>
                <span style="font-family:'Courier New',Courier,monospace;font-size:17px;color:#eee;margin-left:6px;">${tx.network}</span>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:11px 16px;border-bottom:1px solid #1e1e1e;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#aaa;letter-spacing:0.12em;">WALLET</td>
            </tr></table>
            <div style="font-family:'Courier New',Courier,monospace;font-size:12px;color:#eee;word-break:break-all;margin-top:6px;">
              ${wallet.label ? `<span style="color:#fff;font-weight:700;">${wallet.label}</span> &mdash; ` : ''}${wallet.address}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:11px 16px;border-bottom:1px solid #1e1e1e;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#aaa;letter-spacing:0.12em;">COUNTERPARTY</td>
              <td align="right" style="font-family:'Courier New',Courier,monospace;font-size:11px;color:${riskColor};word-break:break-all;">${tx.counterparty || 'N/A'}</td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:11px 16px;border-bottom:1px solid #1e1e1e;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#aaa;letter-spacing:0.12em;">OFAC SANCTIONED</td>
              <td align="right" style="font-family:'Courier New',Courier,monospace;font-size:17px;color:${ofacColor};font-weight:700;">${ofacStatus}</td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:11px 16px;border-bottom:1px solid #1e1e1e;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#aaa;letter-spacing:0.12em;">TOKEN BLACKLIST</td>
              <td align="right" style="font-family:'Courier New',Courier,monospace;font-size:17px;color:${blacklistColor};font-weight:700;">${blacklistStatus}</td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:11px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#aaa;letter-spacing:0.12em;">TIME</td>
              <td align="right" style="font-family:'Courier New',Courier,monospace;font-size:17px;color:#ddd;">${dateStr}</td>
            </tr></table>
          </td>
        </tr>
      </table>

      <!-- Actions -->
      <div style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#aaa;letter-spacing:0.2em;margin-bottom:14px;">RECOMMENDED ACTIONS</div>
      ${actionsHtml}
    </td>
  </tr>

  <!-- TX HASH FOOTER -->
  <tr>
    <td style="background:#0a0a0a;border:1px solid #1a1a1a;border-top:1px solid #141414;border-radius:0 0 14px 14px;padding:14px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <div style="font-family:'Courier New',Courier,monospace;font-size:17px;color:#888;letter-spacing:0.1em;margin-bottom:3px;">TX HASH</div>
            <div style="font-family:'Courier New',Courier,monospace;font-size:13px;color:#ccc;">${tx.tx_hash || 'N/A'}</div>
          </td>
          <td align="right" style="vertical-align:middle;">
            <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:900;font-size:17px;color:#3DFFA0;letter-spacing:-0.01em;">VIGIL</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>


</table>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * Orchestrate alert delivery: build message, send push, send email, log to DB.
 * @param {object} wallet - Wallet object with id, expo_push_token, alert_email, address, network
 * @param {object} tx - Transaction object
 * @param {object} riskInfo - Risk info object
 * @param {Array} actNowActions - Array of Act Now action objects
 */
async function fireAlert(wallet, tx, riskInfo, actNowActions) {
  const isUrgent = ['HIGH', 'CRITICAL'].includes(riskInfo.risk_level);
  const prefix = isUrgent ? '\u{1F6A8}' : '\u{26A0}\u{FE0F}';

  const message = [
    `${prefix} ${tx.direction.toUpperCase()} ${tx.amount_usd ? '$' + tx.amount_usd.toFixed(2) : ''} ${tx.token_symbol} on ${tx.network}`,
    `Counterparty risk: ${riskInfo.risk_level}`,
    isUrgent ? 'Tap for Act Now actions \u2192' : `Tx: ${tx.tx_hash ? tx.tx_hash.slice(0, 10) : 'N/A'}...`,
  ].join('\n');

  const channels = [];

  // Expo push
  if (wallet.expo_push_token) {
    await sendExpoPush(wallet.expo_push_token, {
      title: isUrgent ? '\u{1F6A8} Act Now \u2014 Vigil Alert' : '\u{1F441} Vigil Alert',
      body: message,
      data: { alertType: isUrgent ? 'act_now' : 'info', txHash: tx.tx_hash },
    });
    channels.push('push');
  }

  // Email (Resend)
  if (wallet.alert_email) {
    await sendResendEmail(wallet, message, tx, riskInfo, actNowActions);
    channels.push('email');
  }

  // Log to DB
  db.insertAlert(
    wallet.id,
    tx.tx_hash,
    message,
    riskInfo.risk_level,
    riskInfo.risk_score ?? null,
    tx.direction,
    tx.amount_usd,
    tx.token_symbol,
    tx.counterparty,
    actNowActions,
    channels
  );

  return { message, channels };
}

module.exports = {
  buildActNowActions,
  sendExpoPush,
  sendResendEmail,
  buildAlertEmail,
  fireAlert,
};
