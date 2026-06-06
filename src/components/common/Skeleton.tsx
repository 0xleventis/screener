import clsx from 'clsx';

interface Props {
  className?: string;
  rows?: number;
  height?: string;
}

export function Skeleton({ className, height = 'h-4' }: Props) {
  return (
    <div
      className={clsx(
        'rounded bg-nova-elevated animate-pulse',
        height,
        className,
      )}
      style={{ backgroundImage: 'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.04) 50%, transparent 75%)', backgroundSize: '200% 100%' }}
    />
  );
}

export function SkeletonRow({ cols = 10 }: { cols?: number }) {
  const widths = ['w-8', 'w-28', 'w-20', 'w-20', 'w-14', 'w-14', 'w-14', 'w-16', 'w-16', 'w-12'];
  return (
    <tr className="border-b border-nova-border/50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 py-2.5">
          <Skeleton className={widths[i % widths.length]} height="h-3.5" />
        </td>
      ))}
    </tr>
  );
}
