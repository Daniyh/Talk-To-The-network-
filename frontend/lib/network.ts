/**
 * Client-side network simulation
 * Reads parsed CSV rows and generates live-looking KPI values per cell.
 */

import type { CellData, RawRow, NetworkSummary, HealthStatus } from './types';

// ─── KPI thresholds ──────────────────────────────────────────────────────────
const T = {
  latency:   { healthy: 50,  warning: 80  },
  throughput:{ healthy: 100, warning: 60  },
  load:      { healthy: 70,  warning: 85  },
  loss:      { healthy: 0.01, warning: 0.1 },
};

function jitter(v: number, pct = 0.06): number {
  return v * (1 + (Math.random() - 0.5) * 2 * pct);
}

function healthScore(throughput: number, latency: number, load: number, loss: number): number {
  let score = 100;
  if (latency   >= 100)            score -= 35;
  else if (latency >= T.latency.warning) score -= 18;
  else if (latency >= T.latency.healthy) score -= 8;

  if (throughput <= 30)              score -= 30;
  else if (throughput <= T.throughput.warning) score -= 15;
  else if (throughput <= T.throughput.healthy) score -= 5;

  if (load   >= 95)              score -= 25;
  else if (load >= T.load.warning)   score -= 12;
  else if (load >= T.load.healthy)   score -= 5;

  if (loss >= 1.0)  score -= 10;
  else if (loss >= 0.1) score -= 5;

  return Math.max(0, Math.min(100, score));
}

function toHealth(score: number): HealthStatus {
  if (score >= 75) return 'healthy';
  if (score >= 50) return 'warning';
  return 'critical';
}

// ─── Build per-cell lookup from raw rows ────────────────────────────────────

export interface CellMeta {
  cell_id: number;
  cell_type: string;
  location_x: number;
  location_y: number;
  location_tag: string;
  rows: RawRow[];
}

export function buildCellIndex(rows: RawRow[]): Map<number, CellMeta> {
  const map = new Map<number, CellMeta>();
  for (const row of rows) {
    const id = parseInt(row.Cell_ID, 10);
    if (isNaN(id)) continue;
    if (!map.has(id)) {
      map.set(id, {
        cell_id:      id,
        cell_type:    row.Cell_Type ?? 'Macro',
        location_x:   parseFloat(row.Location_X) || 500,
        location_y:   parseFloat(row.Location_Y) || 500,
        location_tag: (row.Location_Tag ?? '').toLowerCase(),
        rows:         [],
      });
    }
    map.get(id)!.rows.push(row);
  }
  return map;
}

// ─── Generate one snapshot of all cells ─────────────────────────────────────

let _rowCursors: Map<number, number> = new Map();

export function generateSnapshot(cellIndex: Map<number, CellMeta>): CellData[] {
  const cells: CellData[] = [];

  for (const [id, meta] of cellIndex) {
    const cursor = _rowCursors.get(id) ?? Math.floor(Math.random() * meta.rows.length);
    const row    = meta.rows[cursor % meta.rows.length];
    _rowCursors.set(id, (cursor + 1) % meta.rows.length);

    const throughput = jitter(parseFloat(row.Achieved_Throughput_Mbps) || 100);
    const latency    = jitter(parseFloat(row.Network_Latency_ms)        || 20);
    const load       = jitter(Math.min(100, (parseFloat(row.Resource_Utilization) || 0.5) * 100));
    const loss       = jitter((parseFloat(row.Packet_Loss_Ratio) || 0.01) * 100, 0.1);
    const score      = healthScore(throughput, latency, load, loss);

    cells.push({
      cell_id:            id,
      cell_type:          meta.cell_type as CellData['cell_type'],
      location_x:         meta.location_x,
      location_y:         meta.location_y,
      location_tag:       meta.location_tag,
      throughput_mbps:    Math.round(throughput * 10) / 10,
      latency_ms:         Math.round(latency * 10) / 10,
      packet_loss:        Math.round(loss * 1000) / 1000,
      resource_utilization: Math.round(load * 10) / 10,
      snr_db:             Math.round(jitter(parseFloat(row.Signal_to_Noise_Ratio_dB) || 20) * 10) / 10,
      qos_satisfaction:   Math.round(jitter(parseFloat(row.QoS_Satisfaction) || 0.9) * 1000) / 1000,
      power_w:            Math.round(jitter(parseFloat(row.Power_Consumption_Watt) || 30) * 10) / 10,
      bandwidth_mhz:      parseFloat(row.Bandwidth_MHz) || 100,
      carrier_ghz:        parseFloat(row.Carrier_Frequency_GHz) || 3.5,
      modulation:         row.Modulation_Scheme || '64QAM',
      health:             toHealth(score),
      health_score:       score,
    });
  }

  return cells.sort((a, b) => a.cell_id - b.cell_id);
}

export function computeSummary(cells: CellData[], ts: number): NetworkSummary {
  if (cells.length === 0) {
    return { avg_throughput: 0, avg_latency: 0, avg_load: 0,
             total_cells: 0, healthy_cells: 0, warning_cells: 0,
             critical_cells: 0, timestamp: ts };
  }
  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
  return {
    avg_throughput:  Math.round(avg(cells.map(c => c.throughput_mbps))),
    avg_latency:     Math.round(avg(cells.map(c => c.latency_ms)) * 10) / 10,
    avg_load:        Math.round(avg(cells.map(c => c.resource_utilization))),
    total_cells:     cells.length,
    healthy_cells:   cells.filter(c => c.health === 'healthy').length,
    warning_cells:   cells.filter(c => c.health === 'warning').length,
    critical_cells:  cells.filter(c => c.health === 'critical').length,
    timestamp:       ts,
  };
}

export function resetCursors() {
  _rowCursors = new Map();
}
