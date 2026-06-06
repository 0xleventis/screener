import { useMemo, useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, RefreshCw, AlertCircle, WifiOff, X } from 'lucide-react';
import clsx from 'clsx';
import type { NormalizedPool, SortField, SortDir } from '../../types';
import { TokenRow } from './TokenRow';
import { SkeletonRow } from '../common/Skeleton';
import { useStore } from '../../store/useStore';

interface Column {
  key: SortField | null;
  label: string;
  align?: 'left' | 'right' | 'center';
  hint?: string;
}

const COLUMNS: Column[] = [
  { key: null,          label: '#',         align: 'center' },
  { key: null,          label: 'Token',     align: 'left' },
  { key: null,          label: 'Chain/DEX', align: 'left' },
  { key: null,          label: 'Price',     align: 'right' },
  { key: null,          label: '5m',        align: 'right' },
  { key: null,          label: '1h',        align: 'right' },
  { key: null,          label: '6h',        align: 'right' },
  { key: 'price_change_h24', label: '24h', align: 'right' },
  { key: 'volume_h24',  label: 'Vol 24h',   align: 'right', hint: 'Volume over last 24 hours' },
  { key: 'liquidity',   label: 'Liquidity', align: 'right', hint: 'Total pool reserves in USD' },
  { key: 'fdv',         label: 'FDV',       align: 'right', hint: 'Fully Diluted Valuation' },
  { key: null,          label: 'Txns/Ratio',align: 'left' },
  { key: 'momentum',    label: 'Momentum',  align: 'left', hint: 'Base Scope proprietary momentum score (0–100)' },
  { key: 'created_at',  label: 'Age',       align: 'left' },
  { key: null,          label: '',          align: 'right' },
];

interface Props {
  pools: NormalizedPool[];
  isLoading: boolean;
  isError: boolean;
  onRefetch: () => void;
}

function SortIcon({ field, sortField, sortDir }: { field: SortField | null; sortField: SortField; sortDir: SortDir }) {
  if (!field) return null;
  if (sortField !== field) return <ChevronsUpDown size={11} className="opacity-30" />;
  return sortDir === 'desc' ? <ChevronDown size={11} className="text-nova-accent" /> : <ChevronUp size={11} className="text-nova-accent" />;
}

export function TokenTable({ pools, isLoading, isError, onRefetch }: Props) {
  const { sortField, sortDir, setSort } = useStore();
  const [page, setPage] = useState(1);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const PER_PAGE = 50;

  // Re-show the banner whenever a new error occurs
  useEffect(() => { if (isError) setErrorDismissed(false); }, [isError]);

  const sorted = useMemo(() => {
    if (!pools.length) return pools;
    return [...pools].sort((a, b) => {
      let av = 0, bv = 0;
      switch (sortField) {
        case 'volume_h24':      av = a.volume.h24;       bv = b.volume.h24;       break;
        case 'price_change_h24':av = a.priceChange.h24;  bv = b.priceChange.h24;  break;
        case 'price_change_h1': av = a.priceChange.h1;   bv = b.priceChange.h1;   break;
        case 'liquidity':       av = a.liquidityUsd;     bv = b.liquidityUsd;     break;
        case 'fdv':             av = a.fdvUsd ?? 0;      bv = b.fdvUsd ?? 0;      break;
        case 'created_at':      av = a.createdAt?.getTime() ?? 0; bv = b.createdAt?.getTime() ?? 0; break;
        case 'momentum':        av = a.momentumScore;    bv = b.momentumScore;    break;
        default:                av = a.volume.h24;       bv = b.volume.h24;
      }
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [pools, sortField, sortDir]);

  const paged = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(sorted.length / PER_PAGE);

  const showEmptyError = isError && pools.length === 0;
  const showBanner     = isError && pools.length > 0 && !errorDismissed;

  if (showEmptyError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <WifiOff size={32} className="text-nova-subtle opacity-60" />
        <p className="text-nova-muted text-sm">Could not reach the API — retrying automatically.</p>
        <p className="text-nova-subtle text-xs">This usually clears within a few seconds (rate limit or brief outage).</p>
        <button
          onClick={onRefetch}
          className="flex items-center gap-2 text-xs text-nova-accent border border-nova-accent/30 rounded-lg px-3 py-1.5 hover:bg-nova-accent/10 transition-colors"
        >
          <RefreshCw size={12} /> Retry now
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Stale-data banner — only shown when we have rows but the last refresh failed */}
      {showBanner && (
        <div className="flex items-center gap-2 px-4 py-2 bg-warn/8 border-b border-warn/20 text-xs text-warn/90">
          <AlertCircle size={12} className="shrink-0" />
          <span className="flex-1">
            Refresh failed (rate limit or brief outage) — showing last known data. Retrying automatically.
          </span>
          <button onClick={onRefetch} className="flex items-center gap-1 hover:text-warn transition-colors">
            <RefreshCw size={11} /> Retry
          </button>
          <button onClick={() => setErrorDismissed(true)} className="ml-1 hover:text-warn transition-colors">
            <X size={11} />
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left border-collapse">
          <thead>
            <tr className="border-b border-nova-border">
              {COLUMNS.map((col, i) => (
                <th
                  key={i}
                  className={clsx(
                    'px-3 py-2.5 text-[11px] font-medium uppercase tracking-wider text-nova-subtle whitespace-nowrap select-none',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.key && 'cursor-pointer hover:text-nova-muted transition-colors',
                  )}
                  title={col.hint}
                  onClick={() => col.key && setSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.align === 'right' && col.key && (
                      <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />
                    )}
                    {col.label}
                    {col.align !== 'right' && col.key && (
                      <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 20 }).map((_, i) => <SkeletonRow key={i} cols={COLUMNS.length} />)
              : paged.map((pool, i) => (
                  <TokenRow
                    key={pool.id}
                    pool={pool}
                    rank={(page - 1) * PER_PAGE + i + 1}
                  />
                ))
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-nova-border">
          <span className="text-xs text-nova-subtle">
            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, sorted.length)} of {sorted.length} pairs
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-2.5 py-1 text-xs rounded border border-nova-border text-nova-muted hover:text-nova-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={clsx(
                    'w-7 h-7 text-xs rounded border transition-colors',
                    p === page
                      ? 'bg-nova-accent/15 border-nova-accent/30 text-nova-accent'
                      : 'border-nova-border text-nova-muted hover:text-nova-text',
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-2.5 py-1 text-xs rounded border border-nova-border text-nova-muted hover:text-nova-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
