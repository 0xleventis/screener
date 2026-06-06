import { Component, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: { componentStack: string }) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    this.props.onError?.(error, info);
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border border-nova-border bg-nova-card text-center">
          <p className="text-sm text-nova-subtle">Something went wrong rendering this section.</p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1.5 text-xs text-nova-accent border border-nova-accent/30 rounded-lg px-3 py-1.5 hover:bg-nova-accent/10 transition-colors"
          >
            <RefreshCw size={11} /> Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
