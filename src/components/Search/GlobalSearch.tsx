import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, Hash, BookMarked } from 'lucide-react';
import clsx from 'clsx';
import { useSearch } from '../../hooks/useSearch';
import { useStore } from '../../store/useStore';
import { TokenImage } from '../common/TokenImage';
import { NetworkBadge } from '../common/NetworkBadge';
import { PriceChange } from '../common/PriceChange';
import { formatPrice, formatCompact } from '../../utils/format';

function useDebounce<T>(value: T, ms: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debouncedValue;
}

export function GlobalSearch() {
  const { setSearchOpen } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 280);

  const { data: results = [], isFetching } = useSearch(debouncedQuery);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => { setActiveIdx(0); }, [results]);

  const close = useCallback(() => setSearchOpen(false), [setSearchOpen]);

  const selectPool = useCallback((networkId: string, address: string) => {
    navigate(`/token/${networkId}/${address}`);
    close();
  }, [navigate, close]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && results[activeIdx]) {
        selectPool(results[activeIdx].network, results[activeIdx].address);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [results, activeIdx, close, selectPool]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-nova-bg/80 backdrop-blur-sm" />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl bg-nova-elevated border border-nova-border rounded-2xl shadow-nova-lg overflow-hidden animate-fade-up">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-nova-border">
          <Search size={16} className="text-nova-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search token name, symbol, or contract address…"
            className="flex-1 bg-transparent text-nova-text placeholder-nova-subtle text-sm outline-none"
          />
          {isFetching && (
            <span className="text-nova-subtle text-xs animate-pulse">Searching…</span>
          )}
          <button onClick={close} className="text-nova-subtle hover:text-nova-text">
            <X size={14} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim().length < 2 && (
            <div className="px-4 py-10 text-center text-nova-subtle text-sm">
              <Hash size={32} className="mx-auto mb-2 opacity-30" />
              Type at least 2 characters to search across all chains
            </div>
          )}

          {query.trim().length >= 2 && !isFetching && results.length === 0 && (
            <div className="px-4 py-10 text-center text-nova-subtle text-sm">
              No pools found for &ldquo;<span className="text-nova-muted">{query}</span>&rdquo;
            </div>
          )}

          {results.map((pool, idx) => (
            <button
              key={pool.id}
              onClick={() => selectPool(pool.network, pool.address)}
              onMouseEnter={() => setActiveIdx(idx)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100',
                idx === activeIdx ? 'bg-nova-accent/8' : 'hover:bg-nova-card',
                idx < results.length - 1 && 'border-b border-nova-border/50',
              )}
            >
              <TokenImage
                src={pool.baseToken.imageUrl}
                symbol={pool.baseToken.symbol}
                size={32}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-nova-text truncate">
                    {pool.baseToken.symbol}
                  </span>
                  {!pool.registryOnly && (
                    <>
                      <span className="text-xs text-nova-subtle">/</span>
                      <span className="text-xs text-nova-muted">{pool.quoteToken.symbol}</span>
                    </>
                  )}
                  <NetworkBadge networkId={pool.network} size="xs" />
                  {pool.registryOnly ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-nova-accent bg-nova-accent/10 border border-nova-accent/20 px-1.5 py-0.5 rounded font-medium">
                      <BookMarked size={9} /> Registry
                    </span>
                  ) : (
                    <span className="text-[10px] text-nova-subtle bg-nova-surface px-1.5 py-0.5 rounded">
                      {pool.dexName}
                    </span>
                  )}
                </div>
                <div className="text-xs text-nova-subtle truncate mt-0.5">
                  {pool.baseToken.name}
                  {pool.registry?.description && (
                    <span className="ml-1 opacity-70">· {pool.registry.description.slice(0, 60)}{pool.registry.description.length > 60 ? '…' : ''}</span>
                  )}
                  {!pool.registry?.description && (
                    <span className="ml-1">· {pool.address.slice(0, 10)}…</span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                {pool.registryOnly ? (
                  <div className="text-xs text-nova-subtle">No price data</div>
                ) : (
                  <>
                    <div className="text-sm font-mono text-nova-text">{formatPrice(pool.priceUsd)}</div>
                    <PriceChange value={pool.priceChange.h24} size="xs" />
                  </>
                )}
              </div>
              <ArrowRight size={14} className={clsx('shrink-0 transition-opacity', idx === activeIdx ? 'opacity-100 text-nova-accent' : 'opacity-0')} />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-nova-border flex items-center gap-4 text-[11px] text-nova-subtle">
          <span className="flex items-center gap-1"><kbd className="bg-nova-card px-1.5 rounded border border-nova-border">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="bg-nova-card px-1.5 rounded border border-nova-border">↵</kbd> open</span>
          <span className="flex items-center gap-1"><kbd className="bg-nova-card px-1.5 rounded border border-nova-border">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
