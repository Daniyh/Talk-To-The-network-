// ─── Cell & Network Types ────────────────────────────────────────────────────

export type CellType = 'Macro' | 'Micro' | 'Pico' | 'Femto';
export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

export interface CellData {
  cell_id: number;
  cell_type: CellType;
  location_x: number;
  location_y: number;
  location_tag: string;
  // Live KPIs
  throughput_mbps: number;
  latency_ms: number;
  packet_loss: number;
  resource_utilization: number;
  snr_db: number;
  qos_satisfaction: number;
  power_w: number;
  bandwidth_mhz: number;
  carrier_ghz: number;
  modulation: string;
  // Computed
  health: HealthStatus;
  health_score: number;
}

export interface NetworkSummary {
  avg_throughput: number;
  avg_latency: number;
  avg_load: number;
  total_cells: number;
  healthy_cells: number;
  warning_cells: number;
  critical_cells: number;
  timestamp: number;
}

export interface ChartPoint {
  time: string;
  throughput: number;
  latency: number;
  load: number;
}

// ─── Raw CSV row ─────────────────────────────────────────────────────────────

export interface RawRow {
  Cell_ID: string;
  Cell_Type: string;
  Achieved_Throughput_Mbps: string;
  Network_Latency_ms: string;
  Resource_Utilization: string;
  Packet_Loss_Ratio: string;
  Signal_to_Noise_Ratio_dB: string;
  QoS_Satisfaction: string;
  Power_Consumption_Watt: string;
  Bandwidth_MHz: string;
  Carrier_Frequency_GHz: string;
  Modulation_Scheme: string;
  Location_X: string;
  Location_Y: string;
  Location_Tag: string;
  [key: string]: string;
}

// ─── Intent Types ────────────────────────────────────────────────────────────

export interface IntentResult {
  success: boolean;
  result: {
    intent?: Record<string, unknown>;
    config?: Record<string, unknown>;
    monitor?: Record<string, unknown>;
    optimization?: Record<string, unknown>;
    raw_output?: string;
    fallback?: boolean;
  };
  warning?: string;
}

// ─── Dataset Types ───────────────────────────────────────────────────────────

export interface DatasetInfo {
  name: string;
  rows: number;
  cells: number;
  source: 'default' | 'uploaded';
  columns: string[];
}

export const REQUIRED_COLUMNS = [
  'Cell_ID',
  'Cell_Type',
  'Achieved_Throughput_Mbps',
  'Network_Latency_ms',
  'Resource_Utilization',
  'Packet_Loss_Ratio',
  'Location_X',
  'Location_Y',
  'Location_Tag',
] as const;
