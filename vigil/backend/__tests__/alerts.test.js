// Mock fetch globally before requiring the module
global.fetch = jest.fn();

// Mock resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'mock-email-id' }),
    },
  })),
}));

// Mock db module
jest.mock('../db', () => ({
  insertAlert: jest.fn().mockReturnValue(1),
}));

const { buildActNowActions, sendExpoPush, sendResendEmail, fireAlert } = require('../alerts');
const db = require('../db');

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch.mockResolvedValue({
    json: () => Promise.resolve({ data: { status: 'ok' } }),
  });
});

describe('buildActNowActions', () => {
  test('outgoing HIGH tx includes revoke action', () => {
    const tx = { direction: 'outgoing', amount_usd: 100, counterparty: '0x1234567890abcdef', token_symbol: 'USDC', network: 'ethereum' };
    const riskInfo = { risk_level: 'HIGH', is_ofac_sanctioned: false, is_token_blacklisted: false };
    const actions = buildActNowActions(tx, riskInfo);

    const revoke = actions.find(a => a.id === 'revoke');
    expect(revoke).toBeDefined();
    expect(revoke.urgency).toBe('critical');
    expect(revoke.url).toBe('https://revoke.cash');
  });

  test('outgoing CRITICAL tx includes revoke action', () => {
    const tx = { direction: 'outgoing', amount_usd: 100, counterparty: '0x1234567890abcdef', token_symbol: 'USDC', network: 'ethereum' };
    const riskInfo = { risk_level: 'CRITICAL', is_ofac_sanctioned: false, is_token_blacklisted: false };
    const actions = buildActNowActions(tx, riskInfo);

    expect(actions.find(a => a.id === 'revoke')).toBeDefined();
  });

  test('incoming HIGH tx includes isolate action', () => {
    const tx = { direction: 'incoming', amount_usd: 100, counterparty: '0xABCDEF1234567890', token_symbol: 'USDT', network: 'ethereum' };
    const riskInfo = { risk_level: 'HIGH', is_ofac_sanctioned: false, is_token_blacklisted: false };
    const actions = buildActNowActions(tx, riskInfo);

    const isolate = actions.find(a => a.id === 'isolate');
    expect(isolate).toBeDefined();
    expect(isolate.urgency).toBe('high');
  });

  test('incoming HIGH tx does NOT include revoke action', () => {
    const tx = { direction: 'incoming', amount_usd: 100, counterparty: '0xABCDEF1234567890', token_symbol: 'USDT', network: 'ethereum' };
    const riskInfo = { risk_level: 'HIGH', is_ofac_sanctioned: false, is_token_blacklisted: false };
    const actions = buildActNowActions(tx, riskInfo);

    expect(actions.find(a => a.id === 'revoke')).toBeUndefined();
  });

  test('sanctioned address includes do_not_interact action', () => {
    const tx = { direction: 'incoming', amount_usd: 100, counterparty: '0xSANCTIONED', token_symbol: 'USDC', network: 'ethereum' };
    const riskInfo = { risk_level: 'HIGH', is_ofac_sanctioned: true, is_token_blacklisted: false };
    const actions = buildActNowActions(tx, riskInfo);

    const dni = actions.find(a => a.id === 'do_not_interact');
    expect(dni).toBeDefined();
    expect(dni.urgency).toBe('critical');
  });

  test('blacklisted token includes do_not_interact action', () => {
    const tx = { direction: 'incoming', amount_usd: 100, counterparty: '0xBLACKLIST', token_symbol: 'USDC', network: 'ethereum' };
    const riskInfo = { risk_level: 'MEDIUM', is_ofac_sanctioned: false, is_token_blacklisted: true };
    const actions = buildActNowActions(tx, riskInfo);

    expect(actions.find(a => a.id === 'do_not_interact')).toBeDefined();
  });

  test('tx > $500 includes document action', () => {
    const tx = { direction: 'incoming', amount_usd: 501, counterparty: '0xABC12345', token_symbol: 'USDC', network: 'ethereum' };
    const riskInfo = { risk_level: 'LOW', is_ofac_sanctioned: false, is_token_blacklisted: false };
    const actions = buildActNowActions(tx, riskInfo);

    const doc = actions.find(a => a.id === 'document');
    expect(doc).toBeDefined();
    expect(doc.urgency).toBe('medium');
  });

  test('tx <= $500 does NOT include document action', () => {
    const tx = { direction: 'incoming', amount_usd: 500, counterparty: '0xABC12345', token_symbol: 'USDC', network: 'ethereum' };
    const riskInfo = { risk_level: 'LOW', is_ofac_sanctioned: false, is_token_blacklisted: false };
    const actions = buildActNowActions(tx, riskInfo);

    expect(actions.find(a => a.id === 'document')).toBeUndefined();
  });

  test('always includes safesend_check as last action', () => {
    const tx = { direction: 'outgoing', amount_usd: 1000, counterparty: '0x1234567890abcdef', token_symbol: 'USDC', network: 'ethereum' };
    const riskInfo = { risk_level: 'HIGH', is_ofac_sanctioned: true, is_token_blacklisted: false };
    const actions = buildActNowActions(tx, riskInfo);

    const last = actions[actions.length - 1];
    expect(last.id).toBe('safesend_check');
    expect(last.urgency).toBe('medium');
    expect(last.counterparty).toBe('0x1234567890abcdef');
  });

  test('safesend_check description includes counterparty prefix', () => {
    const tx = { direction: 'incoming', amount_usd: 50, counterparty: '0xABCDEF1234567890', token_symbol: 'USDC', network: 'ethereum' };
    const riskInfo = { risk_level: 'LOW', is_ofac_sanctioned: false, is_token_blacklisted: false };
    const actions = buildActNowActions(tx, riskInfo);

    const safesend = actions.find(a => a.id === 'safesend_check');
    expect(safesend.description).toContain('0xABCDEF');
  });

  test('combined scenario: outgoing HIGH + sanctioned + > $500', () => {
    const tx = { direction: 'outgoing', amount_usd: 1000, counterparty: '0x1234567890abcdef', token_symbol: 'USDT', network: 'ethereum' };
    const riskInfo = { risk_level: 'HIGH', is_ofac_sanctioned: true, is_token_blacklisted: false };
    const actions = buildActNowActions(tx, riskInfo);

    const ids = actions.map(a => a.id);
    expect(ids).toContain('revoke');
    expect(ids).toContain('do_not_interact');
    expect(ids).toContain('document');
    expect(ids).toContain('safesend_check');
    expect(ids[ids.length - 1]).toBe('safesend_check');
  });
});

