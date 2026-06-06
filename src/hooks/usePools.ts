import { useQuery, useQueryClient } from '@tanstack/react-query';
import { gecko } from '../api/geckoterminal';
import { normalizePools } from '../utils/normalize';
import type { NormalizedPool } from '../types';

// Stagger refetches so sibling queries don't all fire at the same second.
function staggeredInterval(base: number, jitterMs = 8000) {
  return {
    staleTime: base,
    refetchInterval: (query: { state: { error: unknown } }) =>
      query.state.error ? base * 2 : base + Math.random() * jitterMs,
  };
}

export function useTopPools(network: string, page = 1) {
  return useQuery<NormalizedPool[]>({
    queryKey: ['pools', 'top', network, page],
    queryFn: async () => {
      const res = await gecko.topPools(network, page);
      return normalizePools(res, network);
    },
    ...staggeredInterval(35_000),
    placeholderData: (prev) => prev,
    retry: 3,
    retryDelay: (attempt) => Math.min(4000 * 2 ** attempt, 30_000),
  });
}

export function useTrendingPools(network: string) {
  return useQuery<NormalizedPool[]>({
    queryKey: ['pools', 'trending', network],
    queryFn: async () => {
      const res = await gecko.trendingPools(network);
      return normalizePools(res, network);
    },
    ...staggeredInterval(45_000),
    placeholderData: (prev) => prev,
    retry: 3,
    retryDelay: (attempt) => Math.min(4000 * 2 ** attempt, 30_000),
  });
}

export function useNewPools(network: string) {
  return useQuery<NormalizedPool[]>({
    queryKey: ['pools', 'new', network],
    queryFn: async () => {
      const res = await gecko.newPools(network);
      return normalizePools(res, network);
    },
    ...staggeredInterval(25_000),
    placeholderData: (prev) => prev,
    retry: 3,
    retryDelay: (attempt) => Math.min(4000 * 2 ** attempt, 30_000),
  });
}

export function usePoolDetail(network: string, address: string) {
  const queryClient = useQueryClient();

  return useQuery<NormalizedPool>({
    queryKey: ['pool', network, address],
    queryFn: async () => {
      try {
        const res = await gecko.poolDetail(network, address);
        const [pool] = normalizePools({ data: [res.data], included: res.included }, network);
        return pool;
      } catch (err) {
        // If the address is a token contract (not a pool address), GeckoTerminal
        // returns 404 on the pools endpoint. Fall back to fetching pools by token.
        const status = (err as { response?: { status: number } })?.response?.status;
        if (status === 404) {
          const res = await gecko.tokenPools(network, address);
          if (res.data.length > 0) {
            const pools = normalizePools(res, network);
            // Return the pool with the most liquidity
            return pools.sort((a, b) => b.liquidityUsd - a.liquidityUsd)[0];
          }
        }
        throw err;
      }
    },
    // Pre-seed immediately from any pool-list cache so the page is never blank.
    // TanStack Query will still refetch in the background to get fresh data.
    initialData: () => {
      const candidates: NormalizedPool[] = [];
      queryClient
        .getQueriesData<NormalizedPool[]>({ queryKey: ['pools'] })
        .forEach(([, data]) => { if (data) candidates.push(...data); });
      return candidates.find(
        p => p.address.toLowerCase() === address.toLowerCase() && p.network === network,
      );
    },
    // Mark the initial data as immediately stale so a background refresh fires.
    initialDataUpdatedAt: 0,
    ...staggeredInterval(15_000),
    enabled: Boolean(network && address),
    retry: 3,
    retryDelay: (attempt) => Math.min(3000 * 2 ** attempt, 20_000),
  });
}
