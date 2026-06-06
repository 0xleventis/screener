import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, ExternalLink, Copy, Check, Share2, ShoppingCart, TrendingUp, Activity, Zap, Globe, Twitter, Send, MessageSquare } from 'lucide-react';
import { useState, useMemo } from 'react';
import clsx from 'clsx';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { usePoolDetail } from '../../hooks/usePools';
import { gecko } from '../../api/geckoterminal';
import { PriceChart } from '../../components/Charts/PriceChart';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { PriceChange } from '../../components/common/PriceChange';
import { NetworkBadge } from '../../components/common/NetworkBadge';
import { TokenImage } from '../../components/common/TokenImage';
import { Skeleton } from '../../components/common/Skeleton';
import { useStore } from '../../store/useStore';
import { formatPrice, formatCompact, formatAge, shortenAddress } from '../../utils/format';
import { getNetwork } from '../../utils/networks';
import type { NormalizedPool, Trade } from '../../types';
import { LiveIndicator } from '../../components/common/LiveIndicator';

// ── Chain → bankr swap mapping ────────────────────────────────────────────────
const BANKR_CHAIN: Record<string, string> = {
  eth:         'ethereum',
  bsc:         'bsc',
  polygon_pos: 'polygon',
  arbitrum:    'arbitrum',
  base:        'base',
  solana:      'solana',
  optimism:    'optimism',
  avalanche:   'avalanche',
  fantom:      'fantom',
  cronos:      'cronos',
};

const EXPLORER: Record<string, string> = {
  eth:         'https://etherscan.io/address',
  bsc:         'https://bscscan.com/address',
  polygon_pos: 'https://polygonscan.com/address',
  arbitrum:    'https://arbiscan.io/address',
  base:        'https://basescan.org/address',
  optimism:    'https://optimistic.etherscan.io/address',
  avalanche:   'https://snowtrace.io/address',
  solana:      'https://solscan.io/account',
  fantom:      'https://ftmscan.com/address',
  cronos:      'https://cronoscan.com/address',
};

function bankrSwapUrl(tokenAddress: string, network: string): string {
  const chain = BANKR_CHAIN[network] ?? network;
  return `https://swap.bankr.bot/?outputToken=${tokenAddress}&chain=${chain}`;
}

function explorerUrl(network: string, address: string): string {
  const base = EXPLORER[network] ?? 'https://etherscan.io/address';
  return `${base}/${address}`;
}

