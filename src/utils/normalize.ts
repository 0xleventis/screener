import type { RawPool, RawToken, RawDex, NormalizedPool, GeckoResponse } from '../types';
import { parseBigNumber, calcMomentumScore } from './format';
import { networkFromPoolId } from './networks';
import { applyRegistryOverride } from './registry';

function buildTokenMap(included: GeckoResponse<RawPool[]>['included']): Map<string, RawToken> {
  const map = new Map<string, RawToken>();
  included?.forEach(item => {
    if (item.type === 'token') map.set(item.id, item as RawToken);
  });
  return map;
}

function buildDexMap(included: GeckoResponse<RawPool[]>['included']): Map<string, RawDex> {
  const map = new Map<string, RawDex>();
  included?.forEach(item => {
    if (item.type === 'dex') map.set(item.id, item as RawDex);
  });
  return map;
}

export function normalizePool(raw: RawPool, included: GeckoResponse<RawPool[]>['included'], forcedNetwork?: string): NormalizedPool {
  const tokenMap = buildTokenMap(included);
  const dexMap   = buildDexMap(included);

  const network = forcedNetwork ?? networkFromPoolId(raw.id);
  const a = raw.attributes;

  const baseTokenId  = raw.relationships.base_token.data.id;
  const quoteTokenId = raw.relationships.quote_token.data.id;
  const dexId        = raw.relationships.dex.data.id;

  const rawBase  = tokenMap.get(baseTokenId);
  const rawQuote = tokenMap.get(quoteTokenId);
  const rawDex   = dexMap.get(dexId);

  const baseNameFallback  = a.name.split(' / ')[0] ?? 'BASE';
  const quoteNameFallback = a.name.split(' / ')[1] ?? 'QUOTE';

  const priceH1   = parseBigNumber(a.price_change_percentage.h1);
  const priceH24  = parseBigNumber(a.price_change_percentage.h24);
  const volH24    = parseBigNumber(a.volume_usd.h24);
  const liqUsd    = parseBigNumber(a.reserve_in_usd);
  const txH24     = (a.transactions.h24?.buys ?? 0) + (a.transactions.h24?.sells ?? 0);

  const normalized: NormalizedPool = {
    id:      raw.id,
    address: a.address,
    name:    a.name,
    network,
    dexId,
    dexName: formatDexName(rawDex?.attributes.name ?? dexId),
    baseToken: {
      id:       baseTokenId,
      address:  rawBase?.attributes.address ?? '',
      name:     rawBase?.attributes.name    ?? baseNameFallback,
      symbol:   rawBase?.attributes.symbol  ?? baseNameFallback,
      imageUrl: rawBase?.attributes.image_url ?? null,
    },
    quoteToken: {
      id:       quoteTokenId,
      address:  rawQuote?.attributes.address ?? '',
      name:     rawQuote?.attributes.name    ?? quoteNameFallback,
      symbol:   rawQuote?.attributes.symbol  ?? quoteNameFallback,
      imageUrl: rawQuote?.attributes.image_url ?? null,
    },
    priceUsd:    parseBigNumber(a.base_token_price_usd),
    priceNative: parseBigNumber(a.base_token_price_native_currency),
    priceChange: {
      m5:  parseBigNumber(a.price_change_percentage.m5),
      h1:  priceH1,
      h6:  parseBigNumber(a.price_change_percentage.h6),
      h24: priceH24,
    },
    volume: {
      m5:  parseBigNumber(a.volume_usd.m5),
      h1:  parseBigNumber(a.volume_usd.h1),
      h6:  parseBigNumber(a.volume_usd.h6),
      h24: volH24,
    },
    transactions: {
      h1:  a.transactions.h1  ?? null,
      h24: a.transactions.h24 ?? null,
    },
    liquidityUsd: liqUsd,
    fdvUsd:       a.fdv_usd        ? parseBigNumber(a.fdv_usd)        : null,
    marketCapUsd: a.market_cap_usd ? parseBigNumber(a.market_cap_usd) : null,
    createdAt:    a.pool_created_at ? new Date(a.pool_created_at) : null,
    momentumScore: calcMomentumScore(priceH1, priceH24, volH24, liqUsd, txH24),
  };

  return applyRegistryOverride(normalized);
}

export function normalizePools(response: GeckoResponse<RawPool[]>, forcedNetwork?: string): NormalizedPool[] {
  return response.data.map(raw => normalizePool(raw, response.included, forcedNetwork));
}

function formatDexName(raw: string): string {
  return raw
    .replace(/_/g, ' ')
    .replace(/\bv(\d)\b/gi, 'v$1')
    .replace(/\b\w/g, c => c.toUpperCase());
}
