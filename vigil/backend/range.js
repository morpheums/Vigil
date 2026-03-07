require('dotenv').config();

const BASE = 'https://api.range.org/ai/mcp';

async function callTool(toolName, params) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RANGE_API_KEY}`
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
  if (!res.ok) {
    throw new Error(`Range API HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  if (data.error) {
    const msg = typeof data.error === 'string' ? data.error : (data.error.message || JSON.stringify(data.error));
    throw new Error(`Range API error: ${msg}`);
  }
  if (!data.result?.content?.[0]?.text) {
    throw new Error(`Range API: unexpected response shape`);
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
  getAddressPayments,
  getAddressRisk,
  getAddressConnections,
  checkSanctions,
  getPaymentRisk,
  getAddressFundedBy,
  getAddressFeatures
};
