'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { CellData, NetworkSummary, ChartPoint } from '@/lib/types';
import { generateSnapshot, computeSummary, type CellMeta } from '@/lib/network';

const POLL_MS      = 5_000;
const MAX_HISTORY  = 30;

interface NetworkState {
  cells:     CellData[];
  summary:   NetworkSummary | null;
  history:   ChartPoint[];
  isLive:    boolean;
  lastTick:  number;
}

export function useNetworkPoll(cellIndex: Map<number, CellMeta>, ready: boolean) {
  const [state, setState] = useState<NetworkState>({
    cells: [], summary: null, history: [], isLive: false, lastTick: 0,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    if (cellIndex.size === 0) return;
    const now   = Date.now();
    const cells = generateSnapshot(cellIndex);
    const summ  = computeSummary(cells, now);
    const point: ChartPoint = {
      time:       new Date(now).toLocaleTimeString('en', { hour12: false }),
      throughput: summ.avg_throughput,
      latency:    summ.avg_latency,
      load:       summ.avg_load,
    };
    setState(prev => ({
      cells,
      summary: summ,
      history: [...prev.history.slice(-MAX_HISTORY + 1), point],
      isLive:  true,
      lastTick: now,
    }));
  }, [cellIndex]);

  // Auto-start when cellIndex is ready
  useEffect(() => {
    if (!ready || cellIndex.size === 0) return;

    // Immediate first tick
    tick();

    timerRef.current = setInterval(tick, POLL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [ready, cellIndex, tick]);

  return state;
}