// ── Trade row ─────────────────────────────────────────────────────────────────
function TradeRow({ trade }: { trade: Trade }) {
  const a = trade.attributes;
  const isBuy = a.kind === 'buy';
  const ts = new Date(a.block_timestamp);
  const secsAgo = Math.round((Date.now() - ts.getTime()) / 1000);
  const timeLabel = secsAgo < 60 ? `${secsAgo}s` : secsAgo < 3600 ? `${Math.round(secsAgo / 60)}m` : `${Math.round(secsAgo / 3600)}h`;

  return (
    <tr className="border-b border-nova-border/20 hover:bg-nova-elevated/40 transition-colors text-xs group">
      <td className="px-3 py-1.5">
        <span className={clsx(
          'inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded text-[10px]',
          isBuy ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss',
        )}>
          {isBuy ? '▲ BUY' : '▼ SELL'}
        </span>
      </td>
      <td className="px-3 py-1.5 font-mono text-nova-text tabular-nums">
        {formatPrice(parseFloat(a.price_from_in_usd))}
      </td>
      <td className="px-3 py-1.5 font-mono text-nova-muted tabular-nums">
        {parseFloat(a.from_token_amount).toLocaleString('en-US', { maximumFractionDigits: 2 })}
      </td>
      <td className="px-3 py-1.5">
        <span className={clsx('font-mono tabular-nums font-medium', isBuy ? 'text-gain' : 'text-loss')}>
          {formatCompact(parseFloat(a.volume_in_usd))}
        </span>
      </td>
      <td className="px-3 py-1.5">
        <a
          href={`https://etherscan.io/tx/${a.tx_hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-nova-subtle hover:text-nova-accent transition-colors font-mono"
          onClick={e => e.stopPropagation()}
        >
          {a.tx_hash.slice(0, 10)}…
        </a>
      </td>
      <td className="px-3 py-1.5 text-nova-subtle text-right">{timeLabel} ago</td>
    </tr>
  );
}

// ── Stat mini card ────────────────────────────────────────────────────────────
function MiniStat({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('bg-nova-elevated/60 rounded-lg border border-nova-border/50 p-3', className)}>
      <p className="text-[10px] uppercase tracking-wider text-nova-subtle mb-1">{label}</p>
      <div className="text-sm font-semibold font-mono text-nova-text">{value}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function TokenPage() {
  const { network = 'eth', address = '' } = useParams<{ network: string; address: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isWatched, toggleWatchlist } = useStore();
  const [copied, setCopied] = useState(false);

  // ── Pre-seed from any cached list so the page renders immediately ──
  const initialData = useMemo<NormalizedPool | undefined>(() => {
    const all: NormalizedPool[] = [];
    queryClient
      .getQueriesData<NormalizedPool[]>({ queryKey: ['pools'] })
      .forEach(([, data]) => { if (data) all.push(...data); });
    return all.find(p =>
      p.address.toLowerCase() === address.toLowerCase() && p.network === network,
    );
  }, [queryClient, network, address]);

  // isPending = true while the cache has nothing yet (not just "not fetching")
  const { data: freshPool, isPending, isError, error, refetch } = usePoolDetail(network, address);
  const pool = freshPool ?? initialData;

  // Trades – longer interval to stay inside rate limits
  const { data: tradesData } = useQuery({
    queryKey: ['trades', network, address],
    queryFn: () => gecko.trades(network, address),
    refetchInterval: 30_000,
    enabled: Boolean(network && address),
    retry: 2,
  });
  const trades = tradesData?.data ?? [];

  const watched   = isWatched(pool?.id ?? '');
  const swapUrl   = bankrSwapUrl(pool?.baseToken.address ?? address, network);
  const explorerLink = explorerUrl(network, address);
  const netMeta   = getNetwork(network);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Error (only when there's no cached data to fall back on) ──────────────
  if (isError && !pool) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-nova-card border border-nova-border flex items-center justify-center">
          <Activity size={28} className="text-nova-subtle opacity-40" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-nova-text mb-1">Could not load this pool</h2>
          <p className="text-sm text-nova-subtle max-w-xs">
            {String((error as Error)?.message ?? 'Network error. The pool may not exist on this chain.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="text-xs text-nova-accent border border-nova-accent/30 rounded-lg px-3 py-1.5 hover:bg-nova-accent/10 transition-colors">
            Retry
          </button>
          <button onClick={() => navigate(-1)} className="text-xs text-nova-subtle border border-nova-border rounded-lg px-3 py-1.5 hover:text-nova-text transition-colors">
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  // True first-load skeleton: isPending AND nothing in cache
  const showSkeleton = isPending && !pool;

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-5 animate-fade-up">
      {/* ── Back nav ── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-nova-subtle hover:text-nova-text transition-colors mb-5"
      >
        <ArrowLeft size={14} /> Back to pairs
      </button>

      {/* ── Token header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {showSkeleton ? (
            <Skeleton className="w-12 h-12 rounded-full" />
          ) : (
            <div className="relative">
              <TokenImage
                src={pool?.baseToken.imageUrl}
                symbol={pool?.baseToken.symbol ?? '?'}
                size={48}
              />
              <div className="absolute -bottom-1 -right-1 ring-2 ring-nova-bg rounded-full">
                <TokenImage
                  src={pool?.quoteToken.imageUrl}
                  symbol={pool?.quoteToken.symbol ?? '?'}
                  size={18}
                />
              </div>
            </div>
          )}

          <div>
            {showSkeleton ? (
              <div className="space-y-2">
                <Skeleton className="w-44" height="h-6" />
                <Skeleton className="w-28" height="h-4" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-nova-text">
                    {pool?.baseToken.symbol ?? '—'}
                    <span className="text-nova-muted font-normal text-lg">
                      /{pool?.quoteToken.symbol ?? '—'}
                    </span>
                  </h1>
                  <NetworkBadge networkId={network} showName />
                  <span className="text-xs bg-nova-elevated border border-nova-border rounded px-2 py-0.5 text-nova-subtle">
                    {pool?.dexName ?? '—'}
                  </span>
                  {isPending && !showSkeleton && (
                    <span className="text-[10px] text-nova-subtle animate-pulse">updating…</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-nova-subtle font-mono">{shortenAddress(address, 6)}</span>
                  <button onClick={copyAddress} className="text-nova-subtle hover:text-nova-muted transition-colors" title="Copy address">
                    {copied ? <Check size={12} className="text-gain" /> : <Copy size={12} />}
                  </button>
                  {pool && (
                    <>
                      <span className="font-mono text-sm font-semibold text-nova-text ml-3">
                        {formatPrice(pool.priceUsd)}
                      </span>
                      <PriceChange value={pool.priceChange.h24} size="sm" showIcon />
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Primary: Buy on Bankr */}
          <a
            href={swapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200',
              'bg-gain text-nova-bg shadow-gain hover:brightness-110 hover:shadow-[0_0_24px_rgba(0,217,143,0.5)] active:scale-95',
            )}
          >
            <ShoppingCart size={15} />
            Buy {pool?.baseToken.symbol ?? 'Token'} on Bankr
          </a>

          <button
            onClick={() => pool && toggleWatchlist(pool.id)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors',
              watched
                ? 'border-warn/40 bg-warn/10 text-warn'
                : 'border-nova-border text-nova-muted hover:border-warn/40 hover:text-warn',
            )}
          >
            <Star size={14} fill={watched ? 'currentColor' : 'none'} />
            {watched ? 'Watching' : 'Watch'}
          </button>

          <a
            href={explorerLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-nova-border text-sm text-nova-muted hover:text-nova-text transition-colors"
          >
            <ExternalLink size={14} />
            Explorer
          </a>

          <button
            onClick={() => {
              const url = window.location.href;
              navigator.clipboard.writeText(url);
            }}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-nova-border text-sm text-nova-muted hover:text-nova-text transition-colors"
            title="Copy link"
          >
            <Share2 size={14} />
          </button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
        {showSkeleton
          ? Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-nova-card border border-nova-border rounded-xl p-3">
                <Skeleton className="w-14 mb-1" height="h-3" />
                <Skeleton className="w-20" height="h-5" />
              </div>
            ))
          : [
              { label: 'Price',      node: <span className="font-mono tabular-nums">{formatPrice(pool?.priceUsd ?? 0)}</span> },
              { label: '5m',         node: <PriceChange value={pool?.priceChange.m5 ?? 0}  size="sm" showIcon /> },
              { label: '1h',         node: <PriceChange value={pool?.priceChange.h1 ?? 0}  size="sm" showIcon /> },
              { label: '6h',         node: <PriceChange value={pool?.priceChange.h6 ?? 0}  size="sm" showIcon /> },
              { label: '24h',        node: <PriceChange value={pool?.priceChange.h24 ?? 0} size="sm" showIcon /> },
              { label: 'Vol 24h',    node: <span className="font-mono tabular-nums">{formatCompact(pool?.volume.h24 ?? 0)}</span> },
            ].map(({ label, node }) => (
              <div key={label} className="bg-nova-card border border-nova-border rounded-xl p-3 hover:border-nova-border/80 transition-colors">
                <p className="text-[10px] uppercase tracking-wider text-nova-subtle mb-1">{label}</p>
                <div className="text-sm font-semibold text-nova-text">{node}</div>
              </div>
            ))
        }
      </div>

      {/* ── Registry description ── */}
      {pool?.registry?.description && (
        <div className="mb-5 px-4 py-3 rounded-xl border border-nova-border/60 bg-nova-card/60 text-sm text-nova-muted leading-relaxed">
          {pool.registry.description}
        </div>
      )}

      {/* ── Tags ── */}
      {pool?.registry?.tags && pool.registry.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-5">
          {pool.registry.tags.map(tag => (
            <span key={tag} className="text-[11px] px-2.5 py-0.5 rounded-full border border-nova-accent/25 bg-nova-accent/8 text-nova-accent font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* ── Main grid: chart + sidebar ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* ── Left: Chart + Trades ── */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          {/* Chart */}
          {pool ? (
            <ErrorBoundary
              fallback={
                <div className="rounded-xl border border-nova-border bg-nova-card flex items-center justify-center" style={{ height: 480 }}>
                  <p className="text-xs text-nova-subtle">Chart unavailable — try refreshing the page.</p>
                </div>
              }
            >
              <PriceChart
                network={network}
                address={address}
                baseSymbol={pool.baseToken.symbol}
                quoteSymbol={pool.quoteToken.symbol}
                currentPrice={pool.priceUsd}
              />
            </ErrorBoundary>
          ) : (
            <div
              className="rounded-xl border border-nova-border bg-nova-card flex items-center justify-center"
              style={{ height: 480 }}
            >
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-2 border-nova-accent/30 border-t-nova-accent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-nova-subtle">Loading chart…</p>
              </div>
            </div>
          )}

          {/* Trades feed */}
          <div className="rounded-xl border border-nova-border bg-nova-card overflow-hidden">
            <div className="px-4 py-3 border-b border-nova-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-nova-accent" />
                <span className="text-sm font-medium text-nova-text">Recent Trades</span>
              </div>
              <LiveIndicator label="live" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="border-b border-nova-border/50">
                    {['Type', 'Price', 'Amount', 'Value', 'Tx Hash', 'Time'].map(h => (
                      <th key={h} className="px-3 py-2 text-[10px] text-nova-subtle uppercase tracking-wider text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trades.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-nova-subtle text-xs">
                        {isPending ? 'Loading trades…' : 'No recent trades found'}
                      </td>
                    </tr>
                  ) : (
                    trades.slice(0, 40).map(trade => <TradeRow key={trade.id} trade={trade} />)
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Right: info + buy CTA ── */}
        <div className="flex flex-col gap-4">

          {/* Liquidity + FDV stats */}
          <div className="rounded-xl border border-nova-border bg-nova-card p-4">
            <h3 className="text-xs uppercase tracking-wider text-nova-subtle font-medium mb-3 flex items-center gap-1.5">
              <TrendingUp size={12} /> Market Stats
            </h3>
            {showSkeleton ? (
              <div className="space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} height="h-4" />)}</div>
            ) : (
              <div className="space-y-2.5">
                {[
                  ['Liquidity',     formatCompact(pool?.liquidityUsd ?? 0)],
                  ['FDV',           pool?.fdvUsd ? formatCompact(pool.fdvUsd) : '—'],
                  ['Market Cap',    pool?.marketCapUsd ? formatCompact(pool.marketCapUsd) : '—'],
                  ['24h Volume',    formatCompact(pool?.volume.h24 ?? 0)],
                  ['Pool Age',      formatAge(pool?.createdAt)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-nova-subtle">{label}</span>
                    <span className="text-nova-muted font-mono tabular-nums">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transaction counts */}
          {pool?.transactions.h24 && (
            <div className="rounded-xl border border-nova-border bg-nova-card p-4">
              <h3 className="text-xs uppercase tracking-wider text-nova-subtle font-medium mb-3">Txns (24h)</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'Buys',    value: pool.transactions.h24.buys,    color: 'text-gain' },
                  { label: 'Sells',   value: pool.transactions.h24.sells,   color: 'text-loss' },
                  { label: 'Buyers',  value: pool.transactions.h24.buyers,  color: 'text-nova-muted' },
                  { label: 'Sellers', value: pool.transactions.h24.sellers, color: 'text-nova-muted' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-nova-elevated/60 rounded-lg p-2.5 border border-nova-border/50">
                    <div className="text-[10px] text-nova-subtle mb-1">{label}</div>
                    <div className={clsx('font-mono font-semibold tabular-nums', color)}>
                      {value.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              {/* Buy/sell pressure bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-nova-subtle mb-1">
                  <span>Buy pressure</span>
                  <span>
                    {Math.round((pool.transactions.h24.buys / Math.max(pool.transactions.h24.buys + pool.transactions.h24.sells, 1)) * 100)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-loss/30 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gain transition-all duration-500"
                    style={{
                      width: `${(pool.transactions.h24.buys / Math.max(pool.transactions.h24.buys + pool.transactions.h24.sells, 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pool info */}
          <div className="rounded-xl border border-nova-border bg-nova-card p-4">
            <h3 className="text-xs uppercase tracking-wider text-nova-subtle font-medium mb-3">Pool Info</h3>
            {showSkeleton ? (
              <div className="space-y-2">{Array(4).fill(0).map((_, i) => <Skeleton key={i} height="h-4" />)}</div>
            ) : (
              <div className="space-y-2.5 text-xs">
                {[
                  ['Token',   pool?.baseToken.name ?? '—'],
                  ['Network', netMeta.name],
                  ['DEX',     pool?.dexName ?? '—'],
                  ['Address', shortenAddress(address, 8)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-nova-subtle">{label}</span>
                    <span className="text-nova-muted font-mono">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Community & Links (registry) ── */}
          {pool?.registry && (pool.registry.website || pool.registry.twitter || pool.registry.telegram || pool.registry.discord) && (
            <div className="rounded-xl border border-nova-border bg-nova-card p-4">
              <h3 className="text-xs uppercase tracking-wider text-nova-subtle font-medium mb-3">Community & Links</h3>
              <div className="flex flex-col gap-2">
                {pool.registry.website && (
                  <a href={pool.registry.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-xs text-nova-muted hover:text-nova-text transition-colors group">
                    <Globe size={13} className="text-nova-subtle group-hover:text-nova-accent transition-colors shrink-0" />
                    <span className="truncate">{pool.registry.website.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink size={10} className="ml-auto shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
                  </a>
                )}
                {pool.registry.twitter && (
                  <a href={pool.registry.twitter} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-xs text-nova-muted hover:text-nova-text transition-colors group">
                    <Twitter size={13} className="text-nova-subtle group-hover:text-[#1d9bf0] transition-colors shrink-0" />
                    <span className="truncate">{pool.registry.twitter.replace(/^https?:\/\/(www\.)?twitter\.com\//, '@')}</span>
                    <ExternalLink size={10} className="ml-auto shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
                  </a>
                )}
                {pool.registry.telegram && (
                  <a href={pool.registry.telegram} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-xs text-nova-muted hover:text-nova-text transition-colors group">
                    <Send size={13} className="text-nova-subtle group-hover:text-[#229ed9] transition-colors shrink-0" />
                    <span className="truncate">{pool.registry.telegram.replace(/^https?:\/\/t\.me\//, 't.me/')}</span>
                    <ExternalLink size={10} className="ml-auto shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
                  </a>
                )}
                {pool.registry.discord && (
                  <a href={pool.registry.discord} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-xs text-nova-muted hover:text-nova-text transition-colors group">
                    <MessageSquare size={13} className="text-nova-subtle group-hover:text-[#5865f2] transition-colors shrink-0" />
                    <span className="truncate">Discord</span>
                    <ExternalLink size={10} className="ml-auto shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ── Buy CTA (sticky at bottom of sidebar) ── */}
          <div className="rounded-xl border border-gain/20 bg-gain/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-gain" />
              <span className="text-xs font-semibold text-gain uppercase tracking-wide">Trade on Bankr</span>
            </div>
            <p className="text-xs text-nova-subtle mb-4 leading-relaxed">
              Swap {pool?.baseToken.symbol ?? 'this token'} instantly on Bankr — the fastest AI-powered crypto trading experience.
            </p>
            <a
              href={swapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={clsx(
                'flex items-center justify-center gap-2 w-full py-3 rounded-xl',
                'bg-gain text-nova-bg font-bold text-sm',
                'hover:brightness-110 hover:shadow-[0_0_24px_rgba(0,217,143,0.45)]',
                'transition-all duration-200 active:scale-95',
              )}
            >
              <ShoppingCart size={16} />
              Buy {pool?.baseToken.symbol ?? 'Token'} →
            </a>
            {pool?.quoteToken.symbol && (
              <p className="text-[10px] text-nova-subtle text-center mt-2 opacity-60">
                via {pool.quoteToken.symbol} pair · powered by swap.bankr.bot
              </p>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