describe('sendExpoPush', () => {
  test('sends POST to Expo push API', async () => {
    await sendExpoPush('ExponentPushToken[xxxx]', {
      title: 'Test Title',
      body: 'Test Body',
      data: { txHash: '0xTX1' },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://exp.host/--/api/v2/push/send',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(callBody.to).toBe('ExponentPushToken[xxxx]');
    expect(callBody.title).toBe('Test Title');
    expect(callBody.body).toBe('Test Body');
    expect(callBody.data.txHash).toBe('0xTX1');
  });
});

describe('sendResendEmail', () => {
  test('sends email via Resend SDK', async () => {
    const wallet = { address: '0xWALLET', network: 'ethereum', alert_email: 'user@example.com' };
    const tx = { tx_hash: '0xTXHASH', direction: 'outgoing', amount_usd: 1000, token_symbol: 'USDC', network: 'ethereum', counterparty: '0xCOUNTERPARTY' };
    const riskInfo = { risk_level: 'HIGH' };
    const actions = [{ id: 'revoke', label: 'Revoke', description: 'Revoke approvals', url: 'https://revoke.cash', urgency: 'critical' }];

    await sendResendEmail(wallet, 'Test message', tx, riskInfo, actions);

    const { Resend } = require('resend');
    const instance = Resend.mock.results[0].value;
    expect(instance.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: expect.stringContaining('Act Now'),
      })
    );
  });
});

