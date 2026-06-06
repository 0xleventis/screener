import axios, { AxiosError } from 'axios';
import type {
  GeckoResponse, RawPool, OHLCVResponse, Trade, RawNetwork,
} from '../types';
import { throttle } from './throttle';

const api = axios.create({
  baseURL: '/api/gecko',
  headers: { Accept: 'application/json;version=20230302' },
  timeout: 15000,
});

// Intercept 429 responses: wait for the retry-after window then re-throw so
// React Query's own retry logic can pick it back up cleanly.
api.interceptors.response.use(
  res => res,
  async (err: AxiosError) => {
    if (err.response?.status === 429) {
      const retryAfter = Number(err.response.headers['retry-after'] ?? 10);
      await new Promise(r => setTimeout(r, retryAfter * 1000));
    }
    return Promise.reject(err);
  },
);

function call<T>(fn: () => Promise<T>): Promise<T> {
  return throttle.enqueue(fn);
}

const INCLUDE = 'base_token,quote_token,dex';

export const gecko = {
  networks: (): Promise<GeckoResponse<RawNetwork[]>> =>
    call(() => api.get('/networks').then(r => r.data)),

  trendingPools: (network: string, page = 1): Promise<GeckoResponse<RawPool[]>> =>
    call(() => api.get(`/networks/${network}/trending_pools`, {
      params: { include: INCLUDE, page },
    }).then(r => r.data)),

  newPools: (network: string, page = 1): Promise<GeckoResponse<RawPool[]>> =>
    call(() => api.get(`/networks/${network}/new_pools`, {
      params: { include: INCLUDE, page },
    }).then(r => r.data)),

  topPools: (network: string, page = 1): Promise<GeckoResponse<RawPool[]>> =>
    call(() => api.get(`/networks/${network}/pools`, {
      params: { include: INCLUDE, page, sort: 'h24_volume_usd_liquidity_desc' },
    }).then(r => r.data)),

  poolDetail: (network: string, address: string): Promise<GeckoResponse<RawPool>> =>
    call(() => api.get(`/networks/${network}/pools/${address}`, {
      params: { include: INCLUDE },
    }).then(r => r.data)),

  tokenPools: (network: string, tokenAddress: string): Promise<GeckoResponse<RawPool[]>> =>
    call(() => api.get(`/networks/${network}/tokens/${tokenAddress}/pools`, {
      params: { include: INCLUDE, page: 1 },
    }).then(r => r.data)),

  ohlcv: (
    network: string,
    address: string,
    timeframe: 'minute' | 'hour' | 'day',
    aggregate: number,
    limit = 300,
    currency = 'usd',
  ): Promise<OHLCVResponse> =>
    call(() => api.get(`/networks/${network}/pools/${address}/ohlcv/${timeframe}`, {
      params: { aggregate, limit, currency, token: 'base' },
    }).then(r => r.data)),

  trades: (network: string, address: string): Promise<GeckoResponse<Trade[]>> =>
    call(() => api.get(`/networks/${network}/pools/${address}/trades`).then(r => r.data)),

  search: (query: string, network?: string, page = 1): Promise<GeckoResponse<RawPool[]>> =>
    call(() => api.get('/search/pools', {
      params: {
        query,
        ...(network && network !== 'all' ? { network } : {}),
        include: `${INCLUDE},network`,
        include_network_details: true,
        page,
      },
    }).then(r => r.data)),
};
