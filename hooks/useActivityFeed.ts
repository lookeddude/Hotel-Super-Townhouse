'use client';
/**
 * hooks/useActivityFeed.ts
 * Phase 9 — Realtime Activity Feed Hook
 */
import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { getActivityFeed, type ActivityFeedEntry } from '@/services/activityFeedService';

export function useActivityFeed(limit = 20) {
  const { supabase } = useSupabase();
  const [feed,    setFeed]    = useState<ActivityFeedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const entries = await getActivityFeed(supabase, { limit });
    setFeed(entries);
    setLoading(false);
  }, [supabase, limit]);

  useEffect(() => { void load(); }, [load]);

  // Realtime subscription
  useEffect(() => {
    const channel = (supabase as any)
      .channel('activity-feed-rt')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_feed' },
        (payload: any) => {
          setFeed(prev => [payload.new as ActivityFeedEntry, ...prev.slice(0, limit - 1)]);
        }
      )
      .subscribe();
    return () => { (supabase as any).removeChannel(channel); };
  }, [supabase, limit]);

  return { feed, loading, refresh: load };
}
