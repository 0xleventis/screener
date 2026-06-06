import clsx from 'clsx';

interface Props {
  className?: string;
  label?: string;
}

export function LiveIndicator({ className, label = 'LIVE' }: Props) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-xs font-medium', className)}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gain opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-gain" />
      </span>
      <span className="text-gain animate-glow-pulse">{label}</span>
    </span>
  );
}
