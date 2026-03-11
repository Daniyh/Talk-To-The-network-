'use client';

import React, { useRef, useState } from 'react';
import { Upload, Database, CheckCircle, AlertCircle, FileText, RotateCcw, X } from 'lucide-react';
import { useDataset } from '@/hooks/useDataset';
import { REQUIRED_COLUMNS } from '@/lib/types';

// ── Column validation indicator ───────────────────────────────────────────────
function ColumnList({ cols }: { cols: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-1 mt-2">
      {REQUIRED_COLUMNS.map(col => {
        const present = cols.includes(col);
        return (
          <div key={col} className={`flex items-center gap-1.5 text-[11px]
            ${present ? 'text-status-healthy' : 'text-status-critical'}`}>
            {present
              ? <CheckCircle size={10} />
              : <AlertCircle size={10} />}
            <span className="font-mono">{col}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Preview table ─────────────────────────────────────────────────────────────
function PreviewTable({ rows, columns }: { rows: Record<string,string>[]; columns: string[] }) {
  const showCols = columns.slice(0, 8); // show first 8 cols
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr>
            {showCols.map(c => (
              <th key={c} className="text-left px-2 py-1.5 text-text-secondary font-medium
                                     border-b border-border bg-bg-secondary whitespace-nowrap">
                {c}
              </th>
            ))}
            {columns.length > 8 && (
              <th className="text-left px-2 py-1.5 text-text-muted border-b border-border bg-bg-secondary">
                +{columns.length - 8} more
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 6).map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-bg-card' : 'bg-bg-secondary'}>
              {showCols.map(c => (
                <td key={c} className="px-2 py-1.5 text-text-primary font-mono
                                       truncate max-w-[120px] border-b border-border/50">
                  {String(row[c] ?? '').slice(0, 16)}
                </td>
              ))}
              {columns.length > 8 && <td className="border-b border-border/50" />}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function DatasetManager() {
  const { rows, info, loading, error, uploadCSV, useDefault } = useDataset();

  const fileRef    = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setUploadError('Only CSV files are accepted');
      return;
    }
    setUploading(true);
    setUploadError(null);
    setSuccess(false);
    try {
      await uploadCSV(file);
      setSuccess(true);
    } catch (e: any) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const switchToDefault = () => {
    setSuccess(false);
    setUploadError(null);
    useDefault();
  };

  return (
    <div className="space-y-6">

      {/* Current dataset info */}
      {info && (
        <div className="card-glow">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent-blue/10 flex items-center justify-center">
                <Database size={16} className="text-accent-cyan" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{info.name}</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {info.cells} unique cells · {info.rows.toLocaleString()} rows · {info.columns.length} columns
                </p>
              </div>
            </div>
            <span className={`badge ${info.source === 'default' ? 'badge-healthy' : 'badge-warning'}`}>
              {info.source === 'default' ? '● Default' : '● Custom Upload'}
            </span>
          </div>

          {/* Column check */}
          <div className="mt-4 border-t border-border pt-4">
            <p className="section-title mb-1">Required columns</p>
            <ColumnList cols={info.columns} />
          </div>
        </div>
      )}

      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={switchToDefault}
          className={`card flex flex-col items-center gap-2 py-4 transition-all cursor-pointer
            hover:border-accent-cyan/50 ${info?.source === 'default'
              ? 'border-accent-cyan/60 bg-accent-cyan/5' : ''}`}
        >
          <Database size={20} className={info?.source === 'default' ? 'text-accent-cyan' : 'text-text-secondary'} />
          <p className="text-sm font-medium text-text-primary">Use Our Dataset</p>
          <p className="text-[11px] text-text-secondary text-center leading-tight">
            6G HetNet Transmission<br />Management Dataset
          </p>
          {info?.source === 'default' && (
            <span className="badge badge-healthy">Active</span>
          )}
        </button>

        <div className={`card flex flex-col items-center gap-2 py-4 transition-all
          ${info?.source === 'uploaded' ? 'border-status-warning/60 bg-status-warning/5' : ''}`}>
          <Upload size={20} className={info?.source === 'uploaded' ? 'text-status-warning' : 'text-text-secondary'} />
          <p className="text-sm font-medium text-text-primary">Upload Your Dataset</p>
          <p className="text-[11px] text-text-secondary text-center leading-tight">
            Custom CSV with required<br />columns including Location_X/Y
          </p>
          {info?.source === 'uploaded' && (
            <span className="badge badge-warning">Active</span>
          )}
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`card cursor-pointer text-center py-10 transition-all duration-200
          border-dashed border-2 flex flex-col items-center gap-3
          ${dragOver
            ? 'border-accent-cyan bg-accent-cyan/5'
            : 'border-border hover:border-accent-cyan/50 hover:bg-bg-hover'}`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {uploading ? (
          <>
            <div className="w-10 h-10 rounded-full border-2 border-accent-cyan border-t-transparent animate-spin" />
            <p className="text-sm text-text-secondary">Processing CSV…</p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-accent-blue/10 flex items-center justify-center">
              <Upload size={18} className="text-accent-cyan" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Drop CSV here or click to browse</p>
              <p className="text-xs text-text-secondary mt-1">
                Must include: Cell_ID, Cell_Type, throughput, latency, load, loss, Location_X, Location_Y, Location_Tag
              </p>
            </div>
          </>
        )}
      </div>

      {/* Success */}
      {success && (
        <div className="card border-status-healthy/40 animate-fade-in">
          <div className="flex items-center gap-2 text-status-healthy text-sm">
            <CheckCircle size={14} />
            <span className="font-medium">Dataset loaded successfully!</span>
          </div>
          <p className="text-xs text-text-secondary mt-1 ml-5">
            Network topology and monitor have updated to use your dataset.
          </p>
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <div className="card border-status-critical/40 animate-fade-in">
          <div className="flex items-start gap-2 text-status-critical">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Upload failed</p>
              <p className="text-xs text-text-secondary mt-0.5">{uploadError}</p>
            </div>
            <button onClick={() => setUploadError(null)} className="ml-auto text-text-muted hover:text-text-secondary">
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Data preview */}
      {rows.length > 0 && info && (
        <div className="card-glow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText size={13} className="text-text-secondary" />
              <span className="section-title">Data Preview</span>
            </div>
            <span className="text-xs text-text-secondary">
              First 6 rows of {rows.length.toLocaleString()}
            </span>
          </div>
          <PreviewTable rows={rows as any} columns={info.columns} />
        </div>
      )}

      {/* Required columns guide */}
      <div className="card">
        <p className="section-title mb-3">CSV Format Requirements</p>
        <div className="space-y-2">
          {[
            ['Cell_ID',                    'Unique cell identifier (integer)'],
            ['Cell_Type',                  'Macro / Micro / Pico / Femto'],
            ['Achieved_Throughput_Mbps',   'Downlink throughput in Mbps'],
            ['Network_Latency_ms',         'Round-trip latency in milliseconds'],
            ['Resource_Utilization',       'Cell load as fraction (0–1)'],
            ['Packet_Loss_Ratio',          'Packet loss as fraction (0–1)'],
            ['Location_X',                 'X coordinate (float, 0–1000)'],
            ['Location_Y',                 'Y coordinate (float, 0–1000)'],
            ['Location_Tag',               'Zone label: hospital | stadium | factory | downtown | residential'],
          ].map(([col, desc]) => (
            <div key={col} className="flex gap-3">
              <code className="text-[11px] font-mono text-accent-cyan w-52 shrink-0">{col}</code>
              <span className="text-[11px] text-text-secondary">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
