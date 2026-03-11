'use client';

import React, { useMemo, useState, useRef } from 'react';
import type { CellData } from '@/lib/types';

// ── Constants ────────────────────────────────────────────────────────────────
const W = 900, H = 660;           // SVG viewBox
const DATA_MIN = 0, DATA_MAX = 1000;  // coordinate space from CSV

// Max distance (in data space) to draw a link between two cells
const LINK_DIST: Record<string, number> = {
  Macro: 280, Micro: 200, Pico: 140, Femto: 100,
};

// Visual config per cell type
const CELL_STYLE: Record<string, { r: number; label: string; color: string }> = {
  Macro: { r: 18, label: 'M', color: '#0057A8' },
  Micro: { r: 13, label: 'μ', color: '#005F8A' },
  Pico:  { r: 9,  label: 'P', color: '#004A6E' },
  Femto: { r: 6,  label: 'F', color: '#003050' },
};

const STATUS_COLOR: Record<string, string> = {
  healthy:  '#00E5A0',
  warning:  '#FFB800',
  critical: '#FF4444',
  unknown:  '#4A6080',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function toSVG(v: number, dim: number) {
  const pad = 60;
  return pad + ((v - DATA_MIN) / (DATA_MAX - DATA_MIN)) * (dim - pad * 2);
}

function dist(a: CellData, b: CellData) {
  return Math.hypot(a.location_x - b.location_x, a.location_y - b.location_y);
}

function buildLinks(cells: CellData[]) {
  const links: { a: CellData; b: CellData }[] = [];
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const a = cells[i], b = cells[j];
      const maxD = Math.max(LINK_DIST[a.cell_type] ?? 150, LINK_DIST[b.cell_type] ?? 150);
      if (dist(a, b) <= maxD) links.push({ a, b });
    }
  }
  return links;
}

// ── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ cell, svgX, svgY }: { cell: CellData; svgX: number; svgY: number }) {
  const color = STATUS_COLOR[cell.health];
  const flip  = svgX > W * 0.65;
  return (
    <foreignObject
      x={flip ? svgX - 188 : svgX + 12}
      y={Math.max(8, svgY - 80)}
      width={180} height={200}
      style={{ pointerEvents: 'none', overflow: 'visible' }}
    >
      <div
        style={{ background: '#0D1F35', border: '1px solid #1A3050', borderRadius: 10,
                 padding: '10px 12px', fontSize: 11, color: '#E8F4FD',
                 boxShadow: '0 4px 24px rgba(0,0,0,0.6)' }}
      >
        <p style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>
          Cell #{cell.cell_id} — {cell.cell_type}
        </p>
        {cell.location_tag && (
          <p style={{ fontSize: 10, color: '#00D4FF', marginBottom: 4,
                      textTransform: 'capitalize', letterSpacing: '0.05em' }}>
            {cell.location_tag} zone
          </p>
        )}
        <p style={{ color, fontWeight: 600, marginBottom: 6, textTransform: 'capitalize' }}>
          ● {cell.health} ({cell.health_score})
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          {[
            ['Throughput', `${cell.throughput_mbps} Mbps`],
            ['Latency',    `${cell.latency_ms} ms`],
            ['Load',       `${cell.resource_utilization}%`],
            ['Pkt Loss',   `${cell.packet_loss}%`],
            ['SNR',        `${cell.snr_db} dB`],
            ['QoS',        `${(cell.qos_satisfaction * 100).toFixed(1)}%`],
          ].map(([k, v]) => (
            <tr key={k}>
              <td style={{ color: '#7B9DB5', paddingRight: 6, paddingBottom: 2 }}>{k}</td>
              <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{v}</td>
            </tr>
          ))}
        </table>
      </div>
    </foreignObject>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  cells: CellData[];
  highlightTag?: string;      // dim cells not in this location zone
  highlightCellId?: number;   // specific monitored cell — extra glow
}

