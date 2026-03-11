import type { IntentResult } from './types';

/**
 * In development  → Next.js rewrites /api/intent → http://localhost:8000/api/intent
 * In production   → Next.js rewrites /api/intent → ${BACKEND_URL}/api/intent  (server-side, no CORS needed)
 * Fallback        → NEXT_PUBLIC_BACKEND_URL set directly on the client (optional)
 */
function intentUrl(): string {
  // Client-side public override (optional, e.g. for static export)
  const pub = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (pub) return `${pub}/api/intent`;
  // Default: go through Next.js rewrite proxy (works in both dev & prod)
  return '/api/intent';
}

export async function processIntent(intent: string): Promise<IntentResult> {
  const res = await fetch(intentUrl(), {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ intent }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Intent API error');
  }
  return res.json();
}
