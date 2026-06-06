import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { HomePage } from './pages/Home';
import { TokenPage } from './pages/Token';
import { TrendingPage } from './pages/Trending';
import { NewPairsPage } from './pages/NewPairs';
import { WatchlistPage } from './pages/Watchlist';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useStore } from './store/useStore';

export default function App() {
  const { theme, setSearchOpen } = useStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [setSearchOpen]);

  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/trending" element={<TrendingPage />} />
          <Route path="/new" element={<NewPairsPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/token/:network/:address" element={<TokenPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
