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
      description: 'Screenshot the transaction hash and counterparty now for any future compliance needs.',
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
  const actionsHtml = (actNowActions || []).map((a, i) =>
    `<li style="margin-bottom:8px;"><strong>${a.label}</strong><br/>${a.description}${a.url ? ` <a href="${a.url}">Open</a>` : ''}</li>`
  ).join('');

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#080808;color:#ffffff;padding:24px;border-radius:12px;">
      <h1 style="color:${isUrgent ? '#FF3B30' : '#3DFFA0'};font-size:20px;">
        ${isUrgent ? 'Act Now - Vigil Alert' : 'Vigil Alert'}
      </h1>
      <p style="font-size:16px;line-height:1.5;white-space:pre-line;">${message}</p>
      ${actNowActions && actNowActions.length > 0 ? `
        <h2 style="color:#F5A623;font-size:16px;margin-top:16px;">Recommended Actions</h2>
        <ol style="padding-left:20px;line-height:1.8;">${actionsHtml}</ol>
      ` : ''}
      <hr style="border-color:#242424;margin:16px 0;"/>
      <p style="font-size:12px;color:#888;">
        Wallet: ${wallet.address} (${wallet.network || 'unknown'})<br/>
        Tx: ${tx.tx_hash || 'N/A'}
      </p>
      <p style="font-size:11px;color:#555;">Sent by Vigil - Stablecoin Watchdog</p>
    </div>
  `;

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  return resend.emails.send({
    from: `Vigil Alerts <${fromEmail}>`,
    to: wallet.alert_email,
    subject: isUrgent ? 'Act Now - Vigil Alert' : 'Vigil Alert',
    html,
  });
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
    actNowActions,
    channels
  );

  return { message, channels };
}

module.exports = {
  buildActNowActions,
  sendExpoPush,
  sendResendEmail,
  fireAlert,
};
