'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/providers/SupabaseProvider';
import { getAllBookings, confirmBooking, checkInBooking, checkOutBooking } from '@/services/bookingService';
import { formatINR, formatDate } from '@/services/pricingService';
import { useBookingRealtime } from '@/hooks/useBookingRealtime';
import { toast } from 'sonner';
import {
  Plus, Search, RefreshCw, LogIn, LogOut, CheckCircle,
  Eye, ChevronLeft, ChevronRight, BedDouble, TrendingUp, Clock, Users, Banknote
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Pending',     color: 'bg-yellow-100 text-yellow-700' },
  confirmed:   { label: 'Confirmed',   color: 'bg-blue-100 text-blue-700' },
  checked_in:  { label: 'Checked In',  color: 'bg-green-100 text-green-700' },
  checked_out: { label: 'Checked Out', color: 'bg-gray-100 text-gray-600' },
  cancelled:   { label: 'Cancelled',   color: 'bg-red-100 text-red-700' },
  no_show:     { label: 'No Show',     color: 'bg-orange-100 text-orange-700' },
  waitlisted:  { label: 'Waitlisted',  color: 'bg-purple-100 text-purple-700' },
};

const PER_PAGE = 25;

export default function AdminBookingsPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data, count, error } = await getAllBookings(supabase as any, {
      status: statusFilter || undefined,
      checkInFrom: dateFrom || undefined,
      checkInTo: dateTo || undefined,
      page,
      perPage: PER_PAGE,
    });
    if (!error) {
      setBookings(data ?? []);
      setTotal(count ?? 0);
    }
    setIsLoading(false);
  }, [supabase, statusFilter, dateFrom, dateTo, page]);

  useEffect(() => { load(); }, [load]);

  // Realtime — reload on any booking change
  useBookingRealtime(supabase as any, { onBookingChange: () => load() });

  const handleConfirm = async (bookingId: string) => {
    setActionLoadingId(bookingId);
    const { error } = await confirmBooking(supabase as any, bookingId);
    if (error) toast.error('Failed to confirm booking');
    else { toast.success('Booking confirmed'); load(); }
    setActionLoadingId(null);
  };

  const handleCheckIn = async (bookingId: string, roomId: string) => {
    setActionLoadingId(bookingId);
    const { error } = await checkInBooking(supabase as any, bookingId, roomId);
    if (error) toast.error('Check-in failed');
    else { toast.success('Guest checked in!'); load(); }
    setActionLoadingId(null);
  };

  const handleCheckOut = async (bookingId: string, roomId: string) => {
    setActionLoadingId(bookingId);
    const { error } = await checkOutBooking(supabase as any, bookingId, roomId);
    if (error) toast.error('Check-out failed');
    else { toast.success('Guest checked out. Room marked dirty.'); load(); }
    setActionLoadingId(null);
  };

  // Client-side search filter
  const filtered = search.trim()
    ? bookings.filter(b => {
        const name = (Array.isArray(b.profiles) ? b.profiles[0]?.full_name : b.profiles?.full_name ?? '').toLowerCase();
        const ref = b.booking_reference?.toLowerCase() ?? '';
        const q = search.toLowerCase();
        return name.includes(q) || ref.includes(q);
      })
    : bookings;

  // KPI stats from current page data
  const stats = {
    total: total,
    checkedIn: bookings.filter(b => b.status === 'checked_in').length,
    todayCheckIns: bookings.filter(b => b.check_in === today && b.status === 'confirmed').length,
    revenue: bookings.filter(b => !['cancelled', 'no_show'].includes(b.status))
      .reduce((s, b) => s + Number(b.total_amount || 0), 0),
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">Booking Management</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Manage all reservations, check-ins and check-outs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 border border-outline-variant rounded-lg hover:bg-surface transition-colors" title="Refresh">
            <RefreshCw size={16} className="text-on-surface-variant" />
          </button>
          <Link href="/admin/bookings/new" className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors">
            <Plus size={16} /> New Booking
          </Link>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Bookings', value: stats.total, icon: BedDouble, color: 'bg-blue-50 text-blue-600' },
          { label: 'Currently In-House', value: stats.checkedIn, icon: Users, color: 'bg-green-50 text-green-600' },
          { label: "Today's Check-ins", value: stats.todayCheckIns, icon: LogIn, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Est. Revenue', value: formatINR(stats.revenue), icon: TrendingUp, color: 'bg-purple-50 text-purple-600', isText: true },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-outline-variant p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.icon size={16} />
            </div>
            <div>
              <p className="font-heading font-bold text-lg text-on-surface leading-tight">
                {s.isText ? s.value : s.value}
              </p>
              <p className="text-xs text-on-surface-variant">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-outline-variant p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="search"
            placeholder="Search by guest name or booking ref…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-outline-variant rounded-lg text-sm bg-white"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={e => { setDateFrom(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-outline-variant rounded-lg text-sm"
          placeholder="Check-in from"
        />
        <input
          type="date"
          value={dateTo}
          onChange={e => { setDateTo(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-outline-variant rounded-lg text-sm"
          placeholder="Check-in to"
        />
        {(statusFilter || dateFrom || dateTo || search) && (
          <button
            onClick={() => { setStatusFilter(''); setDateFrom(''); setDateTo(''); setSearch(''); setPage(1); }}
            className="px-3 py-2 text-sm text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-outline-variant overflow-x-auto">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 bg-surface rounded animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <BedDouble size={40} className="mx-auto text-outline-variant mb-3" />
            <p className="font-semibold text-on-surface">No bookings found</p>
            <p className="text-sm text-on-surface-variant mt-1">Try adjusting your filters or create a new booking.</p>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-surface border-b border-outline-variant">
              <tr>
                {['Ref #', 'Guest', 'Room', 'Check-in', 'Check-out', 'Nights', 'Amount', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map((b: any) => {
                const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
                const br = Array.isArray(b.booking_rooms) ? b.booking_rooms[0] : b.booking_rooms;
                const room = br?.rooms;
                const roomType = br?.room_types;
                const sc = STATUS_CONFIG[b.status] ?? { label: b.status, color: 'bg-gray-100 text-gray-600' };
                const isToday = b.check_in === today;
                const isLoading = actionLoadingId === b.id;

                return (
                  <tr key={b.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">{b.booking_reference}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-on-surface">{profile?.full_name ?? '—'}</p>
                      <p className="text-xs text-on-surface-variant">{profile?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{roomType?.name ?? '—'}</p>
                      {room?.room_number && <p className="text-xs text-on-surface-variant">Room {room.room_number}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className={isToday ? 'font-semibold text-primary' : ''}>{formatDate(b.check_in)}</p>
                      {isToday && <p className="text-xs text-primary">Today</p>}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{formatDate(b.check_out)}</td>
                    <td className="px-4 py-3 text-center">{b.nights}</td>
                    <td className="px-4 py-3 font-semibold text-primary">{formatINR(Number(b.total_amount))}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${sc.color}`}>{sc.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/admin/bookings/${b.id}`} className="p-1.5 hover:bg-surface rounded text-on-surface-variant hover:text-primary" title="View">
                          <Eye size={14} />
                        </Link>
                        {/* Confirmed: check-in only if PAID, else show collect payment link */}
                        {b.status === 'confirmed' && b.payment_status === 'paid' && (
                          <button onClick={() => handleCheckIn(b.id, room?.id ?? br?.room_id)} disabled={isLoading} className="p-1.5 hover:bg-green-50 rounded text-green-600 disabled:opacity-40" title="Check In">
                            <LogIn size={14} />
                          </button>
                        )}
                        {b.status === 'confirmed' && b.payment_status !== 'paid' && (
                          <Link href={`/admin/bookings/${b.id}`} className="p-1.5 hover:bg-amber-50 rounded text-amber-600" title="Collect Payment">
                            <Banknote size={14} />
                          </Link>
                        )}
                        {/* Pending: also show collect payment instead of just confirm */}
                        {b.status === 'pending' && b.payment_status !== 'paid' && (
                          <Link href={`/admin/bookings/${b.id}`} className="p-1.5 hover:bg-amber-50 rounded text-amber-600" title="Collect Payment">
                            <Banknote size={14} />
                          </Link>
                        )}
                        {b.status === 'checked_in' && (
                          <button onClick={() => handleCheckOut(b.id, room?.id ?? br?.room_id)} disabled={isLoading} className="p-1.5 hover:bg-orange-50 rounded text-orange-600 disabled:opacity-40" title="Check Out">
                            <LogOut size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-on-surface-variant">
            Showing {((page - 1) * PER_PAGE) + 1}–{Math.min(page * PER_PAGE, total)} of {total} bookings
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-outline-variant rounded-lg hover:bg-surface disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-2 border border-outline-variant rounded-lg bg-white font-medium">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 border border-outline-variant rounded-lg hover:bg-surface disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
