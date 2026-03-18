'use client';

import React from 'react';
import { Bot, Zap, Shield, GitBranch } from 'lucide-react';
import { IntentPanel } from '@/components/intent/IntentPanel';

function FeatureCard({ icon: Icon, title, desc }: {
  icon: React.ElementType; title: string; desc: string;
}) {
  return (
    <div className="card flex gap-3">
      <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center shrink-0">
        <Icon size={14} className="text-accent-cyan" />
      </div>
      <div>
        <p className="text-xs font-semibold text-text-primary">{title}</p>
        <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function IntentPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="shrink-0 px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
            <Bot size={15} className="text-accent-cyan" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Intent AI</h1>
            <p className="text-xs text-text-secondary mt-0.5">
               Agentic AI 5G_Advanced Network optimization
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <span className="badge badge-healthy">LLM-Powered</span>
            <span className="badge" style={{ background: 'rgba(0,102,255,0.15)', color: '#60A5FA' }}>
              3GPP R18
            </span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Main intent panel */}
          <div className="xl:col-span-2">
            <IntentPanel />
          </div>

          {/* Info sidebar */}
          <div className="space-y-4">
            <div className="card-glow">
              <p className="section-title mb-3">How it works</p>
              <ol className="space-y-3">
                {[
                  ['1', 'Intent Parser',  'LLM parses your natural language into structured intent'],
                  ['2', 'Planner',        '3GPP-compliant configuration is generated'],
                  ['3', 'Monitor',        'Current network KPIs are analyzed'],
                  ['4', 'Optimizer',      'Best action is selected and applied'],
                ].map(([n, title, desc]) => (
                  <li key={n} className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-accent-blue/20 text-accent-cyan
                                     text-[10px] font-bold flex items-center justify-center shrink-0">
                      {n}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-text-primary">{title}</p>
                      <p className="text-[11px] text-text-secondary mt-0.5">{desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <FeatureCard
              icon={Zap}
              title="LLM as Translator Only"
              desc="AI translates intent to config. A rule-based safety gate validates before any network change."
            />
            <FeatureCard
              icon={Shield}
              title="Safety-First Architecture"
              desc="Hard limits on bandwidth, users, and confidence thresholds prevent unsafe configurations."
            />
            <FeatureCard
              icon={GitBranch}
              title="Automatic Rollback"
              desc="If KPIs degrade after optimization, changes are automatically reverted."
            />

            <div className="card text-[11px] text-text-secondary space-y-1">
              <p className="font-semibold text-text-primary text-xs mb-2">Supported intent types</p>
              {[
                'Stadium / Sports Event',
                'Emergency Response',
                'IoT / Smart Factory',
                'Healthcare / Telemedicine',
                'Transportation / V2X',
                'Gaming / AR/VR',
                'Video Conferencing',
                'Mass Gathering',
                'General Optimization',
              ].map(t => (
                <p key={t} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-accent-cyan/60" />{t}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
