import clsx from 'clsx';
import { getNetwork } from '../../utils/networks';

interface Props {
  networkId: string;
  size?: 'xs' | 'sm' | 'md';
  showName?: boolean;
  className?: string;
}

export function NetworkBadge({ networkId, size = 'sm', showName = false, className }: Props) {
  const net = getNetwork(networkId);

  const sizeClass = {
    xs: 'text-[10px] px-1 py-0.5 gap-0.5',
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1',
  }[size];

  return (
    <span
      className={clsx('inline-flex items-center rounded font-medium', sizeClass, className)}
      style={{ color: net.color, backgroundColor: net.bgColor }}
    >
      <span style={{ fontSize: size === 'xs' ? 8 : 10 }}>{net.icon}</span>
      {showName ? net.name : net.shortName}
    </span>
  );
}
