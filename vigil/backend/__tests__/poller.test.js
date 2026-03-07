jest.mock('../range', () => ({
  getAddressPayments: jest.fn(),
  getAddressRisk: jest.fn(),
  checkSanctions: jest.fn(),
}));

jest.mock('../alerts', () => ({
  buildActNowActions: jest.fn(),
  fireAlert: jest.fn(),
}));

jest.mock('../contagion', () => ({
  calculateContagionScore: jest.fn(),
}));

jest.mock('../db', () => ({
  getWallets: jest.fn(),
  getSeenTxHashes: jest.fn(),
  insertSeenTx: jest.fn(),
}));

const { getAddressPayments, getAddressRisk, checkSanctions } = require('../range');
const { buildActNowActions, fireAlert } = require('../alerts');
const { calculateContagionScore } = require('../contagion');
const { getWallets, getSeenTxHashes, insertSeenTx } = require('../db');

let poller;

beforeEach(() => {
  jest.clearAllMocks();
  // Re-require to reset module-level state (cycleCount, pollInterval)
  jest.resetModules();

  // Re-apply mocks after resetModules
  jest.mock('../range', () => ({
    getAddressPayments: jest.fn(),
    getAddressRisk: jest.fn(),
    checkSanctions: jest.fn(),
  }));
  jest.mock('../alerts', () => ({
    buildActNowActions: jest.fn(),
    fireAlert: jest.fn(),
  }));
  jest.mock('../contagion', () => ({
    calculateContagionScore: jest.fn(),
  }));
  jest.mock('../db', () => ({
    getWallets: jest.fn(),
    getSeenTxHashes: jest.fn(),
    insertSeenTx: jest.fn(),
  }));

  poller = require('../poller');
});

const WALLET_A = { id: 1, address: '0xAAA', network: 'ethereum', label: 'Wallet A' };
const WALLET_B = { id: 2, address: '0xBBB', network: 'solana', label: 'Wallet B' };

const TX1 = { hash: '0xTX1', amount_usd: 100, direction: 'incoming', token_symbol: 'USDC', counterparty_address: '0xSENDER1' };
const TX2 = { hash: '0xTX2', amount_usd: 200, direction: 'outgoing', token_symbol: 'USDT', counterparty_address: '0xRECEIVER1' };
const TX3 = { hash: '0xTX3', amount_usd: 5000, direction: 'incoming', token_symbol: 'USDC', counterparty_address: '0xSENDER2' };

describe('pollWallets diff logic', () => {
  test('processes only new transactions (skips already-seen hashes)', async () => {
    const { getWallets, getSeenTxHashes, insertSeenTx } = require('../db');
    const { getAddressPayments, getAddressRisk, checkSanctions } = require('../range');
    const { buildActNowActions, fireAlert } = require('../alerts');

    getWallets.mockReturnValue([WALLET_A]);
    getAddressPayments.mockResolvedValue({ payments: [TX1, TX2, TX3] });
    // TX1 is already seen
    getSeenTxHashes.mockReturnValue(['0xTX1']);
    getAddressRisk.mockResolvedValue({ risk_level: 'LOW', risk_score: 0.1 });
    checkSanctions.mockResolvedValue({ is_ofac_sanctioned: false, is_token_blacklisted: false });
    buildActNowActions.mockReturnValue([]);
    fireAlert.mockResolvedValue(undefined);

    await poller.pollWallets();

    // Only TX2 and TX3 should be processed (TX1 is seen)
    expect(insertSeenTx).toHaveBeenCalledTimes(2);
    expect(insertSeenTx).toHaveBeenCalledWith(
      1, '0xTX2', 200, 'outgoing', 'USDT', '0xRECEIVER1', 'LOW', 0.1
    );
    expect(insertSeenTx).toHaveBeenCalledWith(
      1, '0xTX3', 5000, 'incoming', 'USDC', '0xSENDER2', 'LOW', 0.1
    );
    expect(fireAlert).toHaveBeenCalledTimes(2);
  });

  test('skips risk check when counterparty_address is missing', async () => {
    const { getWallets, getSeenTxHashes } = require('../db');
    const { getAddressPayments, getAddressRisk, checkSanctions } = require('../range');
    const { buildActNowActions, fireAlert } = require('../alerts');

    const txNoCounterparty = { hash: '0xTXNO', amount_usd: 50, direction: 'incoming', token_symbol: 'USDC', counterparty_address: null };
    getWallets.mockReturnValue([WALLET_A]);
    getAddressPayments.mockResolvedValue({ payments: [txNoCounterparty] });
    getSeenTxHashes.mockReturnValue([]);
    buildActNowActions.mockReturnValue([]);
    fireAlert.mockResolvedValue(undefined);

    await poller.pollWallets();

    expect(getAddressRisk).not.toHaveBeenCalled();
    expect(checkSanctions).not.toHaveBeenCalled();
  });
});

