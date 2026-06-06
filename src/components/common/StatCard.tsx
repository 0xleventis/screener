import clsx from 'clsx';
import { Skeleton } from './Skeleton';

interface Props {
  label: string;
  value: string;
  sub?: string;
  change?: number;
  icon?: React.ReactNode;
  accentColor?: string;
  isLoading?: boolean;
  className?: string;
}

export function StatCard({ label, value, sub, change, icon, accentColor, isLoading, className }: Props) {
  const isPositive = (change ?? 0) >= 0;

  return (
    <div className={clsx(
      'relative rounded-xl border border-nova-border bg-nova-card p-4 overflow-hidden',
      'bg-card-shine hover:border-nova-accent/20 transition-colors duration-200',
      className,
    )}>
      {accentColor && (
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
        />
      )}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-nova-subtle uppercase tracking-wider mb-1">{label}</p>
          {isLoading ? (
            <Skeleton className="w-24" height="h-6" />
          ) : (
            <p className="text-xl font-semibold text-nova-text font-mono tabular-nums">{value}</p>
          )}
          {sub && !isLoading && (
            <p className="text-xs text-nova-muted mt-0.5">{sub}</p>
          )}
        </div>
        {icon && (
          <div className="ml-3 flex-shrink-0 text-nova-muted">{icon}</div>
        )}
      </div>
      {change !== undefined && !isLoading && (
        <div className={clsx(
          'mt-2 text-xs font-mono',
          isPositive ? 'text-gain' : 'text-loss',
        )}>
          {isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
        </div>
      )}
    </div>
  );
}
