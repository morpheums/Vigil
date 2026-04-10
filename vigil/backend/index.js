require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const range = require('./range');
const contagion = require('./contagion');
const { fireAlert, buildActNowActions } = require('./alerts');
const poller = require('./poller');

const app = express();
app.use(cors());
app.use(express.json());

function normalizeRiskLevel(raw) {
  if (!raw) return 'UNKNOWN';
  const upper = raw.toUpperCase();
  if (upper.startsWith('VERY LOW') || upper.startsWith('VERY_LOW')) return 'VERY_LOW';
  if (upper.startsWith('CRITICAL')) return 'CRITICAL';
  if (upper.startsWith('HIGH')) return 'HIGH';
  if (upper.startsWith('MEDIUM')) return 'MEDIUM';
  if (upper.startsWith('LOW')) return 'LOW';
  return 'UNKNOWN';
}

const STABLECOINS = new Set(['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD', 'USDP', 'FRAX', 'LUSD', 'GUSD', 'PYUSD', 'USDD', 'FDUSD', 'cUSD', 'UST']);

function isStablecoin(symbol) {
  if (!symbol) return false;
  return STABLECOINS.has(symbol.toUpperCase());
}

let lastPollAt = null;

// POST /wallets
app.post('/wallets', async (req, res) => {
  try {
    const { address, network, label, expoPushToken, alertEmail } = req.body;
    if (!address || !network) return res.status(400).json({ error: 'address and network required' });

    const walletId = db.insertWallet(address, network, label, expoPushToken, alertEmail);

    // Fetch initial data from Range before responding
    try {
      const [riskInfo, paymentsData] = await Promise.all([
        range.getAddressRisk(address, network).catch(e => { console.error('[Init risk]', e.message); return null; }),
        range.getAddressPayments(address, network, 25).catch(e => { console.error('[Init scan]', e.message); return { payments: [] }; }),
      ]);

      // Store address risk
      if (riskInfo) {
        const level = normalizeRiskLevel(riskInfo.riskLevel || riskInfo.risk_level);
        const score = riskInfo.riskScore ?? riskInfo.risk_score ?? 0;
        db.getDb().prepare('UPDATE wallets SET risk_level = ?, risk_score = ? WHERE id = ?').run(level, score, walletId);
      }

      // Store transactions from connections (more reliable than payments)
      try {
        const connData = await range.getAddressConnections(address, network, 10);
        const nodes = connData.nodes || [];
        for (const node of nodes) {
          const lastTx = node.last_transaction;
          if (!lastTx) continue;
          const counterpartyAddr = node.address?.address || node.address;
          const hash = `conn_${counterpartyAddr}_${new Date(lastTx.time).getTime()}`;
          const direction = node.is_sender ? 'incoming' : 'outgoing';
          const token = lastTx.denom || null;
          if (!isStablecoin(token)) continue;
          const amount = lastTx.amount ? parseFloat(lastTx.amount) : null;
          db.insertSeenTx(walletId, hash, amount, direction, token, counterpartyAddr, null, null);
        }
      } catch (e) { console.error('[Init connections tx]', e.message); }

      // Also store from payments if available (stablecoins only)
      for (const tx of (paymentsData.payments || [])) {
        if (!isStablecoin(tx.token_symbol)) continue;
        try {
          db.insertSeenTx(walletId, tx.hash, tx.amount_usd, tx.direction, tx.token_symbol, tx.counterparty_address, null, null);
        } catch (_) { /* duplicate hash — skip */ }
      }
    } catch (e) { console.error('[Init data]', e.message); }

    try {
      await contagion.calculateContagionScore(walletId, address, network);
    } catch (e) { console.error('[Init contagion]', e.message); }

    // Return wallet with fresh data
    const wallet = db.getWallet(walletId);
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

// POST /backfill-transactions — one-time backfill for wallets missing transactions
app.post('/backfill-transactions', async (req, res) => {
  try {
    const wallets = db.getWallets();
    const results = [];
    for (const wallet of wallets) {
      const existing = db.getSeenTxHashes(wallet.id);
      if (existing.length > 0) {
        results.push({ wallet: wallet.label || wallet.address, status: 'skipped', reason: 'already has transactions' });
        continue;
      }
      try {
        let added = 0;
        // Primary: use connections data (always has last_transaction)
        try {
          const connData = await range.getAddressConnections(wallet.address, wallet.network, 10);
          for (const node of (connData.nodes || [])) {
            const lastTx = node.last_transaction;
            if (!lastTx) continue;
            const counterpartyAddr = node.address?.address || node.address;
            const hash = `conn_${counterpartyAddr}_${new Date(lastTx.time).getTime()}`;
            const direction = node.is_sender ? 'incoming' : 'outgoing';
            const token = lastTx.denom || null;
            if (!isStablecoin(token)) continue;
            const amount = lastTx.amount ? parseFloat(lastTx.amount) : null;
            try {
              db.insertSeenTx(wallet.id, hash, amount, direction, token, counterpartyAddr, null, null);
              added++;
            } catch (_) { /* duplicate */ }
          }
        } catch (e) { console.error('[Backfill connections]', e.message); }

        // Secondary: also try payments (stablecoins only)
        try {
          const paymentsData = await range.getAddressPayments(wallet.address, wallet.network, 10);
          for (const tx of (paymentsData.payments || [])) {
            if (!isStablecoin(tx.token_symbol)) continue;
            const hash = tx.hash || tx.tx_hash || `backfill_${Date.now()}_${added}`;
            try {
              db.insertSeenTx(wallet.id, hash, tx.amount_usd || null, tx.direction || 'incoming', tx.token_symbol || null, tx.counterparty_address || tx.counterparty || null, null, null);
              added++;
            } catch (_) { /* duplicate */ }
          }
        } catch (_) { /* payments may not be available */ }

        results.push({ wallet: wallet.label || wallet.address, status: 'ok', added });
      } catch (e) {
        results.push({ wallet: wallet.label || wallet.address, status: 'error', error: e.message });
      }
    }
    res.json(results);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /wallets/:id/contagion
app.get('/wallets/:id/contagion', (req, res) => {
  try {
    const walletId = parseInt(req.params.id);
    const graph = db.getContagionGraph(walletId);
    if (!graph || (graph.nodes.length === 0 && graph.edges.length === 0)) {
      return res.status(404).json({ error: 'No contagion data' });
    }
    const wallet = db.getWallet(walletId);
    const highRiskCount = graph.nodes.filter(n =>
      ['HIGH', 'CRITICAL'].includes(n.risk_level)
    ).length;
    // Map DB rows to the ContagionResult shape the mobile app expects
    res.json({
      contagionScore: wallet?.contagion_score ?? 0,
      nodeCount: graph.nodes.length,
      highRiskCount,
      nodes: graph.nodes.map(n => ({
        address: n.address,
        network: n.network,
        riskLevel: n.risk_level || 'UNKNOWN',
        riskScore: n.risk_score || 0,
        label: n.label,
        transferCount: 1,
      })),
      edges: graph.edges,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /wallets/:id/transactions
app.get('/wallets/:id/transactions', (req, res) => {
  try {
    const walletId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 5;
    const txs = db.getRecentTransactions(walletId, limit);
    res.json(txs);
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
    const rawLevel = riskInfo.riskLevel || riskInfo.risk_level || 'UNKNOWN';
    const normalizedLevel = normalizeRiskLevel(rawLevel);
    res.json({
      riskLevel: normalizedLevel,
      riskScore: riskInfo.riskScore ?? riskInfo.risk_score ?? 0,
      reasoning: riskInfo.reasoning || '',
      isSanctioned: sanctionsInfo.is_ofac_sanctioned || false,
      isBlacklisted: sanctionsInfo.is_token_blacklisted || false,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /payment-risk
app.post('/payment-risk', async (req, res) => {
  try {
    const { senderAddress, senderNetwork, recipientAddress, recipientNetwork, amountUsd } = req.body;
    if (!recipientAddress || !recipientNetwork) return res.status(400).json({ error: 'recipientAddress and recipientNetwork required' });
    if (!senderAddress || !senderNetwork) return res.status(400).json({ error: 'senderAddress and senderNetwork required' });
    // amount must be > 0 for the Range API
    const amount = amountUsd && amountUsd > 0 ? amountUsd : 1;
    const result = await range.getPaymentRisk(senderAddress, recipientAddress, amount, senderNetwork, recipientNetwork);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /debug/fire-alert — demo alerts powered by real Range API data
app.post('/debug/fire-alert', async (req, res) => {
  const {
    walletId,
    scenario = 'high', // controls direction/amount flavor
  } = req.body;

  if (!walletId) return res.status(400).json({ error: 'walletId required' });

  const wallet = db.getWallet(walletId);
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

  try {
    // 1. Get real counterparties from Range
    let nodes = [];
    try {
      const connData = await range.getAddressConnections(wallet.address, wallet.network, 10);
      nodes = connData.nodes || [];
    } catch (e) { console.error('[fire-alert] connections failed:', e.message); }

    // 2. Quick-score top 2 counterparties (risk only, no sanctions yet)
    const pool = nodes.filter(n => n.last_transaction).slice(0, 2);
    let bestCounterparty = null;
    let bestRisk = null;
    let bestScore = -1;

    if (pool.length > 0) {
      const scored = await Promise.all(pool.map(async (node) => {
        const addr = node.address?.address || node.address;
        const net = node.address?.network || wallet.network;
        const risk = await range.getAddressRisk(addr, net).catch(() => null);
        const score = risk?.riskScore ?? risk?.risk_score ?? 0;
        return { node, addr, net, risk, score };
      }));
      scored.sort((a, b) => b.score - a.score);
      bestCounterparty = scenario === 'incoming_clean' ? scored[scored.length - 1] : scored[0];
      bestRisk = bestCounterparty.risk;
      bestScore = bestCounterparty.score;
    }

    // 3. If counterparties are low risk, use the wallet's own risk
    let useWalletAsSource = false;
    if (!bestCounterparty || (scenario !== 'incoming_clean' && bestScore < 4)) {
      useWalletAsSource = true;
      const selfRisk = await range.getAddressRisk(wallet.address, wallet.network).catch(() => null);
      const selfScore = selfRisk?.riskScore ?? selfRisk?.risk_score ?? 0;
      if (selfScore > bestScore) {
        bestRisk = selfRisk;
        bestScore = selfScore;
      }
    }

    // 4. Now get sanctions only for the chosen counterparty (1 call, not 5)
    const finalAddr = bestCounterparty ? bestCounterparty.addr : wallet.address;
    const finalNet = bestCounterparty ? bestCounterparty.net : wallet.network;
    const bestSanctions = await range.checkSanctions(finalAddr, finalNet).catch(() => ({}));

    const counterparty = bestCounterparty
      ? bestCounterparty.addr
      : wallet.address;
    const counterpartyNetwork = bestCounterparty
      ? bestCounterparty.net
      : wallet.network;
    const picked = bestCounterparty?.node;
    const lastTx = picked?.last_transaction;
    const token = lastTx?.denom && isStablecoin(lastTx.denom) ? lastTx.denom : 'USDC';
    const amount = lastTx?.amount ? parseFloat(lastTx.amount) : 2500;
    const direction = scenario === 'incoming_clean' ? 'incoming' : (picked?.is_sender ? 'incoming' : 'outgoing');

    const riskLevel = normalizeRiskLevel(bestRisk?.riskLevel || bestRisk?.risk_level || 'HIGH');
    const riskScore = bestRisk?.riskScore ?? bestRisk?.risk_score ?? 7.0;
    const reasoning = bestRisk?.reasoning || `Risk assessment for address ${counterparty.slice(0, 10)}...`;

    const riskInfo = {
      risk_level: riskLevel,
      risk_score: riskScore,
      reasoning,
      is_ofac_sanctioned: bestSanctions?.is_ofac_sanctioned || false,
      is_token_blacklisted: bestSanctions?.is_token_blacklisted || false,
    };

    const tx = {
      tx_hash: '0xRANGE_' + Date.now(),
      direction,
      amount_usd: amount,
      token_symbol: token,
      counterparty,
      network: wallet.network,
      counterparty_network: counterpartyNetwork,
    };

    // 4. Build and fire alert
    const actNowActions = buildActNowActions(tx, riskInfo);

    if (isStablecoin(token)) {
      db.insertSeenTx(
        wallet.id, tx.tx_hash, tx.amount_usd, tx.direction,
        tx.token_symbol, tx.counterparty, riskInfo.risk_level, riskInfo.risk_score
      );
    }

    await fireAlert(wallet, tx, riskInfo, actNowActions);

    res.json({
      ok: true,
      scenario,
      rangeData: true,
      riskSource: useWalletAsSource ? 'wallet_self_risk' : 'counterparty_risk',
      counterparty,
      counterpartyNetwork,
      riskLevel,
      riskScore,
      isSanctioned: riskInfo.is_ofac_sanctioned,
      reasoning,
      message: `Fired alert on "${wallet.label || wallet.address}" — ${riskLevel} risk (${riskScore}/10)`,
      actNowActions,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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
