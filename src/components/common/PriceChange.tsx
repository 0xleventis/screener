import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatPercent } from '../../utils/format';
import clsx from 'clsx';

interface Props {
  value: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const sizeMap = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg font-semibold',
};

export function PriceChange({ value, size = 'sm', showIcon = false, className }: Props) {
  const isZero = Math.abs(value) < 0.005;
  const isGain = value > 0;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-0.5 font-mono tabular-nums',
        sizeMap[size],
        isZero  ? 'text-nova-subtle' :
        isGain  ? 'text-gain'        :
                  'text-loss',
        className,
      )}
    >
      {showIcon && (
        isZero ? <Minus size={12} />       :
        isGain ? <TrendingUp size={12} />  :
                 <TrendingDown size={12} />
      )}
      {formatPercent(value)}
    </span>
  );
}
