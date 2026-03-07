require('dotenv').config();

const BASE = 'https://api.range.org/ai/mcp';

// MCP session management — Range API requires SSE-based MCP handshake
let sessionId = null;
let initPromise = null;

async function initSession() {
  if (sessionId) return sessionId;
  if (initPromise) return initPromise;
  initPromise = _doInit();
  const result = await initPromise;
  initPromise = null;
  return result;
}

async function _doInit() {

  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${process.env.RANGE_API_KEY}`
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'vigil', version: '1.0.0' }
      }
    })
  });

  const sid = res.headers.get('mcp-session-id');
  if (sid) {
    sessionId = sid;
    console.log(`[Range] MCP session initialized: ${sid.slice(0, 8)}...`);
  }
  return sessionId;
}

function parseSSE(text) {
  // SSE format: "event: message\ndata: {...}\n\n"
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      return JSON.parse(line.slice(6));
    }
  }
  // Fallback: try parsing the whole thing as JSON
  return JSON.parse(text);
}

async function callTool(toolName, params) {
  await initSession();

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    'Authorization': `Bearer ${process.env.RANGE_API_KEY}`
  };
  if (sessionId) {
    headers['mcp-session-id'] = sessionId;
  }

  const res = await fetch(BASE, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name: toolName, arguments: params }
    })
  });

  const text = await res.text();
  const data = parseSSE(text);

  // Session might have expired — retry once
  if (data.error && data.error.message && data.error.message.includes('session')) {
    sessionId = null;
    await initSession();
    headers['mcp-session-id'] = sessionId;
    const retry = await fetch(BASE, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: { name: toolName, arguments: params }
      })
    });
    const retryText = await retry.text();
    const retryData = parseSSE(retryText);
    if (retryData.error) throw new Error(`Range API error: ${retryData.error.message}`);
    return JSON.parse(retryData.result.content[0].text);
  }

  if (data.error) throw new Error(`Range API error: ${data.error.message || JSON.stringify(data.error)}`);
  if (!data.result || !data.result.content || !data.result.content[0]) {
    throw new Error(`Range API: unexpected response shape: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return JSON.parse(data.result.content[0].text);
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
  return callTool('check_sanctions', { address, network });
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

module.exports = {
  callTool,
  initSession,
  getAddressPayments,
  getAddressRisk,
  getAddressConnections,
  checkSanctions,
  getPaymentRisk,
  getAddressFundedBy,
  getAddressFeatures
};
