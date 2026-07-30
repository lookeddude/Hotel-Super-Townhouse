'use client';
/**
 * hooks/useBookingRealtime.ts
 * Supabase Realtime subscriptions for bookings, rooms, and dashboard KPIs.
 */
import { useEffect, useRef } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

export function useBookingRealtime(
  supabase: SupabaseClient<any>,
  callbacks: {
    onBookingChange?: (payload: any) => void;
    onRoomChange?: (payload: any) => void;
  }
) {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    channelRef.current = supabase
      .channel('booking-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
        callbacks.onBookingChange?.(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, (payload) => {
        callbacks.onRoomChange?.(payload);
      })
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);
}
