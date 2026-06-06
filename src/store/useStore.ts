import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NormalizedPool, SortField, SortDir } from '../types';

interface AppState {
  selectedNetwork: string;
  activeTab: 'top' | 'trending' | 'new';
  sortField: SortField;
  sortDir: SortDir;
  watchlist: string[];
  searchQuery: string;
  isSearchOpen: boolean;
  selectedPool: NormalizedPool | null;
  theme: 'dark' | 'light';
  chartType: 'candle' | 'line' | 'area';

  setNetwork: (network: string) => void;
  setTab: (tab: AppState['activeTab']) => void;
  setSort: (field: SortField, dir?: SortDir) => void;
  toggleWatchlist: (poolId: string) => void;
  isWatched: (poolId: string) => boolean;
  setSearchQuery: (q: string) => void;
  setSearchOpen: (open: boolean) => void;
  setSelectedPool: (pool: NormalizedPool | null) => void;
  toggleTheme: () => void;
  setChartType: (t: AppState['chartType']) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedNetwork: 'eth',
      activeTab: 'trending',
      sortField: 'volume_h24',
      sortDir: 'desc',
      watchlist: [],
      searchQuery: '',
      isSearchOpen: false,
      selectedPool: null,
      theme: 'dark',
      chartType: 'candle',

      setNetwork: (network) => set({ selectedNetwork: network }),
      setTab:     (tab)     => set({ activeTab: tab }),

      setSort: (field, dir) => set(s => ({
        sortField: field,
        sortDir: dir ?? (s.sortField === field ? (s.sortDir === 'desc' ? 'asc' : 'desc') : 'desc'),
      })),

      toggleWatchlist: (poolId) => set(s => ({
        watchlist: s.watchlist.includes(poolId)
          ? s.watchlist.filter(id => id !== poolId)
          : [poolId, ...s.watchlist],
      })),

      isWatched: (poolId) => get().watchlist.includes(poolId),

      setSearchQuery: (q) => set({ searchQuery: q }),
      setSearchOpen:  (open) => set({ isSearchOpen: open }),
      setSelectedPool: (pool) => set({ selectedPool: pool }),
      toggleTheme: () => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setChartType: (t) => set({ chartType: t }),
    }),
    {
      name: 'basescope-store',
      partialize: (s) => ({
        watchlist: s.watchlist,
        selectedNetwork: s.selectedNetwork,
        theme: s.theme,
        chartType: s.chartType,
      }),
    },
  ),
);
