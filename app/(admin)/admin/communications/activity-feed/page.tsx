'use client';
/**
 * Phase 9 — Admin Activity Feed Full View
 */
import { useState, useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { deleteActivityFeedEntry, clearOldFeedEntries } from '@/services/activityFeedService';
import { downloadCSV } from '@/services/analyticsService';
import {
  Activity, RefreshCw, Download, Trash2, Search, Filter,
  CheckCircle, XCircle, CreditCard, Star, CalendarDays,
  MessageSquare, Wrench, Users, Bell, LogIn, LogOut, Edit,
} from 'lucide-react';
import { toast } from 'sonner';

const ICON_MAP: Record<string, any> = {
  CheckCircle, XCircle, CreditCard, Star, CalendarDays,
  MessageSquare, Wrench, Users, Bell, LogIn, LogOut, Edit,
  Activity,
};

const COLOR_MAP: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  green:   'bg-green-100 text-green-600',
  red:     'bg-red-100 text-red-600',
  yellow:  'bg-yellow-100 text-yellow-700',
  blue:    'bg-blue-100 text-blue-600',
  orange:  'bg-orange-100 text-orange-600',
  purple:  'bg-purple-100 text-purple-600',
};

function timeAgo(d: string) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ActivityFeedPage() {
  const { supabase }              = useSupabase();
  const { feed, loading, refresh } = useActivityFeed(100);
  const [search, setSearch]       = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const eventTypes = Array.from(new Set(feed.map(f => f.event_type)));

  const filtered = feed.filter(f => {
    const matchType   = typeFilter === 'all' || f.event_type === typeFilter;
    const matchSearch = !search.trim() ||
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.actor_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.event_type.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const handleDelete = useCallback(async (id: string) => {
    const ok = await deleteActivityFeedEntry(supabase, id);
    if (ok) { toast.success('Entry deleted'); refresh(); }
    else toast.error('Delete failed');
  }, [supabase, refresh]);

  const handleClear = useCallback(async () => {
    const n = await clearOldFeedEntries(supabase, 30);
    toast.success(`Cleared ${n} old entries`);
    refresh();
  }, [supabase, refresh]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">Activity Feed</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Real-time log of all hotel events · {feed.length} entries
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => downloadCSV(filtered.map(f => ({
              time: f.created_at, event: f.event_type, title: f.title, actor: f.actor_name ?? '', entity: f.entity_id ?? ''
            })), `activity_feed_${Date.now()}.csv`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-outline-variant rounded-lg hover:bg-surface transition-colors">
            <Download size={13} /> CSV
          </button>
          <button onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-outline-variant rounded-lg hover:bg-surface text-orange-600 transition-colors">
            <Trash2 size={13} /> Clear Old (30d)
          </button>
          <button onClick={refresh} disabled={loading}
            className="p-2 border border-outline-variant rounded-lg hover:bg-surface disabled:opacity-50 transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search events, actors, titles…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="relative">
          <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <select
            value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="pl-8 pr-8 py-2.5 bg-white border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary appearance-none cursor-pointer">
            <option value="all">All Events ({feed.length})</option>
            {eventTypes.map(t => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')} ({feed.filter(f => f.event_type === t).length})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Feed */}
      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant">
          <h2 className="font-semibold text-on-surface">Events ({filtered.length})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-on-surface-variant">Loading feed…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Activity size={36} className="mx-auto text-outline mb-3" />
            <p className="text-sm text-on-surface-variant">No events match your filter</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/40">
            {filtered.map(entry => {
              const Icon  = ICON_MAP[entry.icon ?? ''] ?? Activity;
              const color = COLOR_MAP[entry.color ?? 'primary'] ?? COLOR_MAP.primary;
              return (
                <div key={entry.id}
                  className="group flex items-start gap-4 px-5 py-4 hover:bg-surface/40 transition-colors">
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-on-surface leading-tight">{entry.title}</p>
                        {entry.description && (
                          <p className="text-xs text-on-surface-variant mt-0.5 truncate">{entry.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 hover:text-red-500 text-on-surface-variant">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-[10px] font-mono bg-surface border border-outline-variant rounded px-1.5 py-0.5 text-on-surface-variant">
                        {entry.event_type}
                      </span>
                      {entry.entity_type && (
                        <span className="text-[10px] text-on-surface-variant">
                          {entry.entity_type}{entry.entity_id ? ` #${entry.entity_id.slice(0, 8)}` : ''}
                        </span>
                      )}
                      {entry.actor_name && (
                        <span className="text-[10px] text-on-surface-variant">by {entry.actor_name}</span>
                      )}
                      <span className="text-[10px] text-on-surface-variant ml-auto">{timeAgo(entry.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
