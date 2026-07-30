/**
 * services/analyticsService.ts
 * Phase 8 — Business Intelligence & Analytics Service
 */

export interface BIDashboardStats {
  revenue_today: number;
  revenue_yesterday: number;
  revenue_mtd: number;
  revenue_ytd: number;
  total_rooms: number;
  available_rooms: number;
  occupied_rooms: number;
  reserved_rooms: number;
  maintenance_rooms: number;
  occupancy_rate: number;
  bookings_today: number;
  checkins_today: number;
  checkouts_today: number;
  bookings_pending: number;
  bookings_confirmed: number;
  bookings_checkedin: number;
  bookings_cancelled: number;
  bookings_total: number;
  bookings_completed: number;
  payments_pending_count: number;
  payments_pending_amount: number;
  payments_failed_count: number;
  refunds_total: number;
  refunds_pending: number;
  total_guests: number;
  new_guests_mtd: number;
  avg_rating: number;
  pending_reviews: number;
  total_reviews: number;
  avg_booking_value: number;
  avg_stay_duration: number;
  cancellation_rate: number;
  pending_contacts: number;
  total_contacts: number;
}

export async function getBIDashboardStats(supabase: any): Promise<BIDashboardStats | null> {
  try {
    const { data, error } = await supabase.rpc('get_bi_dashboard_stats');
    if (error) throw error;
    return data as BIDashboardStats;
  } catch (err) {
    console.error('[analyticsService] getBIDashboardStats:', err);
    return null;
  }
}

export async function getBookingAnalytics(supabase: any, days = 30) {
  try {
    const { data } = await supabase.rpc('get_booking_analytics', { p_days: days });
    return data;
  } catch (err) {
    console.error('[analyticsService] getBookingAnalytics:', err);
    return null;
  }
}

export async function getRoomAnalytics(supabase: any, days = 30) {
  try {
    const { data } = await supabase.rpc('get_room_analytics', { p_days: days });
    return data;
  } catch (err) {
    console.error('[analyticsService] getRoomAnalytics:', err);
    return null;
  }
}

export async function getGuestAnalytics(supabase: any, days = 30) {
  try {
    const { data } = await supabase.rpc('get_guest_analytics', { p_days: days });
    return data;
  } catch (err) {
    console.error('[analyticsService] getGuestAnalytics:', err);
    return null;
  }
}

export async function getRevenueData(supabase: any, days = 30) {
  try {
    const { data } = await supabase.rpc('get_daily_revenue', { p_days: days });
    return data ?? [];
  } catch (err) {
    console.error('[analyticsService] getRevenueData:', err);
    return [];
  }
}

export async function globalSearch(supabase: any, query: string) {
  if (!query || query.trim().length < 2) return null;
  try {
    const { data } = await supabase.rpc('global_search', { p_query: query.trim(), p_limit: 10 });
    return data;
  } catch (err) {
    console.error('[analyticsService] globalSearch:', err);
    return null;
  }
}

/** Track an analytics event (fire-and-forget, never throws) */
export async function trackEvent(
  supabase: any,
  eventType: string,
  params?: { entityType?: string; entityId?: string; metadata?: Record<string, unknown> }
) {
  try {
    await supabase.from('analytics_events').insert({
      event_type: eventType,
      entity_type: params?.entityType,
      entity_id: params?.entityId,
      metadata: params?.metadata ?? {},
    });
  } catch { /* Non-fatal */ }
}

/** Convert array of objects to CSV string */
export function toCSV(data: Record<string, unknown>[], headers?: string[]): string {
  if (!data.length) return '';
  const keys = headers ?? Object.keys(data[0]);
  const escape = (val: unknown) => {
    const s = String(val ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(','), ...data.map(row => keys.map(k => escape((row as any)[k])).join(','))].join('\n');
}

/** Download a CSV file from the browser */
export function downloadCSV(data: Record<string, unknown>[], filename: string, headers?: string[]) {
  const csv = toCSV(data, headers);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
