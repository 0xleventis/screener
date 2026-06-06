import { useState } from 'react';
import { Zap, Clock, Filter, RefreshCw, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useNewPools } from '../../hooks/usePools';
import { TokenTable } from '../../components/TokenTable/TokenTable';
import { TokenImage } from '../../components/common/TokenImage';
import { NetworkBadge } from '../../components/common/NetworkBadge';
import { PriceChange } from '../../components/common/PriceChange';
import { LiveIndicator } from '../../components/common/LiveIndicator';
import { Skeleton } from '../../components/common/Skeleton';
import { formatPrice, formatCompact, formatAge } from '../../utils/format';
import { FEATURED_NETWORKS, getNetwork } from '../../utils/networks';

function NewPairCard({ pool }: { pool: any }) {
  const navigate = useNavigate();
  const isVeryNew = pool.createdAt && (Date.now() - pool.createdAt.getTime()) < 3600_000;

  return (
    <div
      onClick={() => navigate(`/token/${pool.network}/${pool.address}`)}
      className={clsx(
        'bg-nova-card border rounded-xl p-4 cursor-pointer transition-all duration-200',
        'hover:border-nova-accent/30 hover:-translate-y-0.5',
        isVeryNew ? 'border-nova-accent/20' : 'border-nova-border',
      )}
    >
      {isVeryNew && (
        <div className="flex items-center gap-1 mb-2">
          <span className="animate-ping w-1.5 h-1.5 rounded-full bg-nova-accent opacity-75" />
          <span className="text-[10px] text-nova-accent font-medium uppercase tracking-wider">Just Listed</span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <TokenImage src={pool.baseToken.imageUrl} symbol={pool.baseToken.symbol} size={32} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-nova-text">{pool.baseToken.symbol}</span>
            <NetworkBadge networkId={pool.network} size="xs" />
          </div>
          <div className="text-xs text-nova-subtle truncate">{pool.dexName}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-nova-subtle mb-0.5">Price</div>
          <div className="font-mono text-nova-text">{formatPrice(pool.priceUsd)}</div>
        </div>
        <div>
          <div className="text-nova-subtle mb-0.5">24h</div>
          <PriceChange value={pool.priceChange.h24} size="xs" showIcon />
        </div>
        <div>
          <div className="text-nova-subtle mb-0.5">Liquidity</div>
          <div className="font-mono text-nova-muted">{formatCompact(pool.liquidityUsd)}</div>
        </div>
        <div>
          <div className="text-nova-subtle mb-0.5">Age</div>
          <div className="text-nova-muted flex items-center gap-1">
            <Clock size={10} />
            {formatAge(pool.createdAt)}
          </div>
        </div>
      </div>

      {/* Safety hint */}
      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-warn/80 bg-warn/5 border border-warn/10 rounded px-2 py-1">
        <AlertTriangle size={10} />
        <span>New pairs carry higher risk — DYOR</span>
      </div>
    </div>
  );
}

export function NewPairsPage() {
  const [network, setNetwork] = useState('eth');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const { data: pools = [], isLoading, isError, refetch } = useNewPools(network);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={20} className="text-nova-accent" />
            <h1 className="text-2xl font-bold text-nova-text">New Pairs</h1>
            <LiveIndicator />
          </div>
          <p className="text-sm text-nova-subtle">Freshly listed trading pairs · sorted by listing time</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-nova-border overflow-hidden">
            {(['cards', 'table'] as const).map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={clsx(
                  'px-3 py-1.5 text-xs capitalize transition-colors',
                  viewMode === v
                    ? 'bg-nova-accent/15 text-nova-accent'
                    : 'text-nova-subtle hover:text-nova-muted',
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-xs text-nova-muted border border-nova-border rounded-lg px-2.5 py-1.5 hover:text-nova-text transition-colors"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
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
                isSelected ? 'text-white' : 'border-nova-border text-nova-subtle hover:text-nova-muted',
              )}
              style={isSelected ? { borderColor: `${net.color}66`, backgroundColor: net.bgColor, color: net.color } : {}}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: net.color }} />
              {net.name}
            </button>
          );
        })}
      </div>

      {viewMode === 'cards' ? (
        isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array(20).fill(0).map((_, i) => (
              <div key={i} className="bg-nova-card border border-nova-border rounded-xl p-4 space-y-3">
                <Skeleton height="h-8" className="w-24" />
                <Skeleton height="h-4" className="w-full" />
                <Skeleton height="h-4" className="w-3/4" />
                <Skeleton height="h-3" className="w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {pools.map(pool => (
              <NewPairCard key={pool.id} pool={pool} />
            ))}
          </div>
        )
      ) : (
        <div className="rounded-xl border border-nova-border bg-nova-card overflow-hidden">
          <TokenTable pools={pools} isLoading={isLoading} isError={isError} onRefetch={refetch} />
        </div>
      )}
    </div>
  );
}
