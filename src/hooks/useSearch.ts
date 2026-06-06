import { useQuery } from '@tanstack/react-query';
import { gecko } from '../api/geckoterminal';
import { normalizePools } from '../utils/normalize';
import { registrySearch } from '../utils/registry';
import type { NormalizedPool } from '../types';

export function useSearch(query: string, network?: string) {
  return useQuery<NormalizedPool[]>({
    queryKey: ['search', query, network],

    // Show registry matches instantly while the API call is in flight.
    initialData: () => registrySearch(query),
    initialDataUpdatedAt: 0,

    queryFn: async () => {
      if (!query.trim()) return [];

      // Local registry matches (synchronous, always available)
      const localResults = registrySearch(query);

      // GeckoTerminal results (may fail on rate-limit — still return local)
      let geckoResults: NormalizedPool[] = [];
      try {
        const res = await gecko.search(query.trim(), network);
        geckoResults = normalizePools(res);
      } catch {
        // Rate-limited or network error — registry results still show
      }

      // Deduplicate: GeckoTerminal results take priority over registry stubs
      // for the same network + address combination.
      const geckoKeys = new Set(
        geckoResults.map(p => `${p.network}_${p.address.toLowerCase()}`),
      );
      const registryOnly = localResults.filter(
        p => !geckoKeys.has(`${p.network}_${p.address.toLowerCase()}`),
      );

      return [...geckoResults, ...registryOnly];
    },

    enabled: query.trim().length >= 2,
    staleTime: 10_000,
  });
}
