require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const range = require('./range');
const contagion = require('./contagion');
const alerts = require('./alerts');
const poller = require('./poller');

const app = express();
app.use(cors());
app.use(express.json());

let lastPollAt = null;

// POST /wallets
app.post('/wallets', async (req, res) => {
  try {
    const { address, network, label, expoPushToken, alertEmail } = req.body;
    if (!address || !network) return res.status(400).json({ error: 'address and network required' });

    const walletId = db.insertWallet(address, network, label, expoPushToken, alertEmail);
    const wallet = db.getWallet(walletId);

    // Initial transaction scan + contagion (async, don't block response)
    (async () => {
      try {
        const { payments } = await range.getAddressPayments(address, network, 25);
        for (const tx of payments) {
          db.insertSeenTx(wallet.id, tx.hash, tx.amount_usd, tx.direction, tx.token_symbol, tx.counterparty_address, null, null);
        }
      } catch (e) { console.error('[Init scan]', e.message); }

      try {
        await contagion.calculateContagionScore(wallet.id, address, network);
      } catch (e) { console.error('[Init contagion]', e.message); }
    })();

    res.status(201).json(wallet);
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Wallet already exists' });
    res.status(500).json({ error: e.message });
  }
});

// GET /wallets
app.get('/wallets', (req, res) => {
  try {
    const wallets = db.getWallets();
    res.json(wallets);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /wallets/:id
app.delete('/wallets/:id', (req, res) => {
  try {
    db.deleteWallet(parseInt(req.params.id));
    res.status(204).send();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /wallets/:id/contagion
app.get('/wallets/:id/contagion', (req, res) => {
  try {
    const graph = db.getContagionGraph(parseInt(req.params.id));
    if (!graph || (graph.nodes.length === 0 && graph.edges.length === 0)) {
      return res.status(404).json({ error: 'No contagion data' });
    }
    res.json(graph);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /wallets/:id/contagion/refresh
app.post('/wallets/:id/contagion/refresh', async (req, res) => {
  try {
    const wallet = db.getWallet(parseInt(req.params.id));
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
    const result = await contagion.calculateContagionScore(wallet.id, wallet.address, wallet.network);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /alerts
app.get('/alerts', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const walletId = req.query.walletId ? parseInt(req.query.walletId) : null;
    const alertList = db.getAlerts(limit, walletId);
    // Parse JSON strings back to arrays
    const parsed = alertList.map(a => ({
      ...a,
      act_now_actions: typeof a.act_now_actions === 'string' ? JSON.parse(a.act_now_actions || '[]') : (a.act_now_actions || []),
      channels: typeof a.channels === 'string' ? JSON.parse(a.channels || '[]') : (a.channels || []),
    }));
    res.json(parsed);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /alerts/:id/acknowledge
app.patch('/alerts/:id/acknowledge', (req, res) => {
  try {
    db.acknowledgeAlert(parseInt(req.params.id));
    res.json({ acknowledged: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /risk-check
app.post('/risk-check', async (req, res) => {
  try {
    const { address, network } = req.body;
    if (!address || !network) return res.status(400).json({ error: 'address and network required' });
    const [riskInfo, sanctionsInfo] = await Promise.all([
      range.getAddressRisk(address, network),
      range.checkSanctions(address, network)
    ]);
    res.json({
      riskLevel: riskInfo.risk_level,
      riskScore: riskInfo.risk_score,
      reasoning: riskInfo.reasoning,
      isSanctioned: sanctionsInfo.is_ofac_sanctioned,
      isBlacklisted: sanctionsInfo.is_token_blacklisted,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /payment-risk
app.post('/payment-risk', async (req, res) => {
  try {
    const { senderAddress, senderNetwork, recipientAddress, recipientNetwork, amountUsd } = req.body;
    if (!recipientAddress || !recipientNetwork) return res.status(400).json({ error: 'recipientAddress and recipientNetwork required' });
    const result = await range.getPaymentRisk(senderAddress, recipientAddress, amountUsd, senderNetwork, recipientNetwork);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /health
app.get('/health', (req, res) => {
  const wallets = db.getWallets();
  res.json({ status: 'ok', walletCount: wallets.length, lastPollAt });
});

// Expose lastPollAt setter for poller integration
app.setLastPollAt = (date) => { lastPollAt = date; };

// Start server
const PORT = parseInt(process.env.PORT) || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Vigil backend listening on port ${PORT}`);
    poller.startPoller();
  });
}

module.exports = app;
