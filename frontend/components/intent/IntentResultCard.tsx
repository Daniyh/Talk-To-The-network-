'use client';

import React, { useMemo } from 'react';
import {
  CheckCircle, AlertTriangle, TrendingUp, TrendingDown,
  Activity, Users, Cpu, Building2, Home, Radio,
  Layers, Wifi, Zap, Shield, ArrowRight,
} from 'lucide-react';
import { useDataset } from '@/hooks/useDataset';
import { generateSnapshot } from '@/lib/network';
import { NetworkTopology } from '@/components/network/NetworkTopology';
import type { IntentResult } from '@/lib/types';

// ── Intent type display config ────────────────────────────────────────────────
const INTENT_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  emergency:           { label: 'Emergency',         icon: Shield,    color: '#FF4444' },
  stadium_event:       { label: 'Stadium Event',     icon: Users,     color: '#00D4FF' },
  iot_deployment:      { label: 'IoT Deployment',    icon: Radio,     color: '#00E5A0' },
  industrial_iot:      { label: 'Industrial IoT',    icon: Cpu,       color: '#FFB800' },
  video_streaming:     { label: 'Video Streaming',   icon: Activity,  color: '#0066FF' },
  smart_city:          { label: 'Smart City',        icon: Building2, color: '#00D4FF' },
  voice_priority:      { label: 'Voice Priority',    icon: Wifi,      color: '#00E5A0' },
  general_optimization:{ label: 'General Optimization', icon: Zap,   color: '#7B9DB5' },
  residential:         { label: 'Residential',       icon: Home,      color: '#7B9DB5' },
};

const LOCATION_LABEL: Record<string, string> = {
  hospital:    'Hospital Zone',
  stadium:     'Stadium Zone',
  factory:     'Factory Zone',
  downtown:    'Downtown Zone',
  residential: 'Residential Zone',
};

// ── KPI metric config ─────────────────────────────────────────────────────────
const KPI_METRICS = [
  { key: 'throughput_mbps',     label: 'Throughput',   unit: 'Mbps', higherBetter: true  },
  { key: 'latency_ms',          label: 'Latency',      unit: 'ms',   higherBetter: false },
  { key: 'packet_loss_percent', label: 'Packet Loss',  unit: '%',    higherBetter: false },
  { key: 'cell_load_percent',   label: 'Cell Load',    unit: '%',    higherBetter: false },
] as const;

// ── Sub-components ────────────────────────────────────────────────────────────

function KPICard({
  label, unit, before, after, improved,
}: {
  label: string; unit: string;
  before: number; after: number; improved: boolean;
}) {
  const change = before !== 0 ? Math.abs(((after - before) / before) * 100) : 0;
  const Icon   = improved ? TrendingDown : TrendingUp;
  const color  = improved ? '#00E5A0' : '#FF4444';
  const sign   = after > before ? '+' : '−';

  return (
    <div className="card flex flex-col gap-2">
      <p className="text-xs text-text-secondary">{label}</p>
      <div className="flex items-end gap-2">
        <span className="font-mono text-lg font-semibold text-text-primary">
          {before.toFixed(1)}
        </span>
        <ArrowRight size={14} className="text-text-muted mb-1 shrink-0" />
        <span className="font-mono text-lg font-semibold" style={{ color }}>
          {after.toFixed(1)}
        </span>
        <span className="text-xs text-text-secondary mb-0.5">{unit}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Icon size={11} style={{ color }} />
        <span className="text-xs font-medium font-mono" style={{ color }}>
          {sign}{change.toFixed(1)}%
        </span>
        <span className="text-[10px] text-text-muted">
          {improved ? 'improved' : 'degraded'}
        </span>
      </div>
    </div>
  );
}

