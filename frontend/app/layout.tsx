'use client';

import './globals.css';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, MessageSquare, Database } from 'lucide-react';
import { useDatasetProvider, DatasetContext } from '@/hooks/useDataset';

// ── Nav items ────────────────────────────────────────────────────────────────
const NAV = [
  { href: '/',        label: 'Network Monitor', icon: Activity    },
  { href: '/intent',  label: 'Intent AI',       icon: MessageSquare },
  { href: '/dataset', label: 'Dataset',          icon: Database    },
];

// ── Inner layout (needs usePathname — must be client) ────────────────────────
function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dataset  = useDatasetProvider();

  return (
    <DatasetContext.Provider value={dataset}>
      <div className="flex min-h-screen">
        {/* ── Sidebar ── */}
        <aside className="w-60 shrink-0 flex flex-col border-r border-border bg-bg-secondary">
          {/* Logo */}
          <div className="px-5 py-5 border-b border-border">
            <svg viewBox="0 0 220 52" width="148" height="35" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="2" width="48" height="48" rx="10" fill="#0D1F35"/>
              <path d="M14 9 Q8 9 8 15 L8 32 Q8 38 14 38 L20 38 L16 44 L26 38 L34 38 Q40 38 40 32 L40 15 Q40 9 34 9 Z"
                    fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinejoin="round"/>
              <circle cx="24" cy="33" r="2.5" fill="#00D4FF"/>
              <path d="M19 27 A5 5 0 0 1 29 27" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round"/>
              <path d="M15 27 A9 9 0 0 1 33 27" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
              <path d="M11 27 A13 13 0 0 1 37 27" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
              <text fontFamily="'Inter','Helvetica Neue',Arial,sans-serif" fontSize="28" fontWeight="700" letterSpacing="-0.5" y="37" x="60">
                <tspan fill="#E8F4FF">Talk</tspan><tspan fill="#00D4FF">Net</tspan>
              </text>
            </svg>
            <p className="text-[10px] text-text-secondary tracking-widest uppercase mt-1">Talk To the Network</p>
          </div>

          {/* Live indicator */}
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <span className="live-dot" />
            <span className="text-xs text-status-healthy font-medium">Network Live</span>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            <p className="section-title px-3 mb-3">Navigation</p>
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link ${pathname === href ? 'active' : ''}`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </nav>

          {/* Dataset badge */}
          {dataset.info && (
            <div className="px-4 py-4 border-t border-border">
              <p className="section-title mb-2">Active Dataset</p>
              <div className="bg-bg-card rounded-lg px-3 py-2 border border-border">
                <p className="text-xs text-text-primary truncate font-medium">{dataset.info.name}</p>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  {dataset.info.cells} cells · {dataset.info.rows.toLocaleString()} rows
                </p>
                <span className={`badge mt-1.5 ${dataset.info.source === 'default' ? 'badge-healthy' : 'badge-warning'}`}>
                  {dataset.info.source === 'default' ? 'Default' : 'Custom Upload'}
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-4 border-t border-border">
            <p className="text-[10px] text-text-muted">5G-Advanced · 3GPP R18</p>
            <p className="text-[10px] text-text-muted">Intent-Based Networking</p>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 bg-bg-primary">
          {children}
        </main>
      </div>
    </DatasetContext.Provider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>TalkNet — 5G Advanced AI Optimizer</title>
        <meta name="description" content="TalkNet — Talk to your network in plain language. Intent-Based 5G-Advanced RAN Optimizer." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
