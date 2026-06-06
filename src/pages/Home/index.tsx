import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useTopPools, useTrendingPools, useNewPools } from '../../hooks/usePools';
import { TokenTable } from '../../components/TokenTable/TokenTable';
import { StatCard } from '../../components/common/StatCard';
import { LiveIndicator } from '../../components/common/LiveIndicator';
import { formatCompact } from '../../utils/format';
import { getNetwork } from '../../utils/networks';
import { TrendingUp, Zap, LayoutDashboard, RefreshCw, Flame, Activity, DollarSign, Droplets } from 'lucide-react';
import clsx from 'clsx';

const TABS = [
  { id: 'trending', label: 'Trending',   icon: Flame },
  { id: 'top',      label: 'Top Volume', icon: Activity },
  { id: 'new',      label: 'New Pairs',  icon: Zap },
] as const;

type Tab = typeof TABS[number]['id'];

function useTabData(tab: Tab, network: string) {
  const top      = useTopPools(network);
  const trending = useTrendingPools(network);
  const newPools = useNewPools(network);

  const map = { top, trending, new: newPools };
  return map[tab];
}

export function HomePage() {
  const { selectedNetwork, activeTab, setTab } = useStore();
  const [localTab, setLocalTab] = useState<Tab>(activeTab as Tab ?? 'trending');
  const net = getNetwork(selectedNetwork);

  const { data: pools = [], isLoading, isError, refetch } = useTabData(localTab, selectedNetwork);

  const totalVol = pools.reduce((acc, p) => acc + p.volume.h24, 0);
  const totalLiq = pools.reduce((acc, p) => acc + p.liquidityUsd, 0);
  const gainers  = pools.filter(p => p.priceChange.h24 > 0).length;
  const topMomentum = [...pools].sort((a, b) => b.momentumScore - a.momentumScore).slice(0, 1)[0];

  const handleTab = (tab: Tab) => {
    setLocalTab(tab);
    setTab(tab);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="border-b border-nova-border bg-nova-surface px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <LayoutDashboard size={16} className="text-nova-accent" />
              <h1 className="text-lg font-semibold text-nova-text">
                DEX Pairs
                <span
                  className="ml-2 text-sm font-normal px-2 py-0.5 rounded-md"
                  style={{ color: net.color, backgroundColor: net.bgColor }}
                >
                  {net.name}
                </span>
              </h1>
            </div>
            <p className="text-xs text-nova-subtle mt-0.5">
              Real-time trading pairs · refreshes every 30s
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LiveIndicator />
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 text-xs text-nova-muted border border-nova-border rounded-lg px-2.5 py-1.5 hover:text-nova-text hover:border-nova-border/80 transition-colors"
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="24h Volume"
            value={formatCompact(totalVol)}
            icon={<DollarSign size={16} />}
            accentColor="#00e5b4"
            isLoading={isLoading}
          />
          <StatCard
            label="Total Liquidity"
            value={formatCompact(totalLiq)}
            icon={<Droplets size={16} />}
            accentColor="#7c63ff"
            isLoading={isLoading}
          />
          <StatCard
            label="Gainers (24h)"
            value={isLoading ? '—' : `${gainers} / ${pools.length}`}
            sub={isLoading ? undefined : `${Math.round((gainers / Math.max(pools.length, 1)) * 100)}% positive`}
            icon={<TrendingUp size={16} />}
            accentColor="#00d98f"
            isLoading={isLoading}
          />
          <StatCard
            label="Top Momentum"
            value={isLoading ? '—' : topMomentum ? `${topMomentum.baseToken.symbol}` : '—'}
            sub={isLoading ? undefined : topMomentum ? `Score: ${topMomentum.momentumScore}` : undefined}
            icon={<Flame size={16} />}
            accentColor="#ffd166"
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-nova-border bg-nova-surface">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTab(id)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
              localTab === id
                ? 'bg-nova-accent/12 text-nova-accent border border-nova-accent/20'
                : 'text-nova-muted hover:text-nova-text hover:bg-nova-elevated',
            )}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
        <span className="ml-auto text-xs text-nova-subtle font-mono">
          {isLoading ? 'Loading…' : `${pools.length} pairs`}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <TokenTable
          pools={pools}
          isLoading={isLoading}
          isError={isError}
          onRefetch={refetch}
        />
      </div>
    </div>
  );
}
