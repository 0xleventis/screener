import { useState, useRef } from 'react';
import { Search, Moon, Sun, Bell, Menu, X } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../../store/useStore';
import { LiveIndicator } from '../common/LiveIndicator';
import { GlobalSearch } from '../Search/GlobalSearch';
import { FEATURED_NETWORKS, getNetwork } from '../../utils/networks';
import { NavLink } from 'react-router-dom';
import { TrendingUp, Zap, Star, LayoutDashboard } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',          label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/trending',  label: 'Trending',   icon: TrendingUp },
  { to: '/new',       label: 'New Pairs',  icon: Zap },
  { to: '/watchlist', label: 'Watchlist',  icon: Star },
];

export function Header() {
  const { theme, toggleTheme, setSearchOpen, isSearchOpen, selectedNetwork, setNetwork } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-nova-border bg-nova-surface/80 backdrop-blur-xl">
        <div className="flex items-center h-14 px-4 gap-3">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mr-2">
            <img src="/logo.png" alt="Base Scope" className="w-7 h-7 rounded-lg object-contain" />
            <span className="font-bold text-sm">
              <span className="text-nova-text">Base</span>
              <span className="text-nova-accent">Scope</span>
            </span>
          </div>

          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className={clsx(
              'flex items-center gap-2 flex-1 max-w-sm h-8 px-3 rounded-lg border transition-colors duration-150 text-sm',
              'bg-nova-elevated border-nova-border text-nova-subtle hover:border-nova-accent/40 hover:text-nova-muted',
            )}
          >
            <Search size={13} />
            <span className="hidden sm:inline">Search tokens, pairs, addresses…</span>
            <span className="sm:hidden">Search…</span>
            <kbd className="ml-auto hidden sm:inline-flex items-center gap-1 rounded border border-nova-border px-1.5 py-0.5 text-[10px] font-mono text-nova-subtle">
              ⌘K
            </kbd>
          </button>

          {/* Network pills */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setNetwork('all')}
              className={clsx(
                'text-xs px-2.5 py-1 rounded-full border transition-colors duration-150 whitespace-nowrap',
                selectedNetwork === 'all'
                  ? 'border-nova-accent/40 bg-nova-accent/10 text-nova-accent'
                  : 'border-nova-border text-nova-subtle hover:border-nova-border/60 hover:text-nova-muted',
              )}
            >
              All
            </button>
            {FEATURED_NETWORKS.slice(0, 5).map(netId => {
              const net = getNetwork(netId);
              const isSelected = selectedNetwork === netId;
              return (
                <button
                  key={netId}
                  onClick={() => setNetwork(netId)}
                  className={clsx(
                    'text-xs px-2.5 py-1 rounded-full border transition-colors duration-150 whitespace-nowrap',
                    isSelected
                      ? 'border-opacity-40 text-white'
                      : 'border-nova-border text-nova-subtle hover:text-nova-muted',
                  )}
                  style={isSelected ? {
                    borderColor: `${net.color}66`,
                    backgroundColor: net.bgColor,
                    color: net.color,
                  } : {}}
                >
                  {net.shortName}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <LiveIndicator className="hidden sm:flex" />
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg border border-nova-border bg-nova-elevated flex items-center justify-center text-nova-muted hover:text-nova-text transition-colors"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button className="w-8 h-8 rounded-lg border border-nova-border bg-nova-elevated flex items-center justify-center text-nova-muted hover:text-nova-text transition-colors">
              <Bell size={14} />
            </button>
            {/* Mobile menu toggle */}
            <button
              className="lg:hidden w-8 h-8 rounded-lg border border-nova-border bg-nova-elevated flex items-center justify-center text-nova-muted"
              onClick={() => setMobileMenuOpen(o => !o)}
            >
              {mobileMenuOpen ? <X size={14} /> : <Menu size={14} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-nova-border bg-nova-surface px-4 py-3 flex gap-1 flex-wrap">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-nova-accent/10 text-nova-accent'
                    : 'text-nova-muted hover:text-nova-text hover:bg-nova-elevated',
                )}
              >
                <Icon size={13} />
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* Global Search Modal */}
      {isSearchOpen && <GlobalSearch />}
    </>
  );
}
