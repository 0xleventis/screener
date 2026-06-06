import { useState } from 'react';
import { Flame, TrendingUp, Award, Zap, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { useTrendingPools } from '../../hooks/usePools';
import { TokenTable } from '../../components/TokenTable/TokenTable';
import { TokenImage } from '../../components/common/TokenImage';
import { NetworkBadge } from '../../components/common/NetworkBadge';
import { PriceChange } from '../../components/common/PriceChange';
import { LiveIndicator } from '../../components/common/LiveIndicator';
import { formatPrice, formatCompact } from '../../utils/format';
import { FEATURED_NETWORKS, getNetwork } from '../../utils/networks';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '../../components/common/Skeleton';

function TrendingCard({ pool, rank }: { pool: any; rank: number }) {
  const navigate = useNavigate();
  const isHot = rank <= 3;
  const rankColors = ['text-warn', 'text-nova-muted', 'text-nova-subtle'];

  return (
    <div
      onClick={() => navigate(`/token/${pool.network}/${pool.address}`)}
      className={clsx(
        'bg-nova-card border rounded-xl p-4 cursor-pointer transition-all duration-200',
        'hover:border-nova-accent/30 hover:bg-nova-elevated hover:-translate-y-0.5',
        isHot ? 'border-warn/20' : 'border-nova-border',
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={clsx('text-lg font-bold font-mono', rankColors[rank - 1] ?? 'text-nova-subtle')}>
            #{rank}
          </span>
          {rank === 1 && <Flame size={16} className="text-warn animate-glow-pulse" />}
        </div>
        <NetworkBadge networkId={pool.network} size="xs" />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <TokenImage src={pool.baseToken.imageUrl} symbol={pool.baseToken.symbol} size={32} />
        <div>
          <div className="font-semibold text-nova-text">{pool.baseToken.symbol}</div>
          <div className="text-xs text-nova-subtle">{pool.baseToken.name}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="font-mono text-sm text-nova-text">{formatPrice(pool.priceUsd)}</span>
        <PriceChange value={pool.priceChange.h24} size="sm" showIcon />
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
        <div>
          <div className="text-nova-subtle mb-0.5">Vol 24h</div>
          <div className="font-mono text-nova-muted">{formatCompact(pool.volume.h24)}</div>
        </div>
        <div>
          <div className="text-nova-subtle mb-0.5">Liquidity</div>
          <div className="font-mono text-nova-muted">{formatCompact(pool.liquidityUsd)}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <div className="flex-1 h-1.5 bg-nova-elevated rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-nova-accent to-nova-purple"
            style={{ width: `${pool.momentumScore}%` }}
          />
        </div>
        <span className="text-[10px] text-nova-subtle font-mono">{pool.momentumScore}</span>
      </div>
    </div>
  );
}

export function TrendingPage() {
  const [network, setNetwork] = useState('eth');
  const { data: pools = [], isLoading, isError, refetch } = useTrendingPools(network);

  const top10 = pools.slice(0, 10);
  const rest  = pools.slice(10);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame size={20} className="text-warn" />
            <h1 className="text-2xl font-bold text-nova-text">Trending Pairs</h1>
            <LiveIndicator />
          </div>
          <p className="text-sm text-nova-subtle">Top trending token pairs ranked by volume momentum and social activity</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs text-nova-muted border border-nova-border rounded-lg px-2.5 py-1.5 hover:text-nova-text transition-colors"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Network selector */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {FEATURED_NETWORKS.map(netId => {
          const net = getNetwork(netId);
          const isSelected = network === netId;
          return (
            <button
              key={netId}
              onClick={() => setNetwork(netId)}
              className={clsx(
                'flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-all duration-150',
                isSelected
                  ? 'text-white'
                  : 'border-nova-border text-nova-subtle hover:text-nova-muted',
              )}
              style={isSelected ? { borderColor: `${net.color}66`, backgroundColor: net.bgColor, color: net.color } : {}}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: net.color }} />
              {net.name}
            </button>
          );
        })}
      </div>

      {/* Top 10 cards grid */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Award size={16} className="text-nova-accent" />
          <h2 className="text-sm font-semibold text-nova-text uppercase tracking-wide">Top Trending</h2>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="bg-nova-card border border-nova-border rounded-xl p-4 space-y-3">
                <Skeleton height="h-4" className="w-12" />
                <Skeleton height="h-8" className="w-20" />
                <Skeleton height="h-3" className="w-full" />
                <Skeleton height="h-3" className="w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {top10.map((pool, i) => (
              <TrendingCard key={pool.id} pool={pool} rank={i + 1} />
            ))}
          </div>
        )}
      </div>

      {/* Full table */}
      {rest.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-nova-accent" />
            <h2 className="text-sm font-semibold text-nova-text uppercase tracking-wide">All Trending</h2>
          </div>
          <div className="rounded-xl border border-nova-border bg-nova-card overflow-hidden">
            <TokenTable pools={rest} isLoading={false} isError={isError} onRefetch={refetch} />
          </div>
        </div>
      )}
    </div>
  );
}
