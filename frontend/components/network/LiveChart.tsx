'use client';

import React from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import type { ChartPoint } from '@/lib/types';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card text-xs py-2 px-3 space-y-1">
      <p className="text-text-secondary font-mono">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-mono font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

interface Props {
  history: ChartPoint[];
  activeMetric: 'throughput' | 'latency' | 'load';
}

const METRICS = {
  throughput: { key: 'throughput', label: 'Throughput (Mbps)', color: '#00D4FF', domain: [0, 1200] },
  latency:    { key: 'latency',    label: 'Latency (ms)',       color: '#FFB800', domain: [0, 150]  },
  load:       { key: 'load',       label: 'Cell Load (%)',      color: '#00E5A0', domain: [0, 100]  },
};

export function LiveChart({ history, activeMetric }: Props) {
  const m = METRICS[activeMetric];

  if (history.length === 0) {
    return (
      <div className="card-glow h-full flex items-center justify-center">
        <p className="text-text-secondary text-sm">Waiting for data…</p>
      </div>
    );
  }

  return (
    <div className="card-glow h-full flex flex-col gap-2">
      <div className="flex items-center justify-between shrink-0">
        <span className="section-title">{m.label}</span>
        <span className="text-[10px] font-mono text-text-secondary">
          {history.length > 0 ? history[history.length - 1].time : ''}
        </span>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={m.color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={m.color} stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A3050" />
            <XAxis
              dataKey="time" tick={{ fill: '#7B9DB5', fontSize: 10 }}
              tickLine={false} axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={m.domain as [number, number]}
              tick={{ fill: '#7B9DB5', fontSize: 10 }}
              tickLine={false} axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={m.key}
              name={m.label}
              stroke={m.color}
              strokeWidth={2}
              fill={`url(#grad-${m.key})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
