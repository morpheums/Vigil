#!/usr/bin/env node
// seed.js — Pre-populate the database with verified test addresses for demo
// Source: https://docs.range.org/risk-api/product-info/test-addresses
require('dotenv').config();
const db = require('./db');

const DEMO_WALLETS = [
  { address: '6AwuGoRLd54NTjAWeYZBVHnK4reK78FYpsqe6Z2PvU27', network: 'solana', label: 'Binance Deposit' },
  { address: '0x08723392ed15743cc38513c4925f5e6be5c17243', network: 'ethereum', label: 'Lazarus Group' },
  { address: 'TXJgMdjVX5dKiQaUi9QobwNxtSQaFqccvd', network: 'tron', label: 'Clean Tron Wallet' },
  { address: 'cosmos10d07y265gmmuvt4z0w9aw880jnsr700j6zn9kn', network: 'cosmoshub-4', label: 'Clean Cosmos' },
  { address: 'TBHTJqAy4DhHhmT3dNceJYNRz4SdLofLre', network: 'tron', label: 'OFAC Sanctioned' },
];

console.log('Seeding Vigil database with demo wallets...');

let added = 0;
for (const w of DEMO_WALLETS) {
  try {
    db.insertWallet(w.address, w.network, w.label, null, 'jrmejiasoft@gmail.com');
    console.log(`  + ${w.label} (${w.network})`);
    added++;
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      console.log(`  ~ ${w.label} already exists, skipping`);
    } else {
      console.error(`  ! Error adding ${w.label}:`, err.message);
    }
  }
}

console.log(`\nDone. ${added} wallets added.`);
console.log(`Total wallets: ${db.getWallets().length}`);