function PipelineStep({
  step, title, summary, done,
}: {
  step: number; title: string; summary: string; done: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 flex flex-col items-center">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{
            background: done ? '#00E5A0' : '#1A3050',
            color: done ? '#050B18' : '#7B9DB5',
            border: `1.5px solid ${done ? '#00E5A0' : '#1A3050'}`,
          }}
        >
          {done ? <CheckCircle size={13} /> : step}
        </div>
        {step < 4 && <div className="w-px flex-1 bg-border mt-1" style={{ minHeight: 16 }} />}
      </div>
      <div className="pb-3">
        <p className="text-xs font-semibold text-text-primary">{title}</p>
        <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">{summary}</p>
      </div>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-1.5 pr-4 text-[11px] text-text-secondary whitespace-nowrap">{label}</td>
      <td className="py-1.5 text-[11px] font-mono font-medium text-text-primary">{value}</td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function IntentResultCard({
  result, warning,
}: {
  result: IntentResult;
  warning?: string;
}) {
  const r          = result.result;
  const intent     = r.intent     as Record<string, any> | undefined;
  const config     = r.config     as Record<string, any> | undefined;
  const monitor    = r.monitor    as Record<string, any> | undefined;
  const optim      = r.optimization as Record<string, any> | undefined;
  const isFallback = !!r.fallback;

  const { cellIndex } = useDataset();
  const cells = useMemo(
    () => cellIndex.size > 0 ? generateSnapshot(cellIndex) : [],
    [cellIndex],
  );

  // ── Derived values ──────────────────────────────────────────────────────
  const intentType  = intent?.intent_type ?? 'general_optimization';
  const sliceType   = intent?.slice_type  ?? '—';
  const confidence  = intent?.confidence  ?? 0;
  const locationTag = (monitor?.metrics as any)?.location_tag ?? '';
  const locationRaw = (intent?.entities as any)?.location_hint ?? '';
  const meta        = INTENT_META[intentType] ?? INTENT_META.general_optimization;
  const MetaIcon    = meta.icon;

  const monitorMetrics = monitor?.metrics as Record<string, number> | undefined;
  const monitoredCellId = monitorMetrics?.cell_id;
  const healthScore     = monitor?.health_score as number | undefined;
  const healthStatus    = monitor?.overall_status as string | undefined;

  const execBefore  = (optim?.execution_details as any)?.before   as Record<string, number> | undefined;
  const execAfter   = (optim?.execution_details as any)?.after    as Record<string, number> | undefined;
  const improvements = (optim?.execution_details as any)?.improvements as Record<string, any> | undefined;

  const slice    = (config?.network_slice    as Record<string, any>) ?? {};
  const qos      = (config?.qos_parameters   as Record<string, any>) ?? {};
  const ranConf  = (config?.ran_configuration as Record<string, any>) ?? {};

  const affectedCount = locationTag
    ? cells.filter(c => c.location_tag === locationTag).length
    : 0;

  const STATUS_BG: Record<string, string> = {
    healthy: '#00E5A020', warning: '#FFB80020', critical: '#FF444420',
  };
  const STATUS_COLOR: Record<string, string> = {
    healthy: '#00E5A0', warning: '#FFB800', critical: '#FF4444',
  };

  return (
    <div className="card-glow space-y-5 animate-fade-in">

      {/* ── Warning banner ── */}
      {warning && (
        <div className="flex items-start gap-2 text-xs text-status-warning
                        bg-status-warning/10 border border-status-warning/30 rounded-lg p-2.5">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
          <span>{warning}</span>
        </div>
      )}

      {/* ── Intent summary banner ── */}
      <div
        className="rounded-xl p-4 border"
        style={{
          background: `${meta.color}10`,
          borderColor: `${meta.color}30`,
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${meta.color}20`, border: `1.5px solid ${meta.color}40` }}
            >
              <MetaIcon size={18} style={{ color: meta.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-text-primary">{meta.label}</span>
                <span
                  className="badge text-[10px] font-mono"
                  style={{ background: `${meta.color}20`, color: meta.color }}
                >
                  {sliceType}
                </span>
                {isFallback && (
                  <span className="badge badge-warning text-[10px]">Fallback mode</span>
                )}
              </div>
              {locationRaw && (
                <p className="text-xs text-text-secondary mt-0.5">{locationRaw}</p>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-text-secondary">Confidence</p>
            <p className="text-lg font-bold font-mono" style={{ color: meta.color }}>
              {Math.round(confidence * 100)}%
            </p>
          </div>
        </div>

        {/* Metadata row */}
        <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t" style={{ borderColor: `${meta.color}20` }}>
          {locationTag && (
            <div>
              <p className="text-[10px] text-text-muted">Zone</p>
              <p className="text-xs font-medium text-text-primary capitalize">
                {LOCATION_LABEL[locationTag] ?? locationTag}
              </p>
            </div>
          )}
          {affectedCount > 0 && (
            <div>
              <p className="text-[10px] text-text-muted">Affected Cells</p>
              <p className="text-xs font-medium text-text-primary">{affectedCount} cells</p>
            </div>
          )}
          {healthScore !== undefined && (
            <div>
              <p className="text-[10px] text-text-muted">Health Score</p>
              <p
                className="text-xs font-bold font-mono"
                style={{ color: STATUS_COLOR[healthStatus ?? 'healthy'] }}
              >
                {healthScore}/100
                <span className="font-normal text-[10px] ml-1 capitalize">{healthStatus}</span>
              </p>
            </div>
          )}
          {optim?.action && (
            <div>
              <p className="text-[10px] text-text-muted">Action</p>
              <p className="text-xs font-medium text-accent-cyan font-mono">{optim.action as string}</p>
            </div>
          )}
          {slice.type && (
            <div>
              <p className="text-[10px] text-text-muted">3GPP</p>
              <p className="text-xs font-medium text-text-primary">{config?.['3gpp_release'] as string ?? '—'}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Agent pipeline ── */}
      <div className="card">
        <p className="section-title mb-3">Agent Pipeline</p>
        <div>
          <PipelineStep step={1} title="Intent Parser" done={!!intent?.llm_powered}
            summary={intent ? `${meta.label} detected · ${sliceType} slice · priority: ${(intent.entities as any)?.priority ?? '—'}` : 'Parsing intent…'} />
          <PipelineStep step={2} title="RAN Planner" done={!!config?.generated_by}
            summary={config ? `5QI=${qos['5qi'] ?? '—'} · μ${ranConf.numerology ?? '—'} · ${ranConf.mimo_layers ?? '—'} MIMO · ${slice.allocated_bandwidth_mbps ?? '—'} Mbps` : 'Generating config…'} />
          <PipelineStep step={3} title="Network Monitor" done={!!monitor?.monitored_by}
            summary={monitor ? `Cell #${monitoredCellId} · score ${healthScore}/100 · ${(monitor.violations as any[])?.length ?? 0} violation(s)` : 'Reading KPIs…'} />
          <PipelineStep step={4} title="RAN Optimizer" done={!!optim?.optimized_by}
            summary={optim ? `${optim.action as string} · ${optim.action_description as string}` : 'Optimizing…'} />
        </div>
      </div>

      {/* ── KPI Before → After ── */}
      {execBefore && execAfter && improvements && (
        <div>
          <p className="section-title mb-2">KPI Impact</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {KPI_METRICS.map(({ key, label, unit, higherBetter }) => {
              const bVal = execBefore[key] ?? 0;
              const aVal = execAfter[key]  ?? 0;
              const imp  = improvements[key.replace('_percent', '').replace('_mbps', '').replace('_ms', '')] as any;
              const improved = imp?.improved ?? (higherBetter ? aVal >= bVal : aVal <= bVal);
              return (
                <KPICard
                  key={key}
                  label={label}
                  unit={unit}
                  before={bVal}
                  after={aVal}
                  improved={improved}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── Config + Violations side by side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Network Config */}
        {config && (
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={13} className="text-accent-cyan" />
              <p className="section-title">Network Configuration</p>
            </div>
            <table className="w-full">
              <tbody>
                <ConfigRow label="Slice Name"     value={slice.name ?? '—'} />
                <ConfigRow label="Slice Type"     value={`${slice.type ?? '—'} (SST ${slice.sst ?? '—'})`} />
                <ConfigRow label="Bandwidth"      value={`${slice.allocated_bandwidth_mbps ?? '—'} Mbps`} />
                <ConfigRow label="Latency Target" value={`${slice.latency_target_ms ?? '—'} ms`} />
                <ConfigRow label="Priority"       value={`ARP ${qos.arp_priority ?? '—'} · 5QI ${qos['5qi'] ?? '—'}`} />
                <ConfigRow label="Max DL / UL"    value={`${qos.max_bitrate_dl_mbps ?? '—'} / ${qos.max_bitrate_ul_mbps ?? '—'} Mbps`} />
                <ConfigRow label="Packet Delay"   value={`${qos.packet_delay_budget_ms ?? '—'} ms`} />
                <ConfigRow label="Packet Error"   value={qos.packet_error_rate ?? '—'} />
                <ConfigRow label="Numerology"     value={`μ${ranConf.numerology ?? '—'}`} />
                <ConfigRow label="Scheduler"      value={ranConf.scheduler ?? '—'} />
                <ConfigRow label="MIMO"           value={`${ranConf.mimo_layers ?? '—'}${ranConf.massive_mimo ? ' Massive' : ''}`} />
                <ConfigRow label="Carrier Agg."   value={ranConf.carrier_aggregation ? 'Enabled' : 'Disabled'} />
                <ConfigRow label="Active Cells"   value={String(ranConf.active_cells ?? '—')} />
              </tbody>
            </table>
          </div>
        )}

        {/* Violations */}
        {monitor && (
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={13} className="text-accent-cyan" />
              <p className="section-title">Network Monitor — Cell #{monitoredCellId}</p>
            </div>
            <div
              className="rounded-lg p-3 mb-3"
              style={{
                background: STATUS_BG[healthStatus ?? 'healthy'],
                border: `1px solid ${STATUS_COLOR[healthStatus ?? 'healthy']}30`,
              }}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold capitalize" style={{ color: STATUS_COLOR[healthStatus ?? 'healthy'] }}>
                  {healthStatus} — Score {healthScore}/100
                </span>
                <span className="text-[10px] text-text-muted capitalize">{locationTag}</span>
              </div>
              {monitorMetrics && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                  {[
                    ['Throughput', `${monitorMetrics.throughput_mbps?.toFixed(1)} Mbps`],
                    ['Latency',    `${monitorMetrics.latency_ms?.toFixed(1)} ms`],
                    ['Packet Loss',`${monitorMetrics.packet_loss_percent?.toFixed(2)} %`],
                    ['Cell Load',  `${monitorMetrics.cell_load_percent?.toFixed(1)} %`],
                    ['SNR',        `${monitorMetrics.snr_db?.toFixed(1)} dB`],
                    ['Bandwidth',  `${monitorMetrics.bandwidth_mhz} MHz`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2">
                      <span className="text-[10px] text-text-muted">{k}</span>
                      <span className="text-[10px] font-mono text-text-primary">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Violations list */}
            {Array.isArray(monitor.violations) && monitor.violations.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Violations</p>
                {(monitor.violations as any[]).map((v: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px]"
                    style={{
                      background: v.severity === 'critical' ? '#FF444415' : '#FFB80015',
                      border: `1px solid ${v.severity === 'critical' ? '#FF444430' : '#FFB80030'}`,
                    }}
                  >
                    <span style={{ color: v.severity === 'critical' ? '#FF4444' : '#FFB800' }}>
                      {v.severity === 'critical' ? '▲' : '▲'} {v.metric}
                    </span>
                    <span className="font-mono text-text-secondary">
                      {v.value} / {v.threshold}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-status-healthy">No threshold violations</p>
            )}
          </div>
        )}
      </div>

      {/* ── Affected topology ── */}
      {cells.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="section-title">
              Affected Network Topology
              {locationTag && (
                <span className="ml-2 normal-case font-normal text-accent-cyan">
                  — {LOCATION_LABEL[locationTag] ?? locationTag}
                  {affectedCount > 0 && ` (${affectedCount} cells)`}
                </span>
              )}
            </p>
            {locationTag && (
              <span className="text-[10px] text-text-muted">Non-zone cells dimmed</span>
            )}
          </div>
          <div style={{ height: 360 }}>
            <NetworkTopology
              cells={cells}
              highlightTag={locationTag || undefined}
              highlightCellId={monitoredCellId}
            />
          </div>
        </div>
      )}

    </div>
  );
}
