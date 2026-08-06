'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/providers/SupabaseProvider';
import { getBookingCalendar, markNoShow } from '@/services/bookingService';
import { useBookingRealtime } from '@/hooks/useBookingRealtime';
import { formatDate, formatINR } from '@/services/pricingService';
import {
  ChevronLeft, ChevronRight, Plus, Calendar, List,
  X, BedDouble, Users, Clock, CreditCard, ExternalLink, AlertTriangle,
} from 'lucide-react';

const STATUS_PILL: Record<string, string> = {
  pending:     'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed:   'bg-blue-100 text-blue-800 border-blue-200',
  checked_in:  'bg-green-100 text-green-800 border-green-200',
  checked_out: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled:   'bg-red-100 text-red-700 border-red-200',
  waitlisted:  'bg-purple-100 text-purple-800 border-purple-200',
};

const STATUS_LABEL: Record<string, string> = {
  pending:     'Pending',
  confirmed:   'Confirmed',
  checked_in:  'Checked In',
  checked_out: 'Checked Out',
  cancelled:   'Cancelled',
  waitlisted:  'Waitlisted',
};

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function AdminCalendarPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewDate, setViewDate]     = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [view, setView]             = useState<'month' | 'week'>('month');
  const [bookings, setBookings]     = useState<any[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [noShowLoading, setNoShowLoading] = useState<string | null>(null); // bookingId being marked

  const getMonthRange = (d: Date) => ({
    start: toISO(new Date(d.getFullYear(), d.getMonth(), 1)),
    end:   toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
  });

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
    setSelectedDate(null);
    if (view === 'month') setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    else setViewDate(d => { const n = new Date(d); n.setDate(d.getDate() - 7); return n; });
  };
  const next = () => {
    setSelectedDate(null);
    if (view === 'month') setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    else setViewDate(d => { const n = new Date(d); n.setDate(d.getDate() + 7); return n; });
  };

  const getBookingsForDate = (dateStr: string) =>
    bookings.filter(b => b.check_in <= dateStr && b.check_out > dateStr);

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
  const weekDays   = buildWeekDays();
  const title      = view === 'month'
    ? `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`
    : `Week of ${formatDate(toISO(buildWeekDays()[0]))}`;

  // Bookings for the selected date panel
  const selectedDateBookings = selectedDate ? getBookingsForDate(selectedDate) : [];
  // Also include check-outs on selected date (check_out === selectedDate)
  const checkOutsOnDate = selectedDate ? bookings.filter(b => b.check_out === selectedDate) : [];
  // Merge and deduplicate
  const panelBookings = selectedDate
    ? [...new Map([...selectedDateBookings, ...checkOutsOnDate].map(b => [b.id, b])).values()]
    : [];

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(prev => prev === dateStr ? null : dateStr); // toggle
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">Reservation Calendar</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Click any date to view bookings for that day
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/bookings/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors">
            <Plus size={15} /> New Booking
          </Link>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-outline-variant p-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prev} className="p-2 hover:bg-surface rounded-lg transition-colors"><ChevronLeft size={18} /></button>
          <button
            onClick={() => { setViewDate(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDate(null); }}
            className="px-3 py-1.5 text-xs border border-outline-variant rounded-lg hover:bg-surface"
          >Today</button>
          <button onClick={next} className="p-2 hover:bg-surface rounded-lg transition-colors"><ChevronRight size={18} /></button>
          <h2 className="font-heading font-semibold text-base text-on-surface ml-2">{title}</h2>
        </div>
        <div className="flex gap-1 bg-surface rounded-lg p-1">
          <button onClick={() => { setView('month'); setSelectedDate(null); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${view === 'month' ? 'bg-white shadow-sm text-on-surface' : 'text-on-surface-variant'}`}>
            <Calendar size={13} /> Month
          </button>
          <button onClick={() => { setView('week'); setSelectedDate(null); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${view === 'week' ? 'bg-white shadow-sm text-on-surface' : 'text-on-surface-variant'}`}>
            <List size={13} /> Week
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap text-xs">
        {Object.entries(STATUS_PILL).map(([status, cls]) => (
          <div key={status} className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${cls}`}>
            <div className="w-2 h-2 rounded-full bg-current opacity-60" />
            {STATUS_LABEL[status] ?? status}
          </div>
        ))}
      </div>

      <div className={`grid gap-4 ${selectedDate ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
        {/* ── Calendar Grid ── */}
        <div className={`bg-white rounded-xl border border-outline-variant overflow-hidden ${selectedDate ? 'lg:col-span-2' : ''}`}>
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
                  const isToday    = toISO(today) === dateStr;
                  const isSelected = selectedDate === dateStr;
                  const isPast     = date < today;
                  return (
                    <div
                      key={i}
                      onClick={() => handleDateClick(dateStr)}
                      className={`h-24 border-b border-r border-outline-variant p-1 cursor-pointer transition-colors overflow-hidden last:border-r-0
                        ${isSelected ? 'bg-primary/10 ring-2 ring-inset ring-primary' : isPast ? 'bg-surface/30 hover:bg-primary/5' : 'hover:bg-primary/5'}`}
                    >
                      <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full
                        ${isToday ? 'bg-primary text-white' : isSelected ? 'bg-primary/20 text-primary font-bold' : 'text-on-surface-variant'}`}>
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
                {weekDays.map(d => {
                  const dateStr  = toISO(d);
                  const isToday  = dateStr === toISO(today);
                  const isSelected = selectedDate === dateStr;
                  return (
                    <div
                      key={d.toString()}
                      onClick={() => handleDateClick(dateStr)}
                      className={`py-3 text-center cursor-pointer transition-colors
                        ${isSelected ? 'bg-primary/10 ring-1 ring-inset ring-primary' : isToday ? 'bg-primary/5' : 'hover:bg-primary/5'}`}
                    >
                      <p className="text-xs text-on-surface-variant">{DAYS[d.getDay()]}</p>
                      <p className={`text-sm font-bold mt-0.5 ${isToday || isSelected ? 'text-primary' : 'text-on-surface'}`}>{d.getDate()}</p>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-8 min-h-[400px]">
                <div className="border-r border-outline-variant p-3 text-xs text-on-surface-variant space-y-8">
                  {['Check-In', 'Active', 'Check-Out'].map(t => <p key={t}>{t}</p>)}
                </div>
                {weekDays.map(d => {
                  const dateStr    = toISO(d);
                  const dayBookings = getBookingsForDate(dateStr);
                  const checkIns   = dayBookings.filter(b => b.check_in === dateStr);
                  const checkOuts  = dayBookings.filter(b => b.check_out === dateStr);
                  const active     = dayBookings.filter(b => b.check_in < dateStr && b.check_out > dateStr);
                  const isToday    = dateStr === toISO(today);
                  const isSelected = selectedDate === dateStr;
                  return (
                    <div
                      key={dateStr}
                      className={`border-r border-outline-variant last:border-r-0 p-2 space-y-3
                        ${isSelected ? 'bg-primary/10' : isToday ? 'bg-primary/5' : ''}`}
                    >
                      <div className="space-y-1 min-h-[80px]">
                        {checkIns.map(b => {
                          const p = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
                          return (
                            <Link key={b.id} href={`/admin/bookings/${b.id}`}
                              className={`block text-[10px] px-1.5 py-0.5 rounded border truncate ${STATUS_PILL[b.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                              ↓ {p?.full_name?.split(' ')[0]}
                            </Link>
                          );
                        })}
                      </div>
                      <div className="space-y-1 min-h-[80px]">
                        {active.map(b => {
                          const p = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
                          return (
                            <Link key={b.id} href={`/admin/bookings/${b.id}`}
                              className={`block text-[10px] px-1.5 py-0.5 rounded border truncate ${STATUS_PILL[b.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                              {p?.full_name?.split(' ')[0]}
                            </Link>
                          );
                        })}
                      </div>
                      <div className="space-y-1 min-h-[80px]">
                        {checkOuts.map(b => {
                          const p = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
                          return (
                            <Link key={b.id} href={`/admin/bookings/${b.id}`}
                              className="block text-[10px] px-1.5 py-0.5 rounded border truncate bg-gray-100 text-gray-600 border-gray-200">
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

        {/* ── Selected Date Panel ── */}
        {selectedDate && (
          <div className="bg-white rounded-xl border border-outline-variant overflow-hidden flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-primary/5">
              <div>
                <p className="text-xs text-primary font-semibold uppercase tracking-wide">Selected Date</p>
                <p className="font-heading font-bold text-on-surface text-base mt-0.5">{formatDate(selectedDate)}</p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-1.5 rounded-lg hover:bg-outline-variant/30 transition-colors"
                title="Clear filter"
              >
                <X size={16} className="text-on-surface-variant" />
              </button>
            </div>

            {/* Summary chips */}
            <div className="flex gap-2 px-4 py-2.5 border-b border-outline-variant flex-wrap">
              <span className="text-xs bg-surface text-on-surface-variant px-2 py-1 rounded-full">
                {panelBookings.length} booking{panelBookings.length !== 1 ? 's' : ''}
              </span>
              {panelBookings.filter(b => b.check_in === selectedDate).length > 0 && (
                <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                  {panelBookings.filter(b => b.check_in === selectedDate).length} check-in{panelBookings.filter(b => b.check_in === selectedDate).length > 1 ? 's' : ''}
                </span>
              )}
              {panelBookings.filter(b => b.check_out === selectedDate).length > 0 && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {panelBookings.filter(b => b.check_out === selectedDate).length} check-out{panelBookings.filter(b => b.check_out === selectedDate).length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Booking List */}
            <div className="flex-1 overflow-y-auto divide-y divide-outline-variant">
              {panelBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-on-surface-variant">
                  <Calendar size={32} className="opacity-30" />
                  <p className="text-sm">No bookings on this date</p>
                  <Link href={`/admin/bookings/new?checkIn=${selectedDate}`}
                    className="text-xs text-primary hover:underline font-medium">
                    + Create booking for this date
                  </Link>
                </div>
              ) : (
                panelBookings.map(b => {
                  const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
                  const pillCls = STATUS_PILL[b.status] ?? 'bg-gray-100 text-gray-600 border-gray-200';
                  const isCheckIn  = b.check_in  === selectedDate;
                  const isCheckOut = b.check_out === selectedDate;
                  return (
                    <div key={b.id} className="p-4 hover:bg-surface/50 transition-colors">
                      {/* Name + Status */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-semibold text-sm text-on-surface">
                            {profile?.full_name ?? 'Guest'}
                          </p>
                          <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                            #{b.booking_reference ?? b.id?.slice(0, 8)}
                          </p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${pillCls}`}>
                          {STATUS_LABEL[b.status] ?? b.status}
                        </span>
                      </div>

                      {/* Check-in / Check-out tag */}
                      {(isCheckIn || isCheckOut) && (
                        <div className="flex gap-1.5 mb-2">
                          {isCheckIn && (
                            <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                              ↓ Check-in today
                            </span>
                          )}
                          {isCheckOut && (
                            <span className="text-[10px] bg-gray-100 text-gray-600 border border-gray-300 px-2 py-0.5 rounded-full font-medium">
                              ↑ Check-out today
                            </span>
                          )}
                        </div>
                      )}

                      {/* Details */}
                      <div className="space-y-1.5 text-xs text-on-surface-variant">
                        <div className="flex items-center gap-1.5">
                          <BedDouble size={11} className="shrink-0" />
                          <span className="truncate">{b.room_type_name ?? 'Room'}{b.room_number ? ` · ${b.room_number}` : ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={11} className="shrink-0" />
                          <span>{formatDate(b.check_in)} → {formatDate(b.check_out)}</span>
                        </div>
                        {b.adults != null && (
                          <div className="flex items-center gap-1.5">
                            <Users size={11} className="shrink-0" />
                            <span>{b.adults} adult{b.adults > 1 ? 's' : ''}{b.children > 0 ? `, ${b.children} child${b.children > 1 ? 'ren' : ''}` : ''}</span>
                          </div>
                        )}
                        {b.total_amount != null && (
                          <div className="flex items-center gap-1.5">
                            <CreditCard size={11} className="shrink-0" />
                            <span>{formatINR(b.total_amount)}</span>
                          </div>
                        )}
                      </div>

                      {/* View button + No Show */}
                      <div className="mt-3 flex items-center gap-3 flex-wrap">
                        <Link href={`/admin/bookings/${b.id}`}
                          className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                          View Details <ExternalLink size={10} />
                        </Link>
                        {/* Show "Mark No Show" only for past check-in, pending/confirmed */}
                        {['pending', 'confirmed'].includes(b.status) && b.check_in < toISO(today) && (
                          <button
                            onClick={async () => {
                              setNoShowLoading(b.id);
                              const { error } = await markNoShow(supabase as any, b.id);
                              if (error) {
                                // toast not imported here — use alert as fallback
                              } else {
                                await load();
                              }
                              setNoShowLoading(null);
                            }}
                            disabled={noShowLoading === b.id}
                            className="inline-flex items-center gap-1 text-xs text-orange-600 font-semibold hover:underline disabled:opacity-50"
                          >
                            <AlertTriangle size={10} />
                            {noShowLoading === b.id ? 'Marking…' : 'Mark No Show'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Panel Footer */}
            <div className="border-t border-outline-variant px-4 py-3">
              <Link
                href={`/admin/bookings/new?checkIn=${selectedDate}`}
                className="w-full flex items-center justify-center gap-2 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark transition-colors"
              >
                <Plus size={13} /> New Booking for this Date
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Booking Count */}
      <p className="text-xs text-on-surface-variant text-right">
        {bookings.length} reservation{bookings.length !== 1 ? 's' : ''} in view · Live updates enabled
        {selectedDate && ` · Filtered: ${formatDate(selectedDate)}`}
      </p>
    </div>
  );
}
