'use client';
/**
 * Phase 9 — Admin Communication Center
 * Central hub: stats overview, email queue, automation logs, scheduled reminders, activity feed
 */
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSupabase } from '@/providers/SupabaseProvider';
import { getEmailQueue, getEmailQueueStats, retryEmail } from '@/services/emailService';
import { getSchedulerStats, getUpcomingReminders } from '@/services/schedulerService';
import { ActivityFeedWidget } from '@/components/notifications/ActivityFeed';
import { formatINR } from '@/services/pricingService';
import {
  Bell, Mail, Activity, Clock, RefreshCw, CheckCircle, XCircle,
  AlertTriangle, RotateCcw, Download, ChevronRight, Send, Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-surface rounded animate-pulse ${className}`} />;
}

function StatCard({ label, value, sub, icon: Icon, color = 'text-on-surface' }: {
  label: string; value: string | number; sub?: string;
  icon: any; color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-outline-variant p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-on-surface-variant">{label}</p>
          <p className={`font-bold text-2xl mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-on-surface-variant mt-0.5">{sub}</p>}
        </div>
        <Icon size={17} className={`${color} opacity-70`} />
      </div>
    </div>
  );
}

export default function CommunicationsPage() {
  const { supabase } = useSupabase();
  const [emailStats,  setEmailStats]  = useState<any>(null);
  const [schedStats,  setSchedStats]  = useState<any>(null);
  const [emailQueue,  setEmailQueue]  = useState<any[]>([]);
  const [upcoming,    setUpcoming]    = useState<any[]>([]);
  const [automLogs,   setAutomLogs]   = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [eq, ss, queue, up, logs] = await Promise.allSettled([
      getEmailQueueStats(supabase),
      getSchedulerStats(supabase),
      getEmailQueue(supabase, 10),
      getUpcomingReminders(supabase, 8),
      (supabase as any).from('automation_logs').select('*').order('created_at', { ascending: false }).limit(10).then((r: any) => r.data ?? []),
    ]);
    if (eq.status === 'fulfilled')    setEmailStats(eq.value);
    if (ss.status === 'fulfilled')    setSchedStats(ss.value);
    if (queue.status === 'fulfilled') setEmailQueue(queue.value);
    if (up.status === 'fulfilled')    setUpcoming(up.value);
    if (logs.status === 'fulfilled')  setAutomLogs(logs.value);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const handleRetry = async (id: string) => {
    const ok = await retryEmail(supabase, id);
    if (ok) { toast.success('Email queued for retry'); load(); }
    else toast.error('Retry failed');
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending:    'bg-yellow-100 text-yellow-700',
      sent:       'bg-green-100 text-green-700',
      failed:     'bg-red-100 text-red-700',
      processing: 'bg-blue-100 text-blue-700',
      cancelled:  'bg-gray-100 text-gray-600',
      success:    'bg-green-100 text-green-700',
      partial:    'bg-orange-100 text-orange-700',
      skipped:    'bg-gray-100 text-gray-600',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">Communication Center</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Notifications · Emails · Automation · Scheduled Reminders · Activity Feed
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/admin/communications/email-queue"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-outline-variant rounded-lg hover:bg-surface transition-colors">
            <Mail size={13} /> Email Queue
          </Link>
          <Link href="/admin/communications/activity-feed"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-outline-variant rounded-lg hover:bg-surface transition-colors">
            <Activity size={13} /> Activity Feed
          </Link>
          <button onClick={load} disabled={loading}
            className="p-2 border border-outline-variant rounded-lg hover:bg-surface disabled:opacity-50 transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Row — Email */}
      <div>
        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-3">📧 Email Queue</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />) : (
            <>
              <StatCard label="Pending"    value={emailStats?.pending    ?? 0} icon={Clock}        color="text-yellow-600" />
              <StatCard label="Sent Today" value={emailStats?.sent       ?? 0} icon={Send}         color="text-green-600"  />
              <StatCard label="Failed"     value={emailStats?.failed     ?? 0} icon={XCircle}      color="text-red-500"    />
              <StatCard label="Total"      value={emailStats?.total      ?? 0} icon={Mail}         color="text-blue-600"   />
            </>
          )}
        </div>
      </div>

      {/* KPI Row — Scheduler */}
      <div>
        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-3">⏰ Scheduled Reminders</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />) : (
            <>
              <StatCard label="Pending"   value={schedStats?.pending   ?? 0} icon={Clock}       color="text-yellow-600" />
              <StatCard label="Sent"      value={schedStats?.sent      ?? 0} icon={CheckCircle} color="text-green-600"  />
              <StatCard label="Failed"    value={schedStats?.failed    ?? 0} icon={AlertTriangle}color="text-red-500"   />
              <StatCard label="Cancelled" value={schedStats?.cancelled ?? 0} icon={XCircle}     color="text-gray-500"   />
            </>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Email Queue */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-outline-variant overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-primary" />
              <h2 className="font-semibold text-sm text-on-surface">Recent Email Queue</h2>
            </div>
            <Link href="/admin/communications/email-queue"
              className="text-xs text-primary hover:underline flex items-center gap-0.5">
              View all <ChevronRight size={11} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr>
                  {['To', 'Template', 'Priority', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {loading
                  ? <tr><td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">Loading…</td></tr>
                  : emailQueue.length === 0
                    ? <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-on-surface-variant">No emails in queue</td></tr>
                    : emailQueue.map(e => (
                        <tr key={e.id} className="hover:bg-surface/40">
                          <td className="px-4 py-2.5 max-w-[140px]">
                            <p className="truncate text-xs font-medium">{e.to_name ?? e.to_email}</p>
                            <p className="truncate text-[10px] text-on-surface-variant">{e.to_email}</p>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-on-surface-variant font-mono">{e.template_id}</td>
                          <td className="px-4 py-2.5 text-xs">{e.priority}</td>
                          <td className="px-4 py-2.5">{statusBadge(e.status)}</td>
                          <td className="px-4 py-2.5">
                            {e.status === 'failed' && (
                              <button onClick={() => handleRetry(e.id)}
                                className="flex items-center gap-1 text-xs text-primary hover:underline">
                                <RotateCcw size={10} /> Retry
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Upcoming Reminders */}
          <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant">
              <Calendar size={14} className="text-primary" />
              <h2 className="font-semibold text-sm text-on-surface">Upcoming Reminders</h2>
            </div>
            <div className="divide-y divide-outline-variant/40 max-h-56 overflow-y-auto">
              {loading
                ? <div className="p-4"><Skeleton className="h-20" /></div>
                : upcoming.length === 0
                  ? <div className="py-8 text-center text-sm text-on-surface-variant">No upcoming reminders</div>
                  : upcoming.map(r => (
                      <div key={r.id} className="px-4 py-3">
                        <p className="text-xs font-medium text-on-surface truncate">{r.reminder_type?.replace('_', ' ')}</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">
                          {new Date(r.scheduled_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {(r.channels ?? []).map((c: string) => (
                            <span key={c} className="text-[9px] bg-surface border border-outline-variant rounded px-1 py-0.5">{c}</span>
                          ))}
                        </div>
                      </div>
                    ))
              }
            </div>
          </div>

          {/* Automation Logs */}
          <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant">
              <Activity size={14} className="text-primary" />
              <h2 className="font-semibold text-sm text-on-surface">Recent Automations</h2>
            </div>
            <div className="divide-y divide-outline-variant/40 max-h-64 overflow-y-auto">
              {loading
                ? <div className="p-4"><Skeleton className="h-20" /></div>
                : automLogs.length === 0
                  ? <div className="py-8 text-center text-sm text-on-surface-variant">No automations yet</div>
                  : automLogs.map(l => (
                      <div key={l.id} className="px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium text-on-surface truncate">{l.trigger_event?.replace(/_/g, ' ')}</p>
                          {statusBadge(l.status)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] text-on-surface-variant">{l.duration_ms}ms</p>
                          <p className="text-[10px] text-on-surface-variant">
                            {new Date(l.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
              }
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <ActivityFeedWidget limit={20} />

      {/* Quick Links */}
      <div className="bg-white rounded-xl border border-outline-variant p-5">
        <p className="font-semibold text-on-surface mb-4">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Email Queue',        href: '/admin/communications/email-queue' },
            { label: 'Activity Feed',      href: '/admin/communications/activity-feed' },
            { label: 'All Notifications',  href: '/admin/notifications' },
            { label: 'Booking Analytics',  href: '/admin/analytics/bookings' },
            { label: 'Revenue Reports',    href: '/admin/reports' },
            { label: 'Global Search',      href: '/admin/search' },
          ].map(a => (
            <Link key={a.label} href={a.href}
              className="px-3 py-1.5 text-sm bg-surface border border-outline-variant rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-colors">
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
