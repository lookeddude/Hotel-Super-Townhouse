'use client';
/**
 * Phase 8 — Global Search
 * Searches bookings, guests, payments, and rooms simultaneously.
 */
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Loader2, CalendarDays, Users, CreditCard, BedDouble, X, ArrowRight } from 'lucide-react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { globalSearch } from '@/services/analyticsService';
import { formatINR } from '@/services/pricingService';

const STATUS_COLORS: Record<string, string> = {
  available:   'text-green-600',
  occupied:    'text-red-500',
  reserved:    'text-blue-600',
  maintenance: 'text-orange-500',
  paid:        'text-green-600',
  pending:     'text-yellow-600',
  failed:      'text-red-500',
  confirmed:   'text-blue-600',
  cancelled:   'text-red-500',
  checked_in:  'text-green-600',
  checked_out: 'text-gray-500',
};

export default function GlobalSearchPage() {
  const { supabase } = useSupabase();
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults(null); return; }
    setLoading(true);
    const data = await globalSearch(supabase, q);
    setResults(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 350);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  const bookings = results?.bookings ?? [];
  const guests   = results?.guests   ?? [];
  const payments = results?.payments ?? [];
  const rooms    = results?.rooms    ?? [];
  const hasResults = bookings.length || guests.length || payments.length || rooms.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-headline-md text-on-surface">Global Search</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">
          Search across bookings, guests, payments, and rooms instantly
        </p>
      </div>

      {/* Search Box */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
        <input
          autoFocus
          id="global-search-input"
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Booking ref, guest name, email, payment ref, room number…"
          className="w-full pl-11 pr-11 py-3.5 bg-white border-2 border-outline-variant rounded-xl text-base focus:outline-none focus:border-primary transition-colors shadow-sm"
        />
        {loading && (
          <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-on-surface-variant" />
        )}
        {query && !loading && (
          <button
            onClick={() => { setQuery(''); setResults(null); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* No results */}
      {results && !hasResults && !loading && (
        <div className="text-center py-20">
          <Search size={44} className="mx-auto text-outline mb-4" />
          <p className="font-semibold text-on-surface text-lg">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-sm text-on-surface-variant mt-1">Try a booking reference, guest name, email, or room number</p>
        </div>
      )}

      {/* Results */}
      {results && hasResults && (
        <div className="space-y-5">

          {/* Bookings */}
          {bookings.length > 0 && (
            <section className="bg-white rounded-xl border border-outline-variant overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-outline-variant bg-surface/60">
                <CalendarDays size={14} className="text-primary" />
                <h2 className="font-semibold text-sm text-on-surface">Bookings</h2>
                <span className="ml-auto text-xs text-on-surface-variant">{bookings.length} result{bookings.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-outline-variant/40">
                {bookings.map((b: any) => (
                  <Link key={b.id} href={`/admin/bookings/${b.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-surface/50 transition-colors group">
                    <div>
                      <p className="font-mono text-sm font-semibold text-primary group-hover:underline">{b.booking_reference}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {new Date(b.check_in + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {' → '}
                        {new Date(b.check_out + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatINR(b.total_amount)}</p>
                        <span className={`text-xs font-medium ${STATUS_COLORS[b.status] ?? ''}`}>
                          {b.status?.replace('_', ' ')}
                        </span>
                      </div>
                      <ArrowRight size={14} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Guests */}
          {guests.length > 0 && (
            <section className="bg-white rounded-xl border border-outline-variant overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-outline-variant bg-surface/60">
                <Users size={14} className="text-primary" />
                <h2 className="font-semibold text-sm text-on-surface">Guests</h2>
                <span className="ml-auto text-xs text-on-surface-variant">{guests.length} result{guests.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-outline-variant/40">
                {guests.map((g: any) => (
                  <div key={g.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="font-medium text-sm text-on-surface">{g.full_name}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{g.email}</p>
                    </div>
                    {g.phone && <p className="text-xs text-on-surface-variant">{g.phone}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Payments */}
          {payments.length > 0 && (
            <section className="bg-white rounded-xl border border-outline-variant overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-outline-variant bg-surface/60">
                <CreditCard size={14} className="text-primary" />
                <h2 className="font-semibold text-sm text-on-surface">Payments</h2>
                <span className="ml-auto text-xs text-on-surface-variant">{payments.length} result{payments.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-outline-variant/40">
                {payments.map((p: any) => (
                  <Link key={p.id} href={`/admin/payments/${p.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-surface/50 transition-colors group">
                    <div>
                      <p className="font-mono text-sm font-semibold text-primary group-hover:underline">{p.payment_reference}</p>
                      <p className="text-xs text-on-surface-variant capitalize mt-0.5">{p.method?.replace('_', ' ')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatINR(p.amount)}</p>
                        <span className={`text-xs font-medium ${STATUS_COLORS[p.status] ?? ''}`}>{p.status}</span>
                      </div>
                      <ArrowRight size={14} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Rooms */}
          {rooms.length > 0 && (
            <section className="bg-white rounded-xl border border-outline-variant overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-outline-variant bg-surface/60">
                <BedDouble size={14} className="text-primary" />
                <h2 className="font-semibold text-sm text-on-surface">Rooms</h2>
                <span className="ml-auto text-xs text-on-surface-variant">{rooms.length} result{rooms.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-outline-variant/40">
                {rooms.map((r: any) => (
                  <Link key={r.id} href="/admin/rooms"
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-surface/50 transition-colors group">
                    <div>
                      <p className="font-bold text-sm text-on-surface">Room #{r.room_number}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{r.type_name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold ${STATUS_COLORS[r.status] ?? ''}`}>
                        {r.status?.replace('_', ' ')}
                      </span>
                      <ArrowRight size={14} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Empty state — before any search */}
      {!query && !results && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Search size={28} className="text-primary" />
          </div>
          <p className="font-semibold text-on-surface text-lg">Search everything</p>
          <p className="text-sm text-on-surface-variant mt-1 mb-6">
            Find anything across the entire hotel management system
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-on-surface-variant">
            {['Booking references', 'Guest names', 'Email addresses', 'Payment IDs', 'Room numbers'].map(hint => (
              <span key={hint} className="px-3 py-1.5 bg-surface border border-outline-variant rounded-full">{hint}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
