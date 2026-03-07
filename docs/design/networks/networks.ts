// mobile/constants/networks.ts
// Real logos from cryptocurrency-icons CDN (MIT licensed) + Cosmos chain registry

const CDN = 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color';
const CHAIN_REG = 'https://raw.githubusercontent.com/cosmos/chain-registry/master';

export const NETWORKS = [
  {
    id: 'ethereum',
    label: 'Ethereum',
    symbol: 'ETH',
    color: '#627EEA',
    logoUri: `${CDN}/eth.svg`,
    // Fallback emoji if logo fails to load
    emoji: 'Ξ',
  },
  {
    id: 'solana',
    label: 'Solana',
    symbol: 'SOL',
    color: '#9945FF',
    logoUri: `${CDN}/sol.svg`,
    emoji: '◎',
  },
  {
    id: 'tron',
    label: 'Tron',
    symbol: 'TRX',
    color: '#FF3B30',
    logoUri: `${CDN}/trx.svg`,
    emoji: 'T',
  },
  {
    id: 'cosmoshub-4',
    label: 'Cosmos',
    symbol: 'ATOM',
    color: '#6B75CA',
    logoUri: `${CDN}/atom.svg`,
    emoji: '⚛',
  },
  {
    id: 'osmosis-1',
    label: 'Osmosis',
    symbol: 'OSMO',
    color: '#750BBB',
    // OSMO not in cryptocurrency-icons — use official Cosmos chain registry
    logoUri: `${CHAIN_REG}/osmosis/images/osmo.svg`,
    emoji: 'O',
  },
  {
    id: 'stellar',
    label: 'Stellar',
    symbol: 'XLM',
    color: '#0099CC',
    logoUri: `${CDN}/xlm.svg`,
    emoji: '✦',
  },
] as const;

export type NetworkId = typeof NETWORKS[number]['id'];

export function getNetwork(id: string) {
  return NETWORKS.find(n => n.id === id) ?? null;
}
