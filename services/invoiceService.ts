/**
 * services/invoiceService.ts — Phase 6 Invoice Service
 */
import type { SupabaseClient } from '@supabase/supabase-js';

type Client = SupabaseClient<any>;

export async function generateInvoice(client: Client, bookingId: string) {
  const db = client as any;
  const { data, error } = await db.rpc('generate_invoice_record', { p_booking_id: bookingId });
  return { data, error };
}

export async function getInvoiceByBooking(client: Client, bookingId: string) {
  const db = client as any;
  return db
    .from('invoices')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();
}

export async function getInvoicesByGuest(client: Client, guestId: string) {
  const db = client as any;
  return db
    .from('invoices')
    .select('id, invoice_number, total_amount, issued_at, booking_id')
    .eq('guest_id', guestId)
    .order('issued_at', { ascending: false });
}

export async function getAllInvoices(client: Client, page = 1, perPage = 25) {
  const db = client as any;
  return db
    .from('invoices')
    .select('id, invoice_number, guest_name, guest_email, total_amount, currency, issued_at, booking_id', { count: 'exact' })
    .order('issued_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);
}
