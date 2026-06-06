import { Star, Trash2, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { formatPrice, formatCompact } from '../../utils/format';
import { PriceChange } from '../../components/common/PriceChange';
import { NetworkBadge } from '../../components/common/NetworkBadge';
import { TokenImage } from '../../components/common/TokenImage';

export function WatchlistPage() {
  const { watchlist, toggleWatchlist } = useStore();
  const navigate = useNavigate();

  if (watchlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-nova-card border border-nova-border flex items-center justify-center">
          <Star size={28} className="text-nova-border" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-nova-text mb-2">Your watchlist is empty</h2>
          <p className="text-sm text-nova-subtle max-w-xs">
            Star any token pair from the dashboard or token page to track it here.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-nova-accent border border-nova-accent/30 rounded-lg px-4 py-2 hover:bg-nova-accent/10 transition-colors"
        >
          <TrendingUp size={14} /> Browse Pairs
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Star size={20} className="text-warn" fill="currentColor" />
          <h1 className="text-2xl font-bold text-nova-text">Watchlist</h1>
          <span className="text-sm text-nova-subtle bg-nova-card border border-nova-border rounded-full px-2 py-0.5">
            {watchlist.length}
          </span>
        </div>
      </div>

      <div className="bg-nova-card border border-nova-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-nova-border">
              {['Token', 'Network', 'Price', '1h', '24h', 'Vol 24h', 'Liquidity', ''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[11px] uppercase tracking-wider text-nova-subtle font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {watchlist.map(poolId => {
              const parts = poolId.split('_');
              const network = parts.length > 1 ? parts.slice(0, -1).join('_') : 'eth';
              const address = parts[parts.length - 1];

              return (
                <tr
                  key={poolId}
                  className="border-b border-nova-border/40 hover:bg-nova-elevated/40 cursor-pointer transition-colors"
                  onClick={() => navigate(`/token/${network}/${address}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-nova-elevated flex items-center justify-center text-xs font-bold text-nova-muted">
                        ?
                      </div>
                      <div>
                        <div className="text-sm font-medium text-nova-text font-mono">{address.slice(0, 8)}…</div>
                        <div className="text-xs text-nova-subtle">{poolId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <NetworkBadge networkId={network} size="sm" showName />
                  </td>
                  <td colSpan={4} className="px-4 py-3 text-xs text-nova-subtle">
                    Visit pair page to load data
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => toggleWatchlist(poolId)}
                      className="w-7 h-7 rounded border border-nova-border flex items-center justify-center text-nova-subtle hover:text-loss hover:border-loss/40 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
