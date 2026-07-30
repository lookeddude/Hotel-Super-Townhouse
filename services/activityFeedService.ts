/**
 * services/activityFeedService.ts
 * Phase 9 — Activity Feed Service
 */

export interface ActivityFeedEntry {
  id:          string;
  event_type:  string;
  actor_id?:   string;
  actor_name?: string;
  entity_type?: string;
  entity_id?:  string;
  title:       string;
  description?: string;
  icon?:       string;
  color?:      string;
  link_href?:  string;
  metadata:    Record<string, unknown>;
  created_at:  string;
}

export interface CreateActivityPayload {
  eventType:   string;
  actorId?:    string;
  actorName?:  string;
  entityType?: string;
  entityId?:   string;
  title:       string;
  description?: string;
  icon?:       string;
  color?:      string;
  linkHref?:   string;
  metadata?:   Record<string, unknown>;
}

/** Create a single activity feed entry */
export async function createActivityFeedEntry(
  supabase: any,
  payload: CreateActivityPayload
): Promise<string | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('activity_feed')
      .insert({
        event_type:  payload.eventType,
        actor_id:    payload.actorId,
        actor_name:  payload.actorName,
        entity_type: payload.entityType,
        entity_id:   payload.entityId,
        title:       payload.title,
        description: payload.description,
        icon:        payload.icon ?? 'Activity',
        color:       payload.color ?? 'primary',
        link_href:   payload.linkHref,
        metadata:    payload.metadata ?? {},
      })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  } catch (err) {
    console.error('[activityFeedService] createEntry:', err);
    return null;
  }
}

/** Fetch recent activity feed entries */
export async function getActivityFeed(
  supabase: any,
  options?: { limit?: number; offset?: number; eventType?: string }
): Promise<ActivityFeedEntry[]> {
  try {
    let query = (supabase as any)
      .from('activity_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(options?.limit ?? 30);

    if (options?.offset)    query = query.range(options.offset, options.offset + (options.limit ?? 30) - 1);
    if (options?.eventType) query = query.eq('event_type', options.eventType);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as ActivityFeedEntry[];
  } catch (err) {
    console.error('[activityFeedService] getActivityFeed:', err);
    return [];
  }
}

/** Delete an activity feed entry (admin only) */
export async function deleteActivityFeedEntry(supabase: any, id: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any).from('activity_feed').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/** Clear old feed entries (older than N days) */
export async function clearOldFeedEntries(supabase: any, olderThanDays = 90): Promise<number> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    const { data, error } = await (supabase as any)
      .from('activity_feed')
      .delete()
      .lt('created_at', cutoff.toISOString())
      .select('id');
    if (error) throw error;
    return (data ?? []).length;
  } catch {
    return 0;
  }
}
