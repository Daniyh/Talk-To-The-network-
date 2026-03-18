'use client';

import React, { useState } from 'react';
import { RefreshCw, TrendingUp, Timer, Cpu } from 'lucide-react';
import { useDataset } from '@/hooks/useDataset';
import { useNetworkPoll } from '@/hooks/useNetworkPoll';
import { KPICards } from '@/components/network/KPICards';
import { NetworkTopology } from '@/components/network/NetworkTopology';
import { LiveChart } from '@/components/network/LiveChart';

type Metric = 'throughput' | 'latency' | 'load';

const METRIC_TABS: { key: Metric; label: string; icon: React.ElementType }[] = [
  { key: 'throughput', label: 'Throughput', icon: TrendingUp },
  { key: 'latency',    label: 'Latency',    icon: Timer       },
  { key: 'load',       label: 'Cell Load',  icon: Cpu         },
];

export default function NetworkMonitorPage() {
  const { cellIndex, loading, error } = useDataset();
  const ready = cellIndex.size > 0;
  const { cells, summary, history, isLive, lastTick } = useNetworkPoll(cellIndex, ready);
  const [activeMetric, setActiveMetric] = useState<Metric>('throughput');

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="card border-status-critical/40 text-center max-w-sm">
          <p className="text-status-critical font-semibold mb-2">Dataset Error</p>
          <p className="text-text-secondary text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ── Page header ────────────────────────────────────────────────────── */}
      <header className="shrink-0 px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Network Monitor</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Agentic AI 5G_Advanced Network optimization
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isLive ? (
            <div className="flex items-center gap-2 text-xs text-status-healthy">
              <span className="live-dot" />
              <span className="font-medium">Live</span>
              <span className="text-text-muted font-mono">
                {lastTick > 0 ? new Date(lastTick).toLocaleTimeString('en', { hour12: false }) : ''}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <RefreshCw size={12} className="animate-spin" />
              <span>Connecting…</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-6 space-y-4 h-full flex flex-col">

          {/* KPI summary row */}
          <div className="shrink-0">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="card h-24 animate-pulse bg-bg-hover" />
                ))}
              </div>
            ) : (
              <KPICards summary={summary} />
            )}
          </div>

          {/* Topology + Chart row */}
          <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-5 gap-4">

            {/* Topology (takes 3/5 width) */}
            <div className="xl:col-span-3 min-h-[420px]">
              <NetworkTopology cells={cells} />
            </div>

            {/* Chart (takes 2/5 width) */}
            <div className="xl:col-span-2 flex flex-col gap-3">
              {/* Metric selector */}
              <div className="flex gap-1 p-1 bg-bg-secondary rounded-lg border border-border">
                {METRIC_TABS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveMetric(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2
                      rounded-md text-xs font-medium transition-all duration-150
                      ${activeMetric === key
                        ? 'bg-bg-card text-accent-cyan shadow-sm border border-border'
                        : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    <Icon size={11} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Chart */}
              <div className="flex-1 min-h-[300px]">
                <LiveChart history={history} activeMetric={activeMetric} />
              </div>

              {/* Cell type breakdown */}
              {cells.length > 0 && (
                <div className="card shrink-0">
                  <p className="section-title mb-3">Cell Type Distribution</p>
                  <div className="space-y-2">
                    {(['Macro', 'Micro', 'Pico', 'Femto'] as const).map(type => {
                      const typeCells = cells.filter(c => c.cell_type === type);
                      const pct = cells.length > 0 ? (typeCells.length / cells.length) * 100 : 0;
                      const healthy = typeCells.filter(c => c.health === 'healthy').length;
                      return (
                        <div key={type} className="flex items-center gap-3">
                          <span className="text-xs text-text-secondary w-10">{type}</span>
                          <div className="flex-1 h-1.5 bg-bg-hover rounded-full overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className="h-full bg-accent-cyan/60 transition-all duration-700"
                            />
                          </div>
                          <span className="text-xs font-mono text-text-secondary w-16 text-right">
                            {typeCells.length} ({healthy}✓)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
