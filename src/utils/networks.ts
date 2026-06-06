import type { NetworkMeta } from '../types';

export const NETWORKS: Record<string, NetworkMeta> = {
  eth: {
    id: 'eth', name: 'Ethereum', shortName: 'ETH',
    color: '#627eea', bgColor: 'rgba(98,126,234,0.15)', icon: '⬡',
  },
  bsc: {
    id: 'bsc', name: 'BNB Chain', shortName: 'BSC',
    color: '#f0b90b', bgColor: 'rgba(240,185,11,0.15)', icon: '◆',
  },
  polygon_pos: {
    id: 'polygon_pos', name: 'Polygon', shortName: 'MATIC',
    color: '#8247e5', bgColor: 'rgba(130,71,229,0.15)', icon: '⬟',
  },
  arbitrum: {
    id: 'arbitrum', name: 'Arbitrum', shortName: 'ARB',
    color: '#28a0f0', bgColor: 'rgba(40,160,240,0.15)', icon: '▲',
  },
  optimism: {
    id: 'optimism', name: 'Optimism', shortName: 'OP',
    color: '#ff0420', bgColor: 'rgba(255,4,32,0.15)', icon: '●',
  },
  base: {
    id: 'base', name: 'Base', shortName: 'BASE',
    color: '#0052ff', bgColor: 'rgba(0,82,255,0.15)', icon: '◉',
  },
  avalanche: {
    id: 'avalanche', name: 'Avalanche', shortName: 'AVAX',
    color: '#e84142', bgColor: 'rgba(232,65,66,0.15)', icon: '▲',
  },
  solana: {
    id: 'solana', name: 'Solana', shortName: 'SOL',
    color: '#9945ff', bgColor: 'rgba(153,69,255,0.15)', icon: '◈',
  },
  fantom: {
    id: 'fantom', name: 'Fantom', shortName: 'FTM',
    color: '#13b5ec', bgColor: 'rgba(19,181,236,0.15)', icon: '◆',
  },
  cronos: {
    id: 'cronos', name: 'Cronos', shortName: 'CRO',
    color: '#002d74', bgColor: 'rgba(0,45,116,0.15)', icon: '◇',
  },
  zksync: {
    id: 'zksync', name: 'zkSync Era', shortName: 'ZKS',
    color: '#8c8dfc', bgColor: 'rgba(140,141,252,0.15)', icon: '⬡',
  },
  linea: {
    id: 'linea', name: 'Linea', shortName: 'LINEA',
    color: '#61dfff', bgColor: 'rgba(97,223,255,0.15)', icon: '◎',
  },
  scroll: {
    id: 'scroll', name: 'Scroll', shortName: 'SCR',
    color: '#ebc28e', bgColor: 'rgba(235,194,142,0.15)', icon: '◉',
  },
  blast: {
    id: 'blast', name: 'Blast', shortName: 'BLAST',
    color: '#fcfc03', bgColor: 'rgba(252,252,3,0.12)', icon: '◆',
  },
};

export const FEATURED_NETWORKS = ['eth', 'bsc', 'solana', 'base', 'arbitrum', 'polygon_pos', 'optimism'];

export function getNetwork(id: string): NetworkMeta {
  return NETWORKS[id] ?? {
    id,
    name: id.toUpperCase(),
    shortName: id.slice(0, 4).toUpperCase(),
    color: '#9090b0',
    bgColor: 'rgba(144,144,176,0.12)',
    icon: '◉',
  };
}

export function networkFromPoolId(poolId: string): string {
  const parts = poolId.split('_');
  if (parts.length >= 2) return parts.slice(0, -1).join('_');
  return 'eth';
}
