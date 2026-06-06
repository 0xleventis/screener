import { useState } from 'react';
import clsx from 'clsx';

interface Props {
  src?: string | null;
  symbol: string;
  size?: number;
  className?: string;
}

function colorFromSymbol(symbol: string): string {
  const colors = ['#627eea','#f0b90b','#8247e5','#28a0f0','#00e5b4','#ff6b6b','#ffd166','#7c63ff','#00d98f','#ff4560'];
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function TokenImage({ src, symbol, size = 28, className }: Props) {
  const [imgError, setImgError] = useState(false);
  const bg = colorFromSymbol(symbol);
  const letter = symbol.slice(0, 2).toUpperCase();

  if (!src || imgError) {
    return (
      <span
        className={clsx('flex-shrink-0 rounded-full flex items-center justify-center font-bold text-white', className)}
        style={{ width: size, height: size, background: `radial-gradient(circle at 30% 30%, ${bg}cc, ${bg}44)`, fontSize: size * 0.35, boxShadow: `0 0 8px ${bg}40` }}
      >
        {letter}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={symbol}
      width={size}
      height={size}
      className={clsx('rounded-full flex-shrink-0 object-cover', className)}
      style={{ width: size, height: size }}
      onError={() => setImgError(true)}
    />
  );
}
