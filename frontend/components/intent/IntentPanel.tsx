'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { processIntent } from '@/lib/api';
import type { IntentResult } from '@/lib/types';
import { IntentResultCard } from './IntentResultCard';

// ── Sample intents ────────────────────────────────────────────────────────────
const SAMPLES = [
  'Prioritize emergency communications at the central hospital now',
  'Optimize for 50,000 fans at the stadium tonight',
  'Deploy IoT connectivity for 10,000 sensors in the smart factory',
  'Ensure low latency for telemedicine services across all micro cells',
  'Improve gaming experience for users in the downtown area',
];


// ── Main component ────────────────────────────────────────────────────────────
export function IntentPanel() {
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [result,   setResult]   = useState<IntentResult | null>(null);
  const [history,  setHistory]  = useState<{ intent: string; result: IntentResult }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Restore from localStorage on first load ────────────────────────────────
  // [LINE A] This runs once when the component mounts (empty [] dependency array).
  // It checks if the browser has a previously saved result and history,
  // and if so, puts them back into state — so the page looks exactly as the
  // user left it, even after navigating away or refreshing.
  useEffect(() => {
    const savedResult  = localStorage.getItem('intent_result');
    const savedHistory = localStorage.getItem('intent_history');
    if (savedResult)  setResult(JSON.parse(savedResult));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const submit = async (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    setInput('');
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await processIntent(t);
      // [LINE B] Build the new history entry and prepend it (max 5 items kept).
      const newHistory = [{ intent: t, result: res }, ...history.slice(0, 4)];
      setResult(res);
      setHistory(newHistory);
      // [LINE C] Save the latest result and full history to localStorage.
      // localStorage is a key-value store built into every browser.
      // JSON.stringify converts the JavaScript object into a plain string
      // so it can be stored — JSON.parse (in LINE A) converts it back.
      localStorage.setItem('intent_result',  JSON.stringify(res));
      localStorage.setItem('intent_history', JSON.stringify(newHistory));
    } catch (e: any) {
      setError(e.message ?? 'Failed to process intent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-5">

      {/* Hero slogan */}
      <div className="shrink-0 pt-1 pb-0">
        <h1 className="text-2xl font-bold text-text-primary leading-tight tracking-tight">
          Talk to the{' '}
          <span className="text-accent-cyan">Network</span>
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Express your operational goal in plain language — the AI handles the rest.
        </p>
      </div>

      {/* Input area */}
      <div className="card-glow shrink-0 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Bot size={15} className="text-accent-cyan" />
          <span className="text-sm font-semibold text-text-primary">Intent Input</span>
          <span className="badge badge-healthy ml-auto">AI-Powered</span>
        </div>
        <p className="text-xs text-text-secondary">
          Describe your network optimization goal in natural language.
          The AI will parse, plan, monitor, and optimize accordingly.
        </p>

        {/* Textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(input); }
            }}
            placeholder="e.g. Prioritize emergency services at the hospital…"
            rows={2}
            disabled={loading}
            className="w-full bg-bg-primary border border-border rounded-lg px-4 py-3
                       text-sm text-text-primary placeholder-text-muted resize-none
                       focus:outline-none focus:border-accent-cyan transition-colors
                       disabled:opacity-50 pr-14"
          />
          <button
            onClick={() => submit(input)}
            disabled={!input.trim() || loading}
            className="absolute right-3 bottom-3 btn-primary px-2.5 py-1.5"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>

        {/* Sample prompts */}
        <div className="space-y-1">
          <p className="section-title">Quick examples</p>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLES.map(s => (
              <button
                key={s}
                onClick={() => submit(s)}
                disabled={loading}
                className="text-[11px] px-2.5 py-1 rounded-full border border-border
                           text-text-secondary hover:border-accent-cyan hover:text-accent-cyan
                           transition-colors disabled:opacity-40"
              >
                {s.length > 42 ? s.slice(0, 42) + '…' : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="card-glow shrink-0 animate-fade-in">
          <div className="flex items-center gap-3">
            <Loader2 size={16} className="text-accent-cyan animate-spin" />
            <div>
              <p className="text-sm font-medium text-text-primary">Processing intent…</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Running 4 AI agents: Intent → Planner → Monitor → Optimizer
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {['Intent Parser','Planner','Monitor','Optimizer'].map((a, i) => (
              <div key={a} className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-full border border-accent-cyan/40
                                flex items-center justify-center">
                  <Loader2
                    size={14}
                    className="text-accent-cyan animate-spin"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                </div>
                <span className="text-[10px] text-text-secondary text-center leading-tight">{a}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card shrink-0 border-status-critical/40 animate-fade-in">
          <div className="flex items-start gap-2 text-sm text-status-critical">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-xs text-text-secondary mt-0.5">{error}</p>
              <p className="text-xs text-text-muted mt-1">
                Make sure the Python backend is running: <code className="font-mono">python api/intent.py</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="shrink-0">
          <IntentResultCard result={result} warning={result.warning} />
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div className="shrink-0 space-y-2">
          <p className="section-title">Previous intents</p>
          {history.slice(1).map(({ intent }, i) => (
            <button
              key={i}
              onClick={() => submit(intent)}
              disabled={loading}
              className="w-full text-left px-3 py-2 rounded-lg border border-border
                         text-xs text-text-secondary hover:border-accent-cyan/50
                         hover:text-text-primary transition-colors flex items-center gap-2"
            >
              <User size={11} className="shrink-0" />
              <span className="truncate">{intent}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
