'use client';

import React from 'react';
import { Database, Info } from 'lucide-react';
import { DatasetManager } from '@/components/dataset/DatasetManager';

export default function DatasetPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="shrink-0 px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
            <Database size={15} className="text-accent-cyan" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Dataset Manager</h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Switch between the default dataset or upload your own
            </p>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Main manager */}
          <div className="xl:col-span-2">
            <DatasetManager />
          </div>

          {/* Info sidebar */}
          <div className="space-y-4">
            <div className="card-glow">
              <div className="flex items-center gap-2 mb-3">
                <Info size={13} className="text-accent-cyan" />
                <span className="section-title">About the Default Dataset</span>
              </div>
              <div className="space-y-2 text-[11px] text-text-secondary leading-relaxed">
                <p>
                  The default dataset is the <strong className="text-text-primary">6G HetNet Transmission
                  Management</strong> dataset with synthesized location coordinates added.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {[
                    ['Rows',         '5,000'],
                    ['Unique Cells', '49'],
                    ['Cell Types',   '4'],
                    ['Columns',      '26'],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-bg-primary rounded-lg px-3 py-2 border border-border">
                      <p className="text-[10px] text-text-secondary">{k}</p>
                      <p className="font-mono font-semibold text-text-primary text-xs">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <p className="section-title mb-2">Network updates automatically</p>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                When you switch datasets or upload a new CSV, the Network Monitor
                page immediately updates — the topology redraws and live KPI data
                starts streaming from the new dataset.
              </p>
            </div>

            <div className="card border-status-warning/30">
              <p className="section-title mb-2 text-status-warning">Upload requirements</p>
              <ul className="text-[11px] text-text-secondary space-y-1 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-status-warning mt-0.5">•</span>
                  File format: CSV only
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-status-warning mt-0.5">•</span>
                  Must contain all 8 required columns
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-status-warning mt-0.5">•</span>
                  Location_X and Location_Y must be numbers in range 0–1000
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-status-warning mt-0.5">•</span>
                  Resource_Utilization should be a decimal (0–1), not a percentage
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
