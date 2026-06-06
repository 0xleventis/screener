import { TOKEN_REGISTRY } from '../data/tokenRegistry';
import type { NormalizedPool, TokenRegistryEntry } from '../types';

export function applyRegistryOverride(pool: NormalizedPool): NormalizedPool {
  // Try base token address first, then pool address as fallback.
  // This lets users use either address type as the registry key.
  const tokenKey = `${pool.network}_${pool.baseToken.address.toLowerCase()}`;
  const poolKey  = `${pool.network}_${pool.address.toLowerCase()}`;
  const entry = TOKEN_REGISTRY[tokenKey] ?? TOKEN_REGISTRY[poolKey];
  if (!entry) return pool;

  return {
    ...pool,
    registry: entry,
    baseToken: {
      ...pool.baseToken,
      name:     entry.name    ?? pool.baseToken.name,
      symbol:   entry.symbol  ?? pool.baseToken.symbol,
      imageUrl: entry.logoUrl ?? pool.baseToken.imageUrl,
    },
  };
}

// ── Local registry search ─────────────────────────────────────────────────────

function registryToPoolStub(key: string, entry: TokenRegistryEntry): NormalizedPool {
  const separatorIdx = key.indexOf('_');
  const network = key.slice(0, separatorIdx);
  const address = key.slice(separatorIdx + 1);

  return {
    id:      key,
    address,
    name:    entry.name ? `${entry.name} / —` : key,
    network,
    dexId:   '',
    dexName: '',
    baseToken: {
      id:       key,
      address,
      name:     entry.name   ?? address,
      symbol:   entry.symbol ?? '???',
      imageUrl: entry.logoUrl ?? null,
    },
    quoteToken: {
      id:       '',
      address:  '',
      name:     '',
      symbol:   '—',
      imageUrl: null,
    },
    priceUsd:    0,
    priceNative: 0,
    priceChange: { m5: 0, h1: 0, h6: 0, h24: 0 },
    volume:      { m5: 0, h1: 0, h6: 0, h24: 0 },
    transactions: { h1: null, h24: null },
    liquidityUsd: 0,
    fdvUsd:       null,
    marketCapUsd: null,
    createdAt:    null,
    momentumScore: 0,
    registry:     entry,
    registryOnly: true,
  };
}

export function registrySearch(query: string): NormalizedPool[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  return Object.entries(TOKEN_REGISTRY)
    .filter(([key, entry]) => {
      const address = key.slice(key.indexOf('_') + 1).toLowerCase();
      return (
        entry.name?.toLowerCase().includes(q)   ||
        entry.symbol?.toLowerCase().includes(q) ||
        address.startsWith(q)                   ||
        address === q
      );
    })
    .map(([key, entry]) => registryToPoolStub(key, entry));
}
