'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { processIntent, checkClarification } from '@/lib/api';
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
type Phase = 'idle' | 'clarifying' | 'awaiting' | 'processing';

export function IntentPanel() {
  const [input,     setInput]     = useState('');
  const [phase,     setPhase]     = useState<Phase>('idle');
  const [error,     setError]     = useState<string | null>(null);
  const [result,    setResult]    = useState<IntentResult | null>(null);
  const [history,   setHistory]   = useState<{ intent: string; result: IntentResult }[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers,   setAnswers]   = useState<string[]>([]);
  const [pendingIntent, setPendingIntent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loading = phase === 'clarifying' || phase === 'processing';

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

  const runPipeline = async (enrichedIntent: string, originalIntent: string) => {
    setPhase('processing');
    setError(null);
    try {
      const res = await processIntent(enrichedIntent);
      const newHistory = [{ intent: originalIntent, result: res }, ...history.slice(0, 4)];
      setResult(res);
      setHistory(newHistory);
      localStorage.setItem('intent_result',  JSON.stringify(res));
      localStorage.setItem('intent_history', JSON.stringify(newHistory));
    } catch (e: any) {
      setError(e.message ?? 'Failed to process intent');
    } finally {
      setPhase('idle');
    }
  };

  const submit = async (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    setInput('');
    setResult(null);
    setError(null);
    setPhase('clarifying');
    setPendingIntent(t);
    try {
      const clarify = await checkClarification(t);
      const r = clarify.result;
      if (r.needs_clarification && r.questions.length > 0) {
        setQuestions(r.questions);
        setAnswers(new Array(r.questions.length).fill(''));
        setPhase('awaiting');
      } else {
        await runPipeline(t, t);
      }
    } catch {
      // If clarify endpoint fails, proceed directly
      await runPipeline(t, t);
    }
  };

  const submitWithAnswers = async () => {
    const filled = answers.every(a => a.trim());
    if (!filled) return;
    const context = questions.map((q, i) => `${q}: ${answers[i]}`).join('. ');
    const enriched = `${pendingIntent}. Additional context: ${context}`;
    setPhase('processing');
    setQuestions([]);
    setAnswers([]);
    await runPipeline(enriched, pendingIntent);
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

      {/* Clarifying state */}
      {phase === 'clarifying' && (
        <div className="card-glow shrink-0 animate-fade-in">
          <div className="flex items-center gap-3">
            <Loader2 size={16} className="text-accent-cyan animate-spin" />
            <div>
              <p className="text-sm font-medium text-text-primary">Analyzing intent…</p>
              <p className="text-xs text-text-secondary mt-0.5">Checking if more information is needed</p>
            </div>
          </div>
        </div>
      )}

      {/* Clarification questions */}
      {phase === 'awaiting' && questions.length > 0 && (
        <div className="card-glow shrink-0 animate-fade-in space-y-4">
          <div className="flex items-center gap-2">
            <Bot size={15} className="text-accent-cyan" />
            <p className="text-sm font-semibold text-text-primary">A few quick questions</p>
          </div>
          <p className="text-xs text-text-secondary">
            Your intent needs a bit more detail to generate a precise configuration.
          </p>
          {questions.map((q, i) => (
            <div key={i} className="space-y-1.5">
              <p className="text-xs font-medium text-text-primary">{q}</p>
              <input
                type="text"
                value={answers[i]}
                onChange={e => {
                  const updated = [...answers];
                  updated[i] = e.target.value;
                  setAnswers(updated);
                }}
                onKeyDown={e => { if (e.key === 'Enter') submitWithAnswers(); }}
                placeholder="Your answer…"
                className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2
                           text-sm text-text-primary placeholder-text-muted
                           focus:outline-none focus:border-accent-cyan transition-colors"
              />
            </div>
          ))}
          <div className="flex gap-2">
            <button
              onClick={submitWithAnswers}
              disabled={!answers.every(a => a.trim())}
              className="btn-primary px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-40"
            >
              <Send size={13} /> Proceed
            </button>
            <button
              onClick={() => runPipeline(pendingIntent, pendingIntent)}
              className="px-4 py-2 text-xs text-text-secondary border border-border rounded-lg
                         hover:border-accent-cyan/50 transition-colors"
            >
              Skip & proceed anyway
            </button>
          </div>
        </div>
      )}

      {/* Processing state */}
      {phase === 'processing' && (
        <div className="card-glow shrink-0 animate-fade-in">
          <div className="flex items-center gap-3">
            <Loader2 size={16} className="text-accent-cyan animate-spin" />
            <div>
              <p className="text-sm font-medium text-text-primary">Processing intent…</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Running 5 AI agents: Intent → Planner → Safety → Monitor → Optimizer
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {['Intent Parser','Planner','Safety','Monitor','Optimizer'].map((a, i) => (
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
