const range = require('../range');

// Mock global fetch
beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  delete global.fetch;
});

function mockFetchSuccess(resultData) {
  global.fetch.mockResolvedValue({
    json: () => Promise.resolve({
      jsonrpc: '2.0',
      id: 1,
      result: {
        content: [{ text: JSON.stringify(resultData) }]
      }
    })
  });
}

function mockFetchError(message) {
  global.fetch.mockResolvedValue({
    json: () => Promise.resolve({
      jsonrpc: '2.0',
      id: 1,
      error: { code: -32000, message }
    })
  });
}

describe('callTool', () => {
  it('sends correct JSON-RPC payload', async () => {
    mockFetchSuccess({ ok: true });

    await range.callTool('test_tool', { key: 'value' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.range.org/ai/mcp',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': expect.stringMatching(/^Bearer /)
        },
        body: expect.any(String)
      })
    );

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.jsonrpc).toBe('2.0');
    expect(body.id).toEqual(expect.any(Number));
    expect(body.method).toBe('tools/call');
    expect(body.params).toEqual({ name: 'test_tool', arguments: { key: 'value' } });
  });

  it('throws on Range API error response', async () => {
    mockFetchError('Invalid address');

    await expect(range.callTool('test_tool', {}))
      .rejects
      .toThrow('Range API error: Invalid address');
  });

  it('parses nested content[0].text JSON string', async () => {
    const expected = { risk_level: 'HIGH', score: 85 };
    mockFetchSuccess(expected);

    const result = await range.callTool('get_address_risk', { address: '0x123', network: 'ethereum' });
    expect(result).toEqual(expected);
  });
});

describe('getAddressPayments', () => {
  it('calls callTool with correct tool name and params', async () => {
    mockFetchSuccess({ payments: [] });

    await range.getAddressPayments('0xABC', 'ethereum');

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.params.name).toBe('get_address_payments');
    expect(body.params.arguments).toEqual({ address: '0xABC', network: 'ethereum', limit: 25 });
  });

  it('uses custom limit when provided', async () => {
    mockFetchSuccess({ payments: [] });

    await range.getAddressPayments('0xABC', 'ethereum', 50);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.params.arguments.limit).toBe(50);
  });
});

describe('getAddressRisk', () => {
  it('calls callTool with correct tool name and params', async () => {
    mockFetchSuccess({ risk_level: 'LOW' });

    await range.getAddressRisk('0xDEF', 'solana');

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.params.name).toBe('get_address_risk');
    expect(body.params.arguments).toEqual({ address: '0xDEF', network: 'solana' });
  });
});

describe('getAddressConnections', () => {
  it('calls callTool with correct tool name and default size', async () => {
    mockFetchSuccess({ connections: [] });

    await range.getAddressConnections('0x111', 'ethereum');

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.params.name).toBe('get_address_connections');
    expect(body.params.arguments).toEqual({ address: '0x111', network: 'ethereum', size: 15 });
  });

  it('uses custom size when provided', async () => {
    mockFetchSuccess({ connections: [] });

    await range.getAddressConnections('0x111', 'ethereum', 30);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.params.arguments.size).toBe(30);
  });
});

describe('checkSanctions', () => {
  it('calls callTool with correct tool name and params', async () => {
    mockFetchSuccess({ sanctioned: false });

    await range.checkSanctions('0x222', 'tron');

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.params.name).toBe('check_sanctions');
    expect(body.params.arguments).toEqual({ address: '0x222', network: 'tron' });
  });
});

describe('getPaymentRisk', () => {
  it('calls callTool with correct tool name and mapped params', async () => {
    mockFetchSuccess({ risk: 'LOW' });

    await range.getPaymentRisk('0xSENDER', '0xRECIPIENT', '100.00', 'ethereum', 'solana');

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.params.name).toBe('get_payment_risk');
    expect(body.params.arguments).toEqual({
      sender_address: '0xSENDER',
      recipient_address: '0xRECIPIENT',
      amount: '100.00',
      sender_network: 'ethereum',
      recipient_network: 'solana'
    });
  });
});

describe('getAddressFundedBy', () => {
  it('calls callTool with correct tool name and params', async () => {
    mockFetchSuccess({ funded_by: [] });

    await range.getAddressFundedBy('0x333', 'stellar');

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.params.name).toBe('get_address_funded_by');
    expect(body.params.arguments).toEqual({ address: '0x333', network: 'stellar' });
  });
});

describe('getAddressFeatures', () => {
  it('calls callTool with correct tool name and params', async () => {
    mockFetchSuccess({ features: {} });

    await range.getAddressFeatures('0x444', 'cosmoshub-4');

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.params.name).toBe('get_address_features');
    expect(body.params.arguments).toEqual({ address: '0x444', network: 'cosmoshub-4' });
  });
});
