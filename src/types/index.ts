export interface PoolAttributes {
  address: string;
  name: string;
  base_token_price_usd: string;
  base_token_price_native_currency: string;
  quote_token_price_usd: string;
  quote_token_price_base_token: string;
  pool_created_at: string | null;
  fdv_usd: string | null;
  market_cap_usd: string | null;
  price_change_percentage: {
    m5?: string;
    h1?: string;
    h6?: string;
    h24?: string;
  };
  transactions: {
    m5?: TxBucket;
    h1?: TxBucket;
    h6?: TxBucket;
    h24?: TxBucket;
  };
  volume_usd: {
    m5?: string;
    h1?: string;
    h6?: string;
    h24?: string;
  };
  reserve_in_usd: string;
}

export interface TxBucket {
  buys: number;
  sells: number;
  buyers: number;
  sellers: number;
}

export interface PoolRelationships {
  base_token: { data: { id: string; type: 'token' } };
  quote_token: { data: { id: string; type: 'token' } };
  dex: { data: { id: string; type: 'dex' } };
  network?: { data: { id: string; type: 'network' } };
}

export interface RawPool {
  id: string;
  type: 'pool';
  attributes: PoolAttributes;
  relationships: PoolRelationships;
}

export interface TokenAttributes {
  address: string;
  name: string;
  symbol: string;
  image_url: string | null;
  coingecko_coin_id: string | null;
  decimals: number;
  total_supply: string;
  price_usd: string;
  fdv_usd: string;
  total_reserve_in_usd: string;
  volume_usd: { h24: string };
  market_cap_usd: string | null;
}

export interface RawToken {
  id: string;
  type: 'token';
  attributes: TokenAttributes;
}

export interface RawDex {
  id: string;
  type: 'dex';
  attributes: { name: string };
}

export interface RawNetwork {
  id: string;
  type: 'network';
  attributes: { name: string; coingecko_asset_platform_id: string | null };
}

export interface GeckoResponse<T> {
  data: T;
  included?: (RawToken | RawDex | RawNetwork)[];
  meta?: { total_records: number };
  links?: { first: string; prev?: string; next?: string; last: string };
}

export interface OHLCVAttributes {
  ohlcv_list: [number, number, number, number, number, number][];
}

export interface OHLCVResponse {
  data: {
    id: string;
    type: 'ohlcv_request';
    attributes: OHLCVAttributes;
  };
  meta: { base: { address: string; name: string; symbol: string }; quote: { address: string; name: string; symbol: string } };
}

export interface Trade {
  id: string;
  type: 'trade';
  attributes: {
    block_number: number;
    block_timestamp: string;
    tx_hash: string;
    tx_from_address: string;
    from_token_amount: string;
    to_token_amount: string;
    price_from_in_currency_token: string;
    price_to_in_currency_token: string;
    price_from_in_usd: string;
    price_to_in_usd: string;
    kind: 'buy' | 'sell';
    volume_in_usd: string;
  };
}

export interface TokenRegistryEntry {
  name?: string;
  symbol?: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  tags?: string[];
}

export interface NormalizedPool {
  registry?: TokenRegistryEntry;
  registryOnly?: boolean;
  id: string;
  address: string;
  name: string;
  network: string;
  dexId: string;
  dexName: string;
  baseToken: {
    id: string;
    address: string;
    name: string;
    symbol: string;
    imageUrl: string | null;
  };
  quoteToken: {
    id: string;
    address: string;
    name: string;
    symbol: string;
    imageUrl: string | null;
  };
  priceUsd: number;
  priceNative: number;
  priceChange: { m5: number; h1: number; h6: number; h24: number };
  volume: { m5: number; h1: number; h6: number; h24: number };
  transactions: { h1: TxBucket | null; h24: TxBucket | null };
  liquidityUsd: number;
  fdvUsd: number | null;
  marketCapUsd: number | null;
  createdAt: Date | null;
  momentumScore: number;
}

export interface CandleBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = 'm1' | 'm5' | 'm15' | 'm30' | 'h1' | 'h4' | 'h12' | 'h24' | 'd7';
export type ChartType = 'candle' | 'line' | 'area';
export type SortField = 'volume_h24' | 'price_change_h24' | 'price_change_h1' | 'liquidity' | 'fdv' | 'created_at' | 'momentum';
export type SortDir = 'asc' | 'desc';

export interface NetworkMeta {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  icon: string;
}
