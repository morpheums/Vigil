require('dotenv').config();
const { getAddressPayments, getAddressRisk, checkSanctions } = require('./range');
const { buildActNowActions, fireAlert } = require('./alerts');
const { calculateContagionScore } = require('./contagion');
const { getWallets, getSeenTxHashes, insertSeenTx } = require('./db');

// Round-robin poller: one wallet per tick, spread evenly across the interval.
// 5 wallets + 60s per-wallet interval = each wallet polled every 5 minutes,
// but only 1-3 API calls per tick instead of 10-15 in a burst.

let pollTimer = null;
let cycleCount = 0;
let walletIndex = 0;

async function pollNextWallet() {
  const wallets = getWallets();
  if (wallets.length === 0) return;

  // Round-robin: pick next wallet
  walletIndex = walletIndex % wallets.length;
  const wallet = wallets[walletIndex];
  const isFullRotation = walletIndex === 0;
  walletIndex++;

  // Increment cycle count at the start of each full rotation
  if (isFullRotation) cycleCount++;

  console.log(`[Poller] Tick: wallet ${wallet.id} (${wallet.label || wallet.address.slice(0, 8) + '...'}) — rotation ${cycleCount}`);

  try {
    // Get recent payments (1 API call)
    const { payments } = await getAddressPayments(wallet.address, wallet.network, 25);

    // Diff against seen transactions
    const seenHashes = new Set(getSeenTxHashes(wallet.id));
    const newTxs = payments.filter(tx => !seenHashes.has(tx.hash || tx.tx_hash));

    if (newTxs.length > 0) {
      console.log(`[Poller]   ${newTxs.length} new transaction(s)`);
    }

    for (const tx of newTxs) {
      // Risk-score counterparty (2 API calls if counterparty exists)
      let riskInfo = { risk_level: 'UNKNOWN', risk_score: 0 };
      let sanctionsInfo = { is_ofac_sanctioned: false, is_token_blacklisted: false };

      try {
        if (tx.counterparty_address) {
          [riskInfo, sanctionsInfo] = await Promise.all([
            getAddressRisk(tx.counterparty_address, tx.counterparty_network || wallet.network),
            checkSanctions(tx.counterparty_address, tx.counterparty_network || wallet.network)
          ]);
        }
      } catch (e) {
        console.error(`[Poller]   Risk check failed for ${tx.counterparty_address}:`, e.message);
      }

      const mergedRisk = { ...riskInfo, ...sanctionsInfo };

      // Store transaction
      const txHash = tx.hash || tx.tx_hash;
      if (!txHash) continue;
      insertSeenTx(
        wallet.id, txHash, tx.amount_usd, tx.direction,
        tx.token_symbol, tx.counterparty_address,
        mergedRisk.risk_level, mergedRisk.risk_score
      );

      // Build Act Now actions and fire alert
      const actNowActions = buildActNowActions(
        { ...tx, counterparty: tx.counterparty_address, network: wallet.network },
        mergedRisk
      );

      await fireAlert(wallet,
        { ...tx, counterparty: tx.counterparty_address, network: wallet.network },
        mergedRisk, actNowActions
      );
    }

    // Every 4th full rotation: recalculate contagion for this wallet
    if (cycleCount > 0 && cycleCount % 4 === 0 && isFullRotation) {
      // Only run contagion on the first wallet of the rotation to spread load
    }
    if (cycleCount > 0 && cycleCount % 4 === 0) {
      try {
        await calculateContagionScore(wallet.id, wallet.address, wallet.network);
        console.log(`[Poller]   Contagion recalculated for wallet ${wallet.id}`);
      } catch (e) {
        console.error(`[Poller]   Contagion failed for wallet ${wallet.id}:`, e.message);
      }
    }
  } catch (e) {
    console.error(`[Poller] Error polling wallet ${wallet.id}:`, e.message);
  }
}

function startPoller() {
  const totalInterval = (parseInt(process.env.POLL_INTERVAL_SECONDS) || 300) * 1000;
  const wallets = getWallets();
  // Spread wallets evenly: e.g. 5 wallets over 300s = 1 wallet every 60s
  const perWalletInterval = wallets.length > 0
    ? Math.max(totalInterval / wallets.length, 10000) // minimum 10s between ticks
    : totalInterval;

  console.log(`[Poller] Round-robin: ${wallets.length} wallets, 1 every ${perWalletInterval / 1000}s (full rotation every ${(perWalletInterval * wallets.length) / 1000}s)`);

  // First tick after a short delay (let server finish starting)
  setTimeout(() => {
    pollNextWallet();
    pollTimer = setInterval(pollNextWallet, perWalletInterval);
  }, 3000);
}

function stopPoller() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  cycleCount = 0;
  walletIndex = 0;
}

module.exports = { startPoller, stopPoller, pollNextWallet, _getCycleCount: () => cycleCount };
