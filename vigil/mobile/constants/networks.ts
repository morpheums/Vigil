const CDN = 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/128/color';

export interface Network {
  id: string;
  name: string;
  symbol: string;
  color: string;
  logoUri: string;
  emoji: string;
}

export const NETWORKS: Network[] = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#8CA2FF', logoUri: `${CDN}/eth.png`, emoji: '\u039E' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', color: '#BB77FF', logoUri: `${CDN}/sol.png`, emoji: '\u25CE' },
  { id: 'tron', name: 'Tron', symbol: 'TRX', color: '#FF6666', logoUri: `${CDN}/trx.png`, emoji: 'T' },
  { id: 'cosmoshub-4', name: 'Cosmos', symbol: 'ATOM', color: '#99A3FF', logoUri: `${CDN}/atom.png`, emoji: '\u269B' },
  { id: 'osmosis-1', name: 'Osmosis', symbol: 'OSMO', color: '#B44EFF', logoUri: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png', emoji: 'O' },
  { id: 'stellar', name: 'Stellar', symbol: 'XLM', color: '#33CCFF', logoUri: `${CDN}/xlm.png`, emoji: '\u2726' },
];

export const NETWORK_MAP = Object.fromEntries(NETWORKS.map(n => [n.id, n]));

export function getNetwork(id: string) {
  return NETWORKS.find(n => n.id === id) ?? null;
}
