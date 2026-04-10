require('dotenv').config();

const BASE = 'https://api.range.org/ai/mcp';

// MCP session management — the Range API requires an initialize handshake first
let sessionId = null;
let sessionInitializing = null;

async function ensureSession() {
  if (sessionId) return;
  // Avoid multiple concurrent initializations
  if (sessionInitializing) return sessionInitializing;

  sessionInitializing = (async () => {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RANGE_API_KEY}`,
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: { name: 'vigil-backend', version: '1.0.0' },
        },
      }),
    });
    if (!res.ok) {
      throw new Error(`Range API session init failed (${res.status})`);
    }
    sessionId = res.headers.get('mcp-session-id');
    if (!sessionId) {
      throw new Error('Range API did not return a session ID');
    }
    console.log('[Range] Session initialized:', sessionId);
  })();

  try {
    await sessionInitializing;
  } finally {
    sessionInitializing = null;
  }
}

function parseSSEResponse(text) {
  // SSE format: "event: message\ndata: {json}\n\n"
  for (const line of text.split('\n')) {
    if (line.startsWith('data: ')) {
      return JSON.parse(line.slice(6));
    }
  }
  // Try parsing as plain JSON
  return JSON.parse(text);
}

async function callTool(toolName, params) {
  const t0 = Date.now();
  await ensureSession();
  const tSession = Date.now();

  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RANGE_API_KEY}`,
      'Accept': 'application/json, text/event-stream',
      'mcp-session-id': sessionId,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name: toolName, arguments: params }
    })
  });

  if (res.status === 429) {
    throw new Error('Range API rate limited — try again later');
  }
  // Session expired — reset and retry once
  if (res.status === 400 || res.status === 404) {
    const body = await res.text();
    if (body.includes('session') || body.includes('Session')) {
      console.log('[Range] Session expired, reinitializing...');
      sessionId = null;
      await ensureSession();
      return callTool(toolName, params);
    }
    throw new Error(`Range API error (${res.status}): ${body}`);
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const errBody = await res.json();
      detail = errBody.error?.message || errBody.message || JSON.stringify(errBody);
    } catch (_) {}
    throw new Error(`Range API error (${res.status}): ${detail}`);
  }

  const rawText = await res.text();
  const data = parseSSEResponse(rawText);

  if (data.error) {
    const msg = typeof data.error === 'string' ? data.error : (data.error.message || JSON.stringify(data.error));
    throw new Error(`Range API error: ${msg}`);
  }
  if (!data.result?.content?.[0]?.text) {
    throw new Error(`Range API: unexpected response shape`);
  }
  const result = JSON.parse(data.result.content[0].text);
  console.log(`[Range] ${toolName} — ${Date.now() - tSession}ms (session: ${tSession - t0}ms)`);
  return result;
}

function getAddressPayments(address, network, limit = 25) {
  return callTool('get_address_payments', { address, network, limit });
}

function getAddressRisk(address, network) {
  return callTool('get_address_risk', { address, network });
}

function getAddressConnections(address, network, size = 15) {
  return callTool('get_address_connections', { address, network, size });
}

function checkSanctions(address, network) {
  // check_sanctions only supports ethereum, tron, solana — omit network for others
  const supportedNetworks = ['ethereum', 'tron', 'solana'];
  const params = { address };
  if (supportedNetworks.includes(network)) {
    params.network = network;
  }
  return callTool('check_sanctions', params);
}

function getPaymentRisk(senderAddress, recipientAddress, amount, senderNetwork, recipientNetwork) {
  return callTool('get_payment_risk', {
    sender_address: senderAddress,
    recipient_address: recipientAddress,
    amount,
    sender_network: senderNetwork,
    recipient_network: recipientNetwork
  });
}

function getAddressFundedBy(address, network) {
  return callTool('get_address_funded_by', { address, network });
}

function getAddressFeatures(address, network) {
  return callTool('get_address_features', { address, network });
}

// Pre-warm session on startup
ensureSession().catch(() => {});

module.exports = {
  callTool,
  getAddressPayments,
  getAddressRisk,
  getAddressConnections,
  checkSanctions,
  getPaymentRisk,
  getAddressFundedBy,
  getAddressFeatures
};
