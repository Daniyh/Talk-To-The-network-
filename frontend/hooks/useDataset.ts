'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import Papa from 'papaparse';
import type { RawRow, DatasetInfo } from '@/lib/types';
import { REQUIRED_COLUMNS } from '@/lib/types';
import { buildCellIndex, resetCursors, type CellMeta } from '@/lib/network';

interface DatasetCtx {
  rows:        RawRow[];
  cellIndex:   Map<number, CellMeta>;
  info:        DatasetInfo | null;
  loading:     boolean;
  error:       string | null;
  uploadCSV:   (file: File) => Promise<void>;
  useDefault:  () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────
export const DatasetContext = createContext<DatasetCtx>({
  rows: [], cellIndex: new Map(), info: null,
  loading: false, error: null,
  uploadCSV: async () => {}, useDefault: () => {},
});

export function useDataset() {
  return useContext(DatasetContext);
}

// ─── Provider (used in app/layout.tsx) ──────────────────────────────────────
export function useDatasetProvider(): DatasetCtx {
  const [rows,      setRows]      = useState<RawRow[]>([]);
  const [cellIndex, setCellIndex] = useState<Map<number, CellMeta>>(new Map());
  const [info,      setInfo]      = useState<DatasetInfo | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const applyRows = useCallback((newRows: RawRow[], src: 'default' | 'uploaded', name: string) => {
    resetCursors();
    const idx = buildCellIndex(newRows);
    setRows(newRows);
    setCellIndex(idx);
    setInfo({
      name,
      rows:    newRows.length,
      cells:   idx.size,
      source:  src,
      columns: newRows.length > 0 ? Object.keys(newRows[0]) : [],
    });
  }, []);

  // Load default dataset on mount
  const useDefault = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('/data/6G_HetNet_with_location.csv')
      .then(r => r.text())
      .then(text => {
        const result = Papa.parse<RawRow>(text, { header: true, skipEmptyLines: true });
        applyRows(result.data, 'default', '6G_HetNet_Transmission_Management.csv');
        setLoading(false);
      })
      .catch(e => {
        setError('Failed to load default dataset: ' + e.message);
        setLoading(false);
      });
  }, [applyRows]);

  useEffect(() => { useDefault(); }, [useDefault]);

  const uploadCSV = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    return new Promise<void>((resolve, reject) => {
      Papa.parse<RawRow>(file, {
        header:        true,
        skipEmptyLines: true,
        complete: result => {
          // Validate required columns
          const cols    = result.meta.fields ?? [];
          const missing = REQUIRED_COLUMNS.filter(c => !cols.includes(c));
          if (missing.length > 0) {
            const msg = `Missing required columns: ${missing.join(', ')}`;
            setError(msg);
            setLoading(false);
            reject(new Error(msg));
            return;
          }
          applyRows(result.data, 'uploaded', file.name);
          setLoading(false);
          resolve();
        },
        error: e => {
          setError('Parse error: ' + e.message);
          setLoading(false);
          reject(e);
        },
      });
    });
  }, [applyRows]);

  return { rows, cellIndex, info, loading, error, uploadCSV, useDefault };
}