export function NetworkTopology({ cells, highlightTag, highlightCellId }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const links = useMemo(() => buildLinks(cells), [cells]);

  const hoveredCell = hovered !== null ? cells.find(c => c.cell_id === hovered) : undefined;

  // SVG coordinates per cell
  const coords = useMemo(() =>
    new Map(cells.map(c => [c.cell_id, {
      x: toSVG(c.location_x, W),
      y: toSVG(c.location_y, H),
    }])),
    [cells]
  );

  if (cells.length === 0) {
    return (
      <div className="card-glow h-full flex items-center justify-center">
        <p className="text-text-secondary text-sm">Loading topology…</p>
      </div>
    );
  }

  return (
    <div className="card-glow h-full flex flex-col gap-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <span className="section-title">Network Topology</span>
        <div className="flex gap-3 text-[10px] text-text-secondary">
          {(['Macro','Micro','Pico','Femto'] as const).map(t => (
            <span key={t} className="flex items-center gap-1">
              <span
                style={{ width: CELL_STYLE[t].r * 1.5, height: CELL_STYLE[t].r * 1.5,
                         borderRadius: '50%', background: '#1A3050',
                         border: '1.5px solid #2A4A70', display: 'inline-block' }}
              />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* SVG */}
      <div className="flex-1 min-h-0 relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full"
          style={{ background: 'transparent' }}
        >
          {/* Grid overlay (subtle) */}
          {[0.25, 0.5, 0.75].map(f => (
            <React.Fragment key={f}>
              <line x1={W * f} y1={30}   x2={W * f} y2={H - 30}
                    stroke="#0D1F35" strokeWidth={1} />
              <line x1={30}    y1={H * f} x2={W - 30} y2={H * f}
                    stroke="#0D1F35" strokeWidth={1} />
            </React.Fragment>
          ))}

          {/* Links */}
          {links.map(({ a, b }, i) => {
            const ca = coords.get(a.cell_id)!;
            const cb = coords.get(b.cell_id)!;
            const isHighlighted =
              hovered === a.cell_id || hovered === b.cell_id;
            return (
              <line key={i}
                x1={ca.x} y1={ca.y} x2={cb.x} y2={cb.y}
                stroke={isHighlighted ? STATUS_COLOR[a.health] : '#1A3050'}
                strokeWidth={isHighlighted ? 1.5 : 1}
                opacity={isHighlighted ? 0.5 : 0.35}
                style={{ transition: 'stroke 0.3s, opacity 0.3s' }}
              />
            );
          })}

          {/* Nodes */}
          {cells.map(cell => {
            const c           = coords.get(cell.cell_id)!;
            const style       = CELL_STYLE[cell.cell_type] ?? CELL_STYLE.Micro;
            const color       = STATUS_COLOR[cell.health];
            const isHov       = hovered === cell.cell_id;
            const isAffected  = !highlightTag || cell.location_tag === highlightTag;
            const isMonitored = cell.cell_id === highlightCellId;
            const r           = style.r;

            return (
              <g
                key={cell.cell_id}
                className="cell-node cursor-pointer"
                transform={`translate(${c.x}, ${c.y})`}
                opacity={isAffected ? 1 : 0.15}
                onMouseEnter={() => setHovered(cell.cell_id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Extra glow for monitored cell */}
                {isMonitored && (
                  <circle r={r + 12} fill="#00D4FF" opacity={0.12} />
                )}
                {/* Pulse ring */}
                <circle
                  className="ring"
                  r={r + 5}
                  stroke={isMonitored ? '#00D4FF' : color}
                  strokeWidth={isHov || isMonitored ? 2 : 1}
                  fill="none"
                  opacity={isHov || isMonitored ? 0.6 : 0.2}
                  style={{ animationDelay: `${(cell.cell_id % 8) * 0.3}s` }}
                />
                {/* Outer glow ring */}
                <circle r={r + 2} fill={isMonitored ? '#00D4FF' : color} opacity={isMonitored ? 0.25 : 0.12} />
                {/* Main body */}
                <circle
                  r={r}
                  fill={isHov ? color : (isMonitored ? '#00D4FF' : style.color)}
                  stroke={isMonitored ? '#00D4FF' : color}
                  strokeWidth={isHov || isMonitored ? 2.5 : 1.5}
                  style={{ transition: 'fill 0.3s, r 0.2s' }}
                />
                {/* Label */}
                {r >= 9 && (
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={r >= 13 ? 8 : 6}
                    fill={isHov ? '#050B18' : '#E8F4FD'}
                    fontWeight={600}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {style.label}
                  </text>
                )}
                {/* Cell ID badge (only for Macro) */}
                {cell.cell_type === 'Macro' && !isHov && (
                  <text
                    y={r + 11}
                    textAnchor="middle"
                    fontSize={7}
                    fill="#7B9DB5"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    #{cell.cell_id}
                  </text>
                )}
              </g>
            );
          })}

          {/* Tooltip */}
          {hoveredCell && coords.get(hoveredCell.cell_id) && (
            <Tooltip
              cell={hoveredCell}
              svgX={coords.get(hoveredCell.cell_id)!.x}
              svgY={coords.get(hoveredCell.cell_id)!.y}
            />
          )}
        </svg>
      </div>

      {/* Status legend */}
      <div className="flex gap-4 shrink-0 text-[10px] text-text-secondary border-t border-border pt-2">
        {Object.entries(STATUS_COLOR).filter(([k]) => k !== 'unknown').map(([k, v]) => (
          <span key={k} className="flex items-center gap-1 capitalize">
            <span style={{ width: 8, height: 8, borderRadius: '50%',
                           background: v, display: 'inline-block' }} />
            {k}
          </span>
        ))}
        <span className="ml-auto text-text-muted">
          {cells.length} cells · hover for details
        </span>
      </div>
    </div>
  );
}