describe('fireAlert', () => {
  test('sends push and email for wallet with both channels, logs to DB', async () => {
    const wallet = { id: 1, expo_push_token: 'ExponentPushToken[test]', alert_email: 'test@example.com', address: '0xWALLET', network: 'ethereum' };
    const tx = { tx_hash: '0xTX123', direction: 'outgoing', amount_usd: 2500, token_symbol: 'USDC', network: 'ethereum', counterparty: '0xCOUNTERPARTY' };
    const riskInfo = { risk_level: 'HIGH', is_ofac_sanctioned: false, is_token_blacklisted: false };
    const actions = buildActNowActions(tx, riskInfo);

    const result = await fireAlert(wallet, tx, riskInfo, actions);

    // Push was called
    expect(global.fetch).toHaveBeenCalledWith(
      'https://exp.host/--/api/v2/push/send',
      expect.anything()
    );

    // DB was logged
    expect(db.insertAlert).toHaveBeenCalledWith(
      1, '0xTX123', expect.any(String), 'HIGH', expect.any(Array), ['push', 'email']
    );

    // Channels returned correctly
    expect(result.channels).toEqual(['push', 'email']);
  });

  test('only push channel when no email', async () => {
    const wallet = { id: 2, expo_push_token: 'ExponentPushToken[test2]', alert_email: null, address: '0xWALLET2', network: 'solana' };
    const tx = { tx_hash: '0xTX456', direction: 'incoming', amount_usd: 100, token_symbol: 'USDT', network: 'solana', counterparty: '0xC2' };
    const riskInfo = { risk_level: 'LOW', is_ofac_sanctioned: false, is_token_blacklisted: false };

    const result = await fireAlert(wallet, tx, riskInfo, []);

    expect(db.insertAlert).toHaveBeenCalledWith(
      2, '0xTX456', expect.any(String), 'LOW', expect.any(Array), ['push']
    );
    expect(result.channels).toEqual(['push']);
  });

  test('only email channel when no push token', async () => {
    const wallet = { id: 3, expo_push_token: null, alert_email: 'user@test.com', address: '0xWALLET3', network: 'ethereum' };
    const tx = { tx_hash: '0xTX789', direction: 'outgoing', amount_usd: 50, token_symbol: 'USDC', network: 'ethereum', counterparty: '0xC3' };
    const riskInfo = { risk_level: 'MEDIUM', is_ofac_sanctioned: false, is_token_blacklisted: false };

    const result = await fireAlert(wallet, tx, riskInfo, []);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(db.insertAlert).toHaveBeenCalledWith(
      3, '0xTX789', expect.any(String), 'MEDIUM', expect.any(Array), ['email']
    );
    expect(result.channels).toEqual(['email']);
  });

  test('no channels when neither push nor email', async () => {
    const wallet = { id: 4, expo_push_token: null, alert_email: null, address: '0xWALLET4', network: 'ethereum' };
    const tx = { tx_hash: '0xTXNOCH', direction: 'incoming', amount_usd: 10, token_symbol: 'USDC', network: 'ethereum', counterparty: '0xC4' };
    const riskInfo = { risk_level: 'LOW', is_ofac_sanctioned: false, is_token_blacklisted: false };

    const result = await fireAlert(wallet, tx, riskInfo, []);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(db.insertAlert).toHaveBeenCalledWith(
      4, '0xTXNOCH', expect.any(String), 'LOW', expect.any(Array), []
    );
    expect(result.channels).toEqual([]);
  });

  test('urgent message format includes emoji prefix and Act Now text', async () => {
    const wallet = { id: 5, expo_push_token: null, alert_email: null, address: '0xW5', network: 'ethereum' };
    const tx = { tx_hash: '0xTXURG', direction: 'outgoing', amount_usd: 2500, token_symbol: 'USDC', network: 'ethereum', counterparty: '0xC5' };
    const riskInfo = { risk_level: 'HIGH', is_ofac_sanctioned: false, is_token_blacklisted: false };

    const result = await fireAlert(wallet, tx, riskInfo, []);

    expect(result.message).toContain('OUTGOING');
    expect(result.message).toContain('$2500.00');
    expect(result.message).toContain('USDC');
    expect(result.message).toContain('ethereum');
    expect(result.message).toContain('Counterparty risk: HIGH');
    expect(result.message).toContain('Tap for Act Now actions');
  });

  test('non-urgent message format includes tx hash', async () => {
    const wallet = { id: 6, expo_push_token: null, alert_email: null, address: '0xW6', network: 'ethereum' };
    const tx = { tx_hash: '0xABCDEF1234567890', direction: 'incoming', amount_usd: 50, token_symbol: 'USDT', network: 'solana', counterparty: '0xC6' };
    const riskInfo = { risk_level: 'LOW', is_ofac_sanctioned: false, is_token_blacklisted: false };

    const result = await fireAlert(wallet, tx, riskInfo, []);

    expect(result.message).toContain('INCOMING');
    expect(result.message).toContain('$50.00');
    expect(result.message).toContain('USDT');
    expect(result.message).toContain('solana');
    expect(result.message).toContain('Counterparty risk: LOW');
    expect(result.message).toContain('Tx: 0xABCDEF12...');
    expect(result.message).not.toContain('Act Now');
  });
});
