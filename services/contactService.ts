/**
 * services/contactService.ts — corrected to match DB schema
 * DB columns: id, full_name, email, phone, subject, message, source, is_read, is_replied,
 *             replied_at, replied_by, reply_text, created_at, updated_at
 */

import type { SupabaseClient } from '@supabase/supabase-js';

type Client = SupabaseClient<any>;

export async function getContactMessages(
  client: Client,
  options?: { resolved?: boolean; page?: number; perPage?: number; search?: string }
) {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = client
    .from('contact_messages')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (typeof options?.resolved === 'boolean') {
    query = query.eq('is_replied', options.resolved);
  }
  if (options?.search) {
    query = query.or(
      `full_name.ilike.%${options.search}%,email.ilike.%${options.search}%,subject.ilike.%${options.search}%`
    );
  }
  return query;
}

export async function markContactResolved(client: Client, id: string, resolved: boolean) {
  return client
    .from('contact_messages')
    .update({ is_replied: resolved, replied_at: resolved ? new Date().toISOString() : null })
    .eq('id', id)
    .select()
    .single();
}

export async function markContactRead(client: Client, id: string) {
  return client.from('contact_messages').update({ is_read: true }).eq('id', id);
}

export async function deleteContactMessage(client: Client, id: string) {
  return client.from('contact_messages').delete().eq('id', id);
}

export async function submitContactForm(
  client: Client,
  data: { full_name: string; email: string; phone?: string; subject: string; message: string }
) {
  // Do NOT use .select().single() after insert — anon users have no SELECT policy
  const { error } = await client.from('contact_messages').insert({
    ...data,
    source: 'website',
  });
  return { error };
}
