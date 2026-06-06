import { formatDistanceToNowStrict } from 'date-fns';

export function formatPrice(value: number | string | null | undefined): string {
  const n = Number(value);
  if (!isFinite(n) || n === 0) return '$0.00';
  if (n >= 1_000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  if (n >= 1) return `$${n.toFixed(4)}`;
  if (n >= 0.01) return `$${n.toFixed(6)}`;

  const str = n.toFixed(20);
  const match = str.match(/^0\.(0+)([1-9]\d{0,5})/);
  if (match) {
    const zeros = match[1].length;
    const sig = match[2];
    if (zeros >= 4) {
      return `$0.0₀${subscript(zeros)}${sig}`;
    }
    return `$${n.toFixed(zeros + 4)}`;
  }
  return `$${n.toExponential(4)}`;
}

function subscript(n: number): string {
  return String(n).split('').map(d => '₀₁₂₃₄₅₆₇₈₉'[parseInt(d)]).join('');
}

export function formatCompact(value: number | string | null | undefined, prefix = '$'): string {
  const n = Number(value);
  if (!isFinite(n)) return `${prefix}—`;
  if (n >= 1e12) return `${prefix}${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `${prefix}${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `${prefix}${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3)  return `${prefix}${(n / 1e3).toFixed(2)}K`;
  return `${prefix}${n.toFixed(2)}`;
}

export function formatPercent(value: number | string | null | undefined): string {
  const n = Number(value);
  if (!isFinite(n)) return '—';
  const sign = n >= 0 ? '+' : '';
  if (Math.abs(n) >= 1000) return `${sign}${(n / 1000).toFixed(1)}K%`;
  return `${sign}${n.toFixed(2)}%`;
}

export function formatAge(date: Date | string | null | undefined): string {
  if (!date) return '—';
  try {
    return formatDistanceToNowStrict(new Date(date), { addSuffix: false });
  } catch {
    return '—';
  }
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

export function parseBigNumber(val: string | number | null | undefined): number {
  if (val === null || val === undefined || val === '') return 0;
  return parseFloat(String(val)) || 0;
}

export function calcMomentumScore(
  priceChangeH1: number,
  priceChangeH24: number,
  volH24: number,
  liquidityUsd: number,
  txH24: number,
): number {
  if (liquidityUsd <= 0) return 0;

  const volLiqRatio   = Math.min((volH24 / liquidityUsd) * 100, 100);
  const priceScore    = Math.min(Math.max(priceChangeH1 * 2, 0), 40);
  const momentumScore = Math.min(Math.max(priceChangeH24 * 0.5, 0), 20);
  const txScore       = Math.min((txH24 / 500) * 20, 20);

  return Math.min(Math.round(volLiqRatio * 0.2 + priceScore + momentumScore + txScore), 100);
}
