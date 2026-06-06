import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import clsx from 'clsx';
import { useOHLCV } from '../../hooks/useOHLCV';
import { Skeleton } from '../common/Skeleton';
import { formatPrice, formatCompact } from '../../utils/format';
import type { Timeframe, ChartType } from '../../types';
import { useStore } from '../../store/useStore';
import { BarChart2, TrendingUp, Activity, RefreshCw } from 'lucide-react';

const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: '1m',  value: 'm1' },
  { label: '5m',  value: 'm5' },
  { label: '15m', value: 'm15' },
  { label: '30m', value: 'm30' },
  { label: '1H',  value: 'h1' },
  { label: '4H',  value: 'h4' },
  { label: '1D',  value: 'h24' },
  { label: '1W',  value: 'd7' },
];

interface TooltipData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
}

interface Props {
  network: string;
  address: string;
  baseSymbol: string;
  quoteSymbol: string;
  currentPrice: number;
}

export function PriceChart({ network, address, baseSymbol, quoteSymbol, currentPrice }: Props) {
  const { chartType, setChartType } = useStore();
  const [timeframe, setTimeframe] = useState<Timeframe>('h1');
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | ISeriesApi<'Area'> | null>(null);
  const volSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const { data: candles, isLoading, isError, refetch } = useOHLCV(network, address, timeframe);

  const buildChart = useCallback(() => {
    if (!containerRef.current) return;

    // Destroy previous instance safely — calling remove() twice on a
    // LightweightCharts instance throws, so null the ref immediately after.
    if (chartRef.current) {
      try { chartRef.current.remove(); } catch { /* already disposed */ }
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9090b0',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(30,30,50,0.8)' },
        horzLines: { color: 'rgba(30,30,50,0.8)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#00e5b440', width: 1, style: 3 },
        horzLine: { color: '#00e5b440', width: 1, style: 3 },
      },
      rightPriceScale: {
        borderColor: 'rgba(30,30,50,0.8)',
        scaleMargins: { top: 0.08, bottom: 0.25 },
      },
      timeScale: {
        borderColor: 'rgba(30,30,50,0.8)',
        timeVisible: true,
        secondsVisible: false,
      },
      width:  containerRef.current.clientWidth,
      height: 380,
    });

    let priceSeries: typeof seriesRef.current;

    if (chartType === 'candle') {
      priceSeries = chart.addCandlestickSeries({
        upColor:         '#00d98f',
        downColor:       '#ff4560',
        borderUpColor:   '#00d98f',
        borderDownColor: '#ff4560',
        wickUpColor:     '#00d98f',
        wickDownColor:   '#ff4560',
      });
    } else if (chartType === 'line') {
      priceSeries = chart.addLineSeries({
        color: '#00e5b4',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: '#00e5b4',
        crosshairMarkerBackgroundColor: '#00e5b4',
      });
    } else {
      priceSeries = chart.addAreaSeries({
        lineColor: '#00e5b4',
        topColor:  'rgba(0,229,180,0.25)',
        bottomColor: 'rgba(0,229,180,0.01)',
        lineWidth: 2,
      });
    }

    const volSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 },
    });

    seriesRef.current = priceSeries;
    volSeriesRef.current = volSeries;
    chartRef.current = chart;

    chart.subscribeCrosshairMove(param => {
      if (!param.time || !param.seriesData) { setTooltip(null); return; }
      const priceData = param.seriesData.get(priceSeries as ISeriesApi<'Line'>);
      if (!priceData) { setTooltip(null); return; }

      let o: number, h: number, l: number, c: number;
      if (chartType === 'candle' && typeof priceData === 'object' && 'open' in priceData) {
        const cd = priceData as { open: number; high: number; low: number; close: number };
        o = cd.open; h = cd.high; l = cd.low; c = cd.close;
      } else {
        const v = typeof priceData === 'object' && 'value' in priceData ? (priceData as { value: number }).value : 0;
        o = v; h = v; l = v; c = v;
      }

      const volData = param.seriesData.get(volSeries);
      const vol = volData && typeof volData === 'object' && 'value' in volData ? (volData as { value: number }).value : 0;
      const change = o > 0 ? ((c - o) / o) * 100 : 0;

      const ts = typeof param.time === 'number' ? param.time * 1000 : Date.now();
      setTooltip({
        time: new Date(ts).toLocaleString(),
        open: o, high: h, low: l, close: c, volume: vol, change,
      });
    });

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      try { chart.remove(); } catch { /* already disposed */ }
      chartRef.current = null;
    };
  }, [chartType]);

  useEffect(() => { return buildChart(); }, [buildChart]);

  useEffect(() => {
    if (!candles || !seriesRef.current || !volSeriesRef.current || candles.length === 0) return;

    if (chartType === 'candle' && seriesRef.current.seriesType() === 'Candlestick') {
      (seriesRef.current as ISeriesApi<'Candlestick'>).setData(
        candles.map(c => ({ time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close })),
      );
    } else if (chartType !== 'candle') {
      (seriesRef.current as ISeriesApi<'Line'>).setData(
        candles.map(c => ({ time: c.time as UTCTimestamp, value: c.close })),
      );
    }

    volSeriesRef.current.setData(
      candles.map(c => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(0,217,143,0.4)' : 'rgba(255,69,96,0.4)',
      })),
    );

    chartRef.current?.timeScale().fitContent();
  }, [candles, chartType]);

  const lastCandle = candles && candles.length > 0 ? candles[candles.length - 1] : null;
  const displayChange = lastCandle
    ? ((lastCandle.close - (candles?.[0]?.open ?? lastCandle.close)) / (candles?.[0]?.open ?? 1)) * 100
    : 0;

  return (
    <div className="rounded-xl border border-nova-border bg-nova-card overflow-hidden">
      {/* Chart header */}
      <div className="flex items-start justify-between px-4 pt-3 pb-2 border-b border-nova-border/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold font-mono text-nova-text">{formatPrice(currentPrice)}</span>
            <span className={clsx('text-sm font-mono', displayChange >= 0 ? 'text-gain' : 'text-loss')}>
              {displayChange >= 0 ? '+' : ''}{displayChange.toFixed(2)}%
            </span>
          </div>
          <div className="text-xs text-nova-subtle mt-0.5">
            {baseSymbol} / {quoteSymbol}
            {tooltip && (
              <span className="ml-3 text-nova-muted">
                O: {formatPrice(tooltip.open)} H: {formatPrice(tooltip.high)} L: {formatPrice(tooltip.low)} C: {formatPrice(tooltip.close)}
                <span className="ml-2">Vol: {formatCompact(tooltip.volume)}</span>
                <span className={clsx('ml-2', tooltip.change >= 0 ? 'text-gain' : 'text-loss')}>
                  {tooltip.change >= 0 ? '+' : ''}{tooltip.change.toFixed(2)}%
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Chart type */}
          <div className="flex items-center bg-nova-elevated rounded-lg border border-nova-border p-0.5">
            {([['candle', BarChart2], ['line', TrendingUp], ['area', Activity]] as const).map(([type, Icon]) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={clsx(
                  'w-7 h-7 rounded flex items-center justify-center transition-colors',
                  chartType === type
                    ? 'bg-nova-accent/15 text-nova-accent'
                    : 'text-nova-subtle hover:text-nova-muted',
                )}
              >
                <Icon size={13} />
              </button>
            ))}
          </div>

          <button
            onClick={() => refetch()}
            className="w-7 h-7 rounded border border-nova-border bg-nova-elevated flex items-center justify-center text-nova-subtle hover:text-nova-muted transition-colors"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Timeframe bar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-nova-border/30">
        {TIMEFRAMES.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setTimeframe(value)}
            className={clsx(
              'px-2.5 py-1 text-xs rounded font-medium transition-colors duration-100',
              timeframe === value
                ? 'bg-nova-accent/15 text-nova-accent'
                : 'text-nova-subtle hover:text-nova-muted hover:bg-nova-elevated',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Chart area */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-nova-card z-10">
            <div className="space-y-2 w-full px-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="w-full" height="h-px" />
              ))}
              <div className="text-center text-nova-subtle text-xs pt-4 animate-pulse">Loading chart data…</div>
            </div>
          </div>
        )}
        {isError && (
          <div className="h-96 flex flex-col items-center justify-center text-nova-subtle gap-2">
            <p>Failed to load chart data</p>
            <button onClick={() => refetch()} className="text-xs text-nova-accent hover:underline">Retry</button>
          </div>
        )}
        <div ref={containerRef} className="w-full" style={{ height: 380 }} />
      </div>
    </div>
  );
}
