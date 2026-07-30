'use client';
/**
 * Phase 9 — Admin Email Queue Monitor
 */
import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { getEmailQueue, retryEmail } from '@/services/emailService';
import { downloadCSV } from '@/services/analyticsService';
import {
  RefreshCw, Download, Mail, CheckCircle, XCircle,
  Clock, RotateCcw, Search, Filter,
} from 'lucide-react';
import { toast } from 'sonner';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:    'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    sent:       'bg-green-100 text-green-700',
    failed:     'bg-red-100 text-red-700',
    cancelled:  'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-surface rounded animate-pulse ${className}`} />;
}

export default function EmailQueuePage() {
  const { supabase } = useSupabase();
  const [emails,   setEmails]   = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getEmailQueue(supabase, 200);
    setEmails(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let result = emails;
    if (statusFilter !== 'all') result = result.filter(e => e.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.to_email?.toLowerCase().includes(q) ||
        e.to_name?.toLowerCase().includes(q) ||
        e.template_id?.toLowerCase().includes(q) ||
        e.subject?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [emails, statusFilter, search]);

  const handleRetry = async (id: string) => {
    const ok = await retryEmail(supabase, id);
    if (ok) { toast.success('Email queued for retry'); load(); }
    else toast.error('Failed to retry');
  };

  const counts = {
    all:        emails.length,
    pending:    emails.filter(e => e.status === 'pending').length,
    sent:       emails.filter(e => e.status === 'sent').length,
    failed:     emails.filter(e => e.status === 'failed').length,
    processing: emails.filter(e => e.status === 'processing').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">Email Queue</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Monitor and manage outbound email delivery</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCSV(filtered, `email_queue_${Date.now()}.csv`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-outline-variant rounded-lg hover:bg-surface transition-colors">
            <Download size={13} /> CSV
          </button>
          <button onClick={load} disabled={loading}
            className="p-2 border border-outline-variant rounded-lg hover:bg-surface disabled:opacity-50 transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'sent', 'failed', 'processing'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              statusFilter === s
                ? 'bg-primary text-white border-primary'
                : 'border-outline-variant hover:bg-surface'
            }`}>
            {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by email, name, or template…"
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending',    val: counts.pending,    icon: Clock,        color: 'text-yellow-600' },
          { label: 'Sent',       val: counts.sent,       icon: CheckCircle,  color: 'text-green-600' },
          { label: 'Failed',     val: counts.failed,     icon: XCircle,      color: 'text-red-500' },
          { label: 'Total',      val: counts.all,        icon: Mail,         color: 'text-blue-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-outline-variant p-4">
            <div className="flex items-center gap-2 mb-1">
              <k.icon size={15} className={k.color} />
              <p className="text-xs text-on-surface-variant">{k.label}</p>
            </div>
            <p className={`font-bold text-2xl ${k.color}`}>{loading ? '—' : k.val}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
          <h2 className="font-semibold text-on-surface">Emails ({filtered.length})</h2>
          {filtered.some(e => e.status === 'failed') && (
            <button
              onClick={async () => {
                const failed = filtered.filter(e => e.status === 'failed');
                await Promise.all(failed.map(e => retryEmail(supabase, e.id)));
                toast.success(`Retrying ${failed.length} failed emails`);
                load();
              }}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline">
              <RotateCcw size={12} /> Retry All Failed
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr>
                {['Recipient', 'Subject', 'Template', 'Priority', 'Status', 'Scheduled', 'Retry', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-on-surface-variant">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {loading
                ? <tr><td colSpan={8} className="px-4 py-10 text-center text-on-surface-variant">Loading…</td></tr>
                : filtered.length === 0
                  ? <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-on-surface-variant">No emails match your filter</td></tr>
                  : filtered.map(e => (
                      <tr key={e.id} className="hover:bg-surface/40 transition-colors">
                        <td className="px-4 py-3 max-w-[160px]">
                          <p className="font-medium text-xs truncate">{e.to_name ?? '—'}</p>
                          <p className="text-[10px] text-on-surface-variant truncate">{e.to_email}</p>
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <p className="text-xs truncate">{e.subject}</p>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-on-surface-variant">{e.template_id}</td>
                        <td className="px-4 py-3 text-xs text-center">{e.priority}</td>
                        <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                        <td className="px-4 py-3 text-xs text-on-surface-variant">
                          {e.scheduled_at
                            ? new Date(e.scheduled_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                            : 'Immediate'}
                        </td>
                        <td className="px-4 py-3 text-xs">{e.retry_count}/{e.max_retries}</td>
                        <td className="px-4 py-3">
                          {e.status === 'failed' && (
                            <button onClick={() => handleRetry(e.id)}
                              className="flex items-center gap-1 text-xs text-primary hover:underline">
                              <RotateCcw size={10} /> Retry
                            </button>
                          )}
                          {e.last_error && (
                            <p className="text-[9px] text-red-500 mt-0.5 max-w-[100px] truncate" title={e.last_error}>
                              {e.last_error}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