describe('cycle counter and contagion', () => {
  test('contagion runs on cycle 4 but not cycles 1-3', async () => {
    const { getWallets, getSeenTxHashes } = require('../db');
    const { getAddressPayments, getAddressRisk, checkSanctions } = require('../range');
    const { calculateContagionScore } = require('../contagion');
    const { buildActNowActions, fireAlert } = require('../alerts');

    getWallets.mockReturnValue([WALLET_A]);
    getAddressPayments.mockResolvedValue({ payments: [] });
    getSeenTxHashes.mockReturnValue([]);
    calculateContagionScore.mockResolvedValue(undefined);
    buildActNowActions.mockReturnValue([]);
    fireAlert.mockResolvedValue(undefined);

    // Cycles 1-3: no contagion
    await poller.pollWallets();
    await poller.pollWallets();
    await poller.pollWallets();
    expect(calculateContagionScore).not.toHaveBeenCalled();
    expect(poller._getCycleCount()).toBe(3);

    // Cycle 4: contagion runs
    await poller.pollWallets();
    expect(calculateContagionScore).toHaveBeenCalledTimes(1);
    expect(calculateContagionScore).toHaveBeenCalledWith(1, '0xAAA', 'ethereum');
    expect(poller._getCycleCount()).toBe(4);
  });

  test('contagion runs again on cycle 8', async () => {
    const { getWallets, getSeenTxHashes } = require('../db');
    const { getAddressPayments } = require('../range');
    const { calculateContagionScore } = require('../contagion');

    getWallets.mockReturnValue([WALLET_A]);
    getAddressPayments.mockResolvedValue({ payments: [] });
    getSeenTxHashes.mockReturnValue([]);
    calculateContagionScore.mockResolvedValue(undefined);

    // Run 8 cycles
    for (let i = 0; i < 8; i++) {
      await poller.pollWallets();
    }
    expect(calculateContagionScore).toHaveBeenCalledTimes(2);
  });
});

describe('per-wallet error handling', () => {
  test('error in one wallet does not prevent processing the next', async () => {
    const { getWallets, getSeenTxHashes, insertSeenTx } = require('../db');
    const { getAddressPayments, getAddressRisk, checkSanctions } = require('../range');
    const { buildActNowActions, fireAlert } = require('../alerts');

    getWallets.mockReturnValue([WALLET_A, WALLET_B]);

    // Wallet A throws on getAddressPayments
    getAddressPayments
      .mockRejectedValueOnce(new Error('Network timeout'))
      .mockResolvedValueOnce({ payments: [TX2] });

    getSeenTxHashes.mockReturnValue([]);
    getAddressRisk.mockResolvedValue({ risk_level: 'MEDIUM', risk_score: 0.5 });
    checkSanctions.mockResolvedValue({ is_ofac_sanctioned: false, is_token_blacklisted: false });
    buildActNowActions.mockReturnValue([]);
    fireAlert.mockResolvedValue(undefined);

    await poller.pollWallets();

    // Wallet B should still be processed
    expect(insertSeenTx).toHaveBeenCalledTimes(1);
    expect(insertSeenTx).toHaveBeenCalledWith(
      2, '0xTX2', 200, 'outgoing', 'USDT', '0xRECEIVER1', 'MEDIUM', 0.5
    );
  });

  test('risk check failure does not stop transaction processing', async () => {
    const { getWallets, getSeenTxHashes, insertSeenTx } = require('../db');
    const { getAddressPayments, getAddressRisk, checkSanctions } = require('../range');
    const { buildActNowActions, fireAlert } = require('../alerts');

    getWallets.mockReturnValue([WALLET_A]);
    getAddressPayments.mockResolvedValue({ payments: [TX1] });
    getSeenTxHashes.mockReturnValue([]);

    // Risk check throws
    getAddressRisk.mockRejectedValue(new Error('API down'));
    checkSanctions.mockRejectedValue(new Error('API down'));
    buildActNowActions.mockReturnValue([]);
    fireAlert.mockResolvedValue(undefined);

    await poller.pollWallets();

    // Transaction should still be inserted with default risk values
    expect(insertSeenTx).toHaveBeenCalledTimes(1);
    expect(insertSeenTx).toHaveBeenCalledWith(
      1, '0xTX1', 100, 'incoming', 'USDC', '0xSENDER1', 'UNKNOWN', 0
    );
  });
});

describe('startPoller / stopPoller lifecycle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    poller.stopPoller();
    jest.useRealTimers();
  });

  test('startPoller runs first poll immediately and sets interval', () => {
    const { getWallets } = require('../db');
    const { getAddressPayments } = require('../range');

    getWallets.mockReturnValue([]);
    getAddressPayments.mockResolvedValue({ payments: [] });

    poller.startPoller();

    // First poll runs immediately (cycle 1)
    expect(getWallets).toHaveBeenCalledTimes(1);
    expect(poller._getCycleCount()).toBe(1);
  });

  test('startPoller uses POLL_INTERVAL_SECONDS env var', () => {
    const { getWallets } = require('../db');
    const { getAddressPayments } = require('../range');

    getWallets.mockReturnValue([]);
    getAddressPayments.mockResolvedValue({ payments: [] });

    process.env.POLL_INTERVAL_SECONDS = '30';
    poller.startPoller();

    // Advance by 30s — should trigger second poll
    jest.advanceTimersByTime(30000);
    expect(getWallets).toHaveBeenCalledTimes(2);

    delete process.env.POLL_INTERVAL_SECONDS;
  });

  test('stopPoller clears interval and resets cycle count', () => {
    const { getWallets } = require('../db');
    const { getAddressPayments } = require('../range');

    getWallets.mockReturnValue([]);
    getAddressPayments.mockResolvedValue({ payments: [] });

    poller.startPoller();
    expect(poller._getCycleCount()).toBe(1);

    poller.stopPoller();
    expect(poller._getCycleCount()).toBe(0);

    // Advance time — should NOT trigger another poll
    jest.advanceTimersByTime(120000);
    expect(getWallets).toHaveBeenCalledTimes(1);
  });
});
