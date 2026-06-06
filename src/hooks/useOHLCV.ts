import { useQuery } from '@tanstack/react-query';
import { gecko } from '../api/geckoterminal';
import type { CandleBar, Timeframe } from '../types';

interface TimeframeConfig {
  geckoPeriod: 'minute' | 'hour' | 'day';
  aggregate: number;
  limit: number;
}

const TF_MAP: Record<Timeframe, TimeframeConfig> = {
  m1:  { geckoPeriod: 'minute', aggregate: 1,  limit: 300 },
  m5:  { geckoPeriod: 'minute', aggregate: 5,  limit: 300 },
  m15: { geckoPeriod: 'minute', aggregate: 15, limit: 300 },
  m30: { geckoPeriod: 'minute', aggregate: 30, limit: 300 },
  h1:  { geckoPeriod: 'hour',   aggregate: 1,  limit: 300 },
  h4:  { geckoPeriod: 'hour',   aggregate: 4,  limit: 300 },
  h12: { geckoPeriod: 'hour',   aggregate: 12, limit: 300 },
  h24: { geckoPeriod: 'day',    aggregate: 1,  limit: 300 },
  d7:  { geckoPeriod: 'day',    aggregate: 7,  limit: 200 },
};

export function useOHLCV(network: string, address: string, timeframe: Timeframe) {
  const { geckoPeriod, aggregate, limit } = TF_MAP[timeframe];

  return useQuery<CandleBar[]>({
    queryKey: ['ohlcv', network, address, timeframe],
    queryFn: async () => {
      const res = await gecko.ohlcv(network, address, geckoPeriod, aggregate, limit);
      return res.data.attributes.ohlcv_list.map(([time, open, high, low, close, volume]) => ({
        time, open, high, low, close, volume,
      })).sort((a, b) => a.time - b.time);
    },
    staleTime: 15_000,
    refetchInterval: 20_000,
    enabled: Boolean(network && address),
  });
}
