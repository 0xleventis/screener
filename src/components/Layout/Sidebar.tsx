import { NavLink, useLocation } from 'react-router-dom';
import { TrendingUp, Zap, Star, LayoutDashboard, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../../store/useStore';
import { FEATURED_NETWORKS, getNetwork } from '../../utils/networks';

const NAV_ITEMS = [
  { to: '/',         label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/trending', label: 'Trending',   icon: TrendingUp },
  { to: '/new',      label: 'New Pairs',  icon: Zap },
  { to: '/watchlist',label: 'Watchlist',  icon: Star },
];

export function Sidebar() {
  const { selectedNetwork, setNetwork, watchlist } = useStore();
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-nova-border bg-nova-surface h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Base Scope" className="w-8 h-8 rounded-lg object-contain" />
          <div>
            <span className="text-base font-bold text-nova-text tracking-tight">Base</span>
            <span className="text-base font-bold text-nova-accent tracking-tight">Scope</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 flex-1">
        <p className="text-[10px] uppercase tracking-widest text-nova-subtle font-medium px-2 mb-2">Navigation</p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const isActive = to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to);
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  className={clsx(
                    'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-nova-accent/10 text-nova-accent border border-nova-accent/20'
                      : 'text-nova-muted hover:text-nova-text hover:bg-nova-elevated',
                  )}
                >
                  <Icon size={15} className="shrink-0" />
                  <span>{label}</span>
                  {label === 'Watchlist' && watchlist.length > 0 && (
                    <span className="ml-auto text-[10px] bg-nova-accent/20 text-nova-accent rounded-full px-1.5 py-0.5 font-mono">
                      {watchlist.length}
                    </span>
                  )}
                  {isActive && <ChevronRight size={12} className="ml-auto shrink-0" />}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* Networks */}
        <p className="text-[10px] uppercase tracking-widest text-nova-subtle font-medium px-2 mt-6 mb-2">Networks</p>
        <ul className="space-y-0.5">
          {FEATURED_NETWORKS.map(netId => {
            const net = getNetwork(netId);
            const isSelected = selectedNetwork === netId;
            return (
              <li key={netId}>
                <button
                  onClick={() => setNetwork(netId)}
                  className={clsx(
                    'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-all duration-150',
                    isSelected
                      ? 'text-nova-text'
                      : 'text-nova-muted hover:text-nova-text hover:bg-nova-elevated',
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: net.color, boxShadow: isSelected ? `0 0 6px ${net.color}` : 'none' }}
                  />
                  <span>{net.name}</span>
                  {isSelected && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-nova-accent" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-nova-border">
        <p className="text-[10px] text-nova-subtle text-center">
          Data via GeckoTerminal · Free &amp; Open
        </p>
      </div>
    </aside>
  );
}
