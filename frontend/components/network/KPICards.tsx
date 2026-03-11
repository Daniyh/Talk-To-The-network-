'use client';

import React from 'react';
import { Zap, Clock, Cpu, Wifi, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { NetworkSummary } from '@/lib/types';

interface Props { summary: NetworkSummary | null; }

function StatCard({
  icon: Icon, label, value, unit, color, sub,
}: {
  icon: React.ElementType; label: string; value: string; unit: string;
  color: string; sub?: string;
}) {
  return (
    <div className="card-glow flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between">
        <span className="section-title">{label}</span>
        <Icon size={14} className={color} />
      </div>
      <div>
        <span className="stat-value">{value}</span>
        <span className={`text-sm ml-1 ${color}`}>{unit}</span>
      </div>
      {sub && <p className="text-[11px] text-text-secondary leading-tight">{sub}</p>}
    </div>
  );
}

function HealthBar({ healthy, warning, critical, total }: {
  healthy: number; warning: number; critical: number; total: number;
}) {
  const h = total > 0 ? (healthy  / total) * 100 : 0;
  const w = total > 0 ? (warning  / total) * 100 : 0;
  const c = total > 0 ? (critical / total) * 100 : 0;
  return (
    <div className="card-glow flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="section-title">Cell Health Distribution</span>
        <span className="text-xs text-text-secondary font-mono">{total} total</span>
      </div>
      {/* Bar */}
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        <div style={{ width: `${h}%` }} className="bg-status-healthy transition-all duration-700" />
        <div style={{ width: `${w}%` }} className="bg-status-warning transition-all duration-700" />
        <div style={{ width: `${c}%` }} className="bg-status-critical transition-all duration-700" />
      </div>
      {/* Legend */}
      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-status-healthy">
          <CheckCircle size={11} /> {healthy} Healthy
        </span>
        <span className="flex items-center gap-1.5 text-status-warning">
          <AlertTriangle size={11} /> {warning} Warning
        </span>
        <span className="flex items-center gap-1.5 text-status-critical">
          <XCircle size={11} /> {critical} Critical
        </span>
      </div>
    </div>
  );
}

export function KPICards({ summary }: Props) {
  if (!summary) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card h-24 animate-pulse bg-bg-hover" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Zap} label="Avg Throughput"
          value={summary.avg_throughput.toLocaleString()}
          unit="Mbps"
          color="text-accent-cyan"
          sub="Network average"
        />
        <StatCard
          icon={Clock} label="Avg Latency"
          value={summary.avg_latency.toString()}
          unit="ms"
          color={summary.avg_latency < 50 ? 'text-status-healthy' : summary.avg_latency < 80 ? 'text-status-warning' : 'text-status-critical'}
          sub={summary.avg_latency < 50 ? 'Within target' : 'Above target'}
        />
        <StatCard
          icon={Cpu} label="Avg Cell Load"
          value={summary.avg_load.toString()}
          unit="%"
          color={summary.avg_load < 70 ? 'text-status-healthy' : summary.avg_load < 85 ? 'text-status-warning' : 'text-status-critical'}
          sub={summary.avg_load < 70 ? 'Normal load' : 'High load'}
        />
        <StatCard
          icon={Wifi} label="Active Cells"
          value={summary.total_cells.toString()}
          unit="cells"
          color="text-accent-blue"
          sub={`${summary.healthy_cells} healthy`}
        />
      </div>
      <HealthBar
        healthy={summary.healthy_cells}
        warning={summary.warning_cells}
        critical={summary.critical_cells}
        total={summary.total_cells}
      />
    </div>
  );
}
