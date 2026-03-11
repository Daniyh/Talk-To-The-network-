'use client';

import './globals.css';
import React, { createContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, MessageSquare, Database, Wifi } from 'lucide-react';
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
          <div className="px-5 py-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-ericsson-blue flex items-center justify-center">
                <Wifi size={16} className="text-accent-cyan" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary leading-tight">5G Network</p>
                <p className="text-[10px] text-accent-cyan tracking-widest uppercase font-semibold">Talk to the Network</p>
              </div>
            </div>
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
        <title>Talk to the Network — 5G AI Optimizer</title>
        <meta name="description" content="Talk to the Network — Intent-Based 5G-Advanced Network Optimizer" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
