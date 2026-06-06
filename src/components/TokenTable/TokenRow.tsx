import { memo, useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ExternalLink, BarChart2, Zap } from 'lucide-react';
import clsx from 'clsx';
import type { NormalizedPool } from '../../types';
import { TokenImage } from '../common/TokenImage';
import { NetworkBadge } from '../common/NetworkBadge';
import { PriceChange } from '../common/PriceChange';
import { formatPrice, formatCompact, formatAge, shortenAddress } from '../../utils/format';
import { useStore } from '../../store/useStore';

interface Props {
  pool: NormalizedPool;
  rank: number;
}

function MomentumBar({ score }: { score: number }) {
  const color = score >= 75 ? '#00d98f' : score >= 50 ? '#ffd166' : score >= 25 ? '#7c63ff' : '#505070';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-nova-elevated rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color, boxShadow: `0 0 4px ${color}60` }}
        />
      </div>
      <span className="text-[10px] font-mono tabular-nums" style={{ color }}>{score}</span>
    </div>
  );
}

function TxRatio({ h24 }: { h24: NormalizedPool['transactions']['h24'] }) {
  if (!h24 || (h24.buys + h24.sells) === 0) return <span className="text-nova-subtle text-xs">—</span>;
  const total = h24.buys + h24.sells;
  const buyPct = (h24.buys / total) * 100;
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-14 h-1.5 rounded-full overflow-hidden bg-loss/30 relative">
        <div
          className="absolute inset-y-0 left-0 bg-gain rounded-full"
          style={{ width: `${buyPct}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-nova-subtle tabular-nums">{total.toLocaleString()}</span>
    </div>
  );
}

export const TokenRow = memo(function TokenRow({ pool, rank }: Props) {
  const navigate = useNavigate();
  const { isWatched, toggleWatchlist } = useStore();
  const watched = isWatched(pool.id);
  const prevPrice = useRef(pool.priceUsd);
  const [flashClass, setFlashClass] = useState('');

  useEffect(() => {
    if (prevPrice.current !== pool.priceUsd && prevPrice.current !== 0) {
      const cls = pool.priceUsd > prevPrice.current ? 'animate-flash-gain' : 'animate-flash-loss';
      setFlashClass(cls);
      const timer = setTimeout(() => setFlashClass(''), 650);
      prevPrice.current = pool.priceUsd;
      return () => clearTimeout(timer);
    }
    prevPrice.current = pool.priceUsd;
  }, [pool.priceUsd]);

  const goToToken = () => navigate(`/token/${pool.network}/${pool.address}`);

  return (
    <tr
      className={clsx(
        'group border-b border-nova-border/40 cursor-pointer transition-colors duration-100',
        'hover:bg-nova-elevated/60',
        flashClass,
      )}
      onClick={goToToken}
    >
      {/* Rank */}
      <td className="px-3 py-2 text-xs text-nova-subtle tabular-nums w-10 text-center">{rank}</td>

      {/* Token */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative shrink-0">
            <TokenImage src={pool.baseToken.imageUrl} symbol={pool.baseToken.symbol} size={28} />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border border-nova-card flex items-center justify-center"
              style={{ backgroundColor: '#11111c' }}>
              <TokenImage src={pool.quoteToken.imageUrl} symbol={pool.quoteToken.symbol} size={10} />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-nova-text truncate max-w-[80px]">
                {pool.baseToken.symbol}
              </span>
              <span className="text-nova-subtle text-xs shrink-0">/{pool.quoteToken.symbol}</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] text-nova-subtle font-mono">
                {shortenAddress(pool.address, 3)}
              </span>
            </div>
          </div>
        </div>
      </td>

      {/* Chain/DEX */}
      <td className="px-3 py-2">
        <div className="flex flex-col gap-0.5">
          <NetworkBadge networkId={pool.network} size="xs" />
          <span className="text-[10px] text-nova-subtle truncate max-w-[80px]">{pool.dexName}</span>
        </div>
      </td>

      {/* Price */}
      <td className="px-3 py-2 text-right">
        <span className="font-mono text-sm text-nova-text tabular-nums">{formatPrice(pool.priceUsd)}</span>
      </td>

      {/* 5m */}
      <td className="px-3 py-2 text-right">
        <PriceChange value={pool.priceChange.m5} size="xs" />
      </td>

      {/* 1h */}
      <td className="px-3 py-2 text-right">
        <PriceChange value={pool.priceChange.h1} size="xs" />
      </td>

      {/* 6h */}
      <td className="px-3 py-2 text-right">
        <PriceChange value={pool.priceChange.h6} size="xs" />
      </td>

      {/* 24h */}
      <td className="px-3 py-2 text-right">
        <PriceChange value={pool.priceChange.h24} size="xs" showIcon />
      </td>

      {/* Vol 24h */}
      <td className="px-3 py-2 text-right">
        <span className="font-mono text-xs text-nova-text tabular-nums">{formatCompact(pool.volume.h24)}</span>
      </td>

      {/* Liquidity */}
      <td className="px-3 py-2 text-right">
        <span className="font-mono text-xs text-nova-muted tabular-nums">{formatCompact(pool.liquidityUsd)}</span>
      </td>

      {/* FDV */}
      <td className="px-3 py-2 text-right">
        <span className="font-mono text-xs text-nova-subtle tabular-nums">
          {pool.fdvUsd ? formatCompact(pool.fdvUsd) : '—'}
        </span>
      </td>

      {/* Txns */}
      <td className="px-3 py-2">
        <TxRatio h24={pool.transactions.h24} />
      </td>

      {/* Momentum */}
      <td className="px-3 py-2">
        <MomentumBar score={pool.momentumScore} />
      </td>

      {/* Age */}
      <td className="px-3 py-2 text-xs text-nova-subtle whitespace-nowrap">
        {formatAge(pool.createdAt)}
      </td>

      {/* Actions */}
      <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); goToToken(); }}
            className="w-6 h-6 rounded border border-nova-border flex items-center justify-center text-nova-subtle hover:text-nova-accent hover:border-nova-accent/40 transition-colors"
            title="Open chart"
          >
            <BarChart2 size={11} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toggleWatchlist(pool.id); }}
            className={clsx(
              'w-6 h-6 rounded border flex items-center justify-center transition-colors',
              watched
                ? 'border-warn/40 text-warn bg-warn/10'
                : 'border-nova-border text-nova-subtle hover:text-warn hover:border-warn/40',
            )}
            title={watched ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <Star size={11} fill={watched ? 'currentColor' : 'none'} />
          </button>
          <a
            href={`https://etherscan.io/address/${pool.address}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="w-6 h-6 rounded border border-nova-border flex items-center justify-center text-nova-subtle hover:text-nova-muted transition-colors"
            title="View on explorer"
          >
            <ExternalLink size={11} />
          </a>
        </div>
      </td>
    </tr>
  );
});
