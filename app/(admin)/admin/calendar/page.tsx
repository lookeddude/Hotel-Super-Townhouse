'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/providers/SupabaseProvider';
import { getBookingCalendar } from '@/services/bookingService';
import { useBookingRealtime } from '@/hooks/useBookingRealtime';
import { formatDate } from '@/services/pricingService';
import { ChevronLeft, ChevronRight, Plus, Calendar, List } from 'lucide-react';

const STATUS_PILL: Record<string, string> = {
  pending:     'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed:   'bg-blue-100 text-blue-800 border-blue-200',
  checked_in:  'bg-green-100 text-green-800 border-green-200',
  checked_out: 'bg-gray-100 text-gray-600 border-gray-200',
  waitlisted:  'bg-purple-100 text-purple-800 border-purple-200',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function toISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function AdminCalendarPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const today = new Date();
  today.setHours(0,0,0,0);

  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [view, setView] = useState<'month' | 'week'>('month');
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getMonthRange = (d: Date) => {
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return { start: toISO(start), end: toISO(end) };
  };

  const getWeekRange = (d: Date) => {
    const mon = new Date(d);
    mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { start: toISO(mon), end: toISO(sun) };
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    const { start, end } = view === 'month' ? getMonthRange(viewDate) : getWeekRange(viewDate);
    const { data } = await getBookingCalendar(supabase as any, start, end);
    setBookings(data ?? []);
    setIsLoading(false);
  }, [supabase, viewDate, view]);

  useEffect(() => { load(); }, [load]);
  useBookingRealtime(supabase as any, { onBookingChange: () => load() });

  const prev = () => {
    if (view === 'month') setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    else setViewDate(d => { const n = new Date(d); n.setDate(d.getDate() - 7); return n; });
  };
  const next = () => {
    if (view === 'month') setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    else setViewDate(d => { const n = new Date(d); n.setDate(d.getDate() + 7); return n; });
  };

  const getBookingsForDate = (dateStr: string) => {
    return bookings.filter(b => {
      return b.check_in <= dateStr && b.check_out > dateStr;
    });
  };

  // Build month calendar cells
  const buildMonthCells = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  };

  // Build week days
  const buildWeekDays = () => {
    const { start } = getWeekRange(viewDate);
    const startDate = new Date(start);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return d;
    });
  };

  const monthCells = buildMonthCells();
  const weekDays = buildWeekDays();

  const title = view === 'month'
    ? `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`
    : `Week of ${formatDate(toISO(buildWeekDays()[0]))}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">Reservation Calendar</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Live view of all bookings and room availability</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/bookings/new" className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors">
            <Plus size={15} /> New Booking
          </Link>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-outline-variant p-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prev} className="p-2 hover:bg-surface rounded-lg transition-colors"><ChevronLeft size={18} /></button>
          <button onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))} className="px-3 py-1.5 text-xs border border-outline-variant rounded-lg hover:bg-surface">Today</button>
          <button onClick={next} className="p-2 hover:bg-surface rounded-lg transition-colors"><ChevronRight size={18} /></button>
          <h2 className="font-heading font-semibold text-base text-on-surface ml-2">{title}</h2>
        </div>
        <div className="flex gap-1 bg-surface rounded-lg p-1">
          <button onClick={() => setView('month')} className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${view === 'month' ? 'bg-white shadow-sm text-on-surface' : 'text-on-surface-variant'}`}>
            <Calendar size={13} /> Month
          </button>
          <button onClick={() => setView('week')} className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${view === 'week' ? 'bg-white shadow-sm text-on-surface' : 'text-on-surface-variant'}`}>
            <List size={13} /> Week
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap text-xs">
        {Object.entries(STATUS_PILL).map(([status, cls]) => (
          <div key={status} className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${cls}`}>
            <div className="w-2 h-2 rounded-full bg-current opacity-60" />
            {status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : view === 'month' ? (
          <>
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-outline-variant">
              {DAYS.map(d => (
                <div key={d} className="py-2.5 text-center text-xs font-semibold text-on-surface-variant">{d}</div>
              ))}
            </div>
            {/* Cells */}
            <div className="grid grid-cols-7">
              {monthCells.map((date, i) => {
                if (!date) return <div key={i} className="h-24 border-b border-r border-outline-variant bg-surface/40 last:border-r-0" />;
                const dateStr = toISO(date);
                const dayBookings = getBookingsForDate(dateStr);
                const isToday = toISO(today) === dateStr;
                const isPast = date < today;
                return (
                  <div
                    key={i}
                    onClick={() => router.push(`/admin/bookings/new?checkIn=${dateStr}`)}
                    className={`h-24 border-b border-r border-outline-variant p-1 cursor-pointer hover:bg-primary/5 transition-colors overflow-hidden last:border-r-0 ${isPast ? 'bg-surface/30' : ''}`}
                  >
                    <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white' : 'text-on-surface-variant'}`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      {dayBookings.slice(0, 3).map((b: any) => {
                        const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
                        const pillCls = STATUS_PILL[b.status] ?? 'bg-gray-100 text-gray-600 border-gray-200';
                        return (
                          <div
                            key={b.id}
                            onClick={e => { e.stopPropagation(); router.push(`/admin/bookings/${b.id}`); }}
                            className={`text-[10px] px-1.5 py-0.5 rounded border truncate cursor-pointer hover:opacity-80 ${pillCls}`}
                          >
                            {profile?.full_name?.split(' ')[0] ?? 'Guest'}
                          </div>
                        );
                      })}
                      {dayBookings.length > 3 && (
                        <div className="text-[10px] text-on-surface-variant px-1">+{dayBookings.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Week View */
          <div>
            <div className="grid grid-cols-8 border-b border-outline-variant">
              <div className="py-3 px-3 text-xs font-semibold text-on-surface-variant">Time</div>
              {weekDays.map((d) => {
                const isToday = toISO(d) === toISO(today);
                return (
                  <div key={d.toString()} className={`py-3 text-center ${isToday ? 'bg-primary/5' : ''}`}>
                    <p className="text-xs text-on-surface-variant">{DAYS[d.getDay()]}</p>
                    <p className={`text-sm font-bold mt-0.5 ${isToday ? 'text-primary' : 'text-on-surface'}`}>{d.getDate()}</p>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-8 min-h-[400px]">
              <div className="border-r border-outline-variant p-3 text-xs text-on-surface-variant space-y-8">
                {['Check-In', 'Active', 'Check-Out'].map(t => <p key={t}>{t}</p>)}
              </div>
              {weekDays.map((d) => {
                const dateStr = toISO(d);
                const dayBookings = getBookingsForDate(dateStr);
                const checkIns = dayBookings.filter(b => b.check_in === dateStr);
                const checkOuts = dayBookings.filter(b => b.check_out === dateStr);
                const active = dayBookings.filter(b => b.check_in < dateStr && b.check_out > dateStr);
                const isToday = dateStr === toISO(today);
                return (
                  <div key={dateStr} className={`border-r border-outline-variant last:border-r-0 p-2 space-y-3 ${isToday ? 'bg-primary/5' : ''}`}>
                    <div className="space-y-1 min-h-[80px]">
                      {checkIns.map(b => {
                        const p = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
                        return (
                          <Link key={b.id} href={`/admin/bookings/${b.id}`} className={`block text-[10px] px-1.5 py-0.5 rounded border truncate ${STATUS_PILL[b.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            ↓ {p?.full_name?.split(' ')[0]}
                          </Link>
                        );
                      })}
                    </div>
                    <div className="space-y-1 min-h-[80px]">
                      {active.map(b => {
                        const p = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
                        return (
                          <Link key={b.id} href={`/admin/bookings/${b.id}`} className={`block text-[10px] px-1.5 py-0.5 rounded border truncate ${STATUS_PILL[b.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {p?.full_name?.split(' ')[0]}
                          </Link>
                        );
                      })}
                    </div>
                    <div className="space-y-1 min-h-[80px]">
                      {checkOuts.map(b => {
                        const p = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
                        return (
                          <Link key={b.id} href={`/admin/bookings/${b.id}`} className={`block text-[10px] px-1.5 py-0.5 rounded border truncate bg-gray-100 text-gray-600 border-gray-200`}>
                            ↑ {p?.full_name?.split(' ')[0]}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Booking Count */}
      <p className="text-xs text-on-surface-variant text-right">
        {bookings.length} reservation{bookings.length !== 1 ? 's' : ''} in view · Live updates enabled
      </p>
    </div>
  );
}
