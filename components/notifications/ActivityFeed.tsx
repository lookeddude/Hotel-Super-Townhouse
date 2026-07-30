'use client';
/**
 * components/notifications/ActivityFeed.tsx
 * Phase 9 — Realtime Activity Feed Widget for admin dashboard
 */
import Link from 'next/link';
import { RefreshCw, Activity } from 'lucide-react';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { type ActivityFeedEntry } from '@/services/activityFeedService';

const COLOR_MAP: Record<string, string> = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  green:   'bg-green-100 text-green-600 border-green-200',
  red:     'bg-red-100 text-red-600 border-red-200',
  yellow:  'bg-yellow-100 text-yellow-600 border-yellow-200',
  blue:    'bg-blue-100 text-blue-600 border-blue-200',
  orange:  'bg-orange-100 text-orange-600 border-orange-200',
  purple:  'bg-purple-100 text-purple-600 border-purple-200',
};

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function FeedItem({ entry }: { entry: ActivityFeedEntry }) {
  const colorCls = COLOR_MAP[entry.color ?? 'primary'] ?? COLOR_MAP.primary;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-outline-variant/40 last:border-0">
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs border ${colorCls}`}>
        <Activity size={12} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-on-surface leading-tight">
          {entry.link_href ? (
            <Link href={entry.link_href} className="hover:underline text-primary">{entry.title}</Link>
          ) : entry.title}
        </p>
        {entry.description && (
          <p className="text-xs text-on-surface-variant mt-0.5 truncate">{entry.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {entry.actor_name && (
            <span className="text-[10px] text-on-surface-variant">by {entry.actor_name}</span>
          )}
          <span className="text-[10px] text-on-surface-variant">{timeAgo(entry.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 py-3">
          <div className="w-7 h-7 rounded-full bg-surface animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-surface rounded animate-pulse w-3/4" />
            <div className="h-2.5 bg-surface rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityFeedWidget({ limit = 15 }: { limit?: number }) {
  const { feed, loading, refresh } = useActivityFeed(limit);

  return (
    <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-primary" />
          <h2 className="font-semibold text-sm text-on-surface">Live Activity Feed</h2>
          <span className="text-xs text-on-surface-variant bg-surface px-1.5 py-0.5 rounded-full">Realtime</span>
        </div>
        <button onClick={refresh} disabled={loading}
          className="p-1.5 rounded hover:bg-surface transition-colors disabled:opacity-50">
          <RefreshCw size={13} className={loading ? 'animate-spin text-primary' : 'text-on-surface-variant'} />
        </button>
      </div>
      <div className="px-5 overflow-y-auto max-h-96">
        {loading ? (
          <FeedSkeleton />
        ) : feed.length === 0 ? (
          <div className="py-12 text-center">
            <Activity size={28} className="mx-auto text-outline mb-2" />
            <p className="text-sm text-on-surface-variant">No activity yet</p>
          </div>
        ) : (
          feed.map(entry => <FeedItem key={entry.id} entry={entry} />)
        )}
      </div>
      {feed.length > 0 && (
        <div className="border-t border-outline-variant px-5 py-2.5">
          <Link href="/admin/communications/activity-feed"
            className="text-xs text-primary hover:underline">
            View full activity log →
          </Link>
        </div>
      )}
    </div>
  );
}
