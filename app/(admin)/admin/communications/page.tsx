'use client';
/**
 * Admin Communication Center
 * Includes: Contact Messages / Inquiries, Email Queue, Automation Logs, Activity Feed
 */
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSupabase } from '@/providers/SupabaseProvider';
import { getContactMessages, markContactRead, markContactResolved, deleteContactMessage } from '@/services/contactService';
import { getEmailQueue, getEmailQueueStats, retryEmail } from '@/services/emailService';
import { ActivityFeedWidget } from '@/components/notifications/ActivityFeed';
import {
  Bell, Mail, Activity, Clock, RefreshCw, CheckCircle, XCircle,
  AlertTriangle, RotateCcw, ChevronRight, Send, MessageSquare,
  Phone, Trash2, Eye, MailOpen, User, Calendar, MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-surface rounded animate-pulse ${className}`} />;
}

function StatCard({ label, value, icon: Icon, color = 'text-on-surface' }: {
  label: string; value: string | number; icon: any; color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-outline-variant p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-on-surface-variant">{label}</p>
          <p className={`font-bold text-2xl mt-1 ${color}`}>{value}</p>
        </div>
        <Icon size={17} className={`${color} opacity-70`} />
      </div>
    </div>
  );
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending:    'bg-yellow-100 text-yellow-700',
    sent:       'bg-green-100 text-green-700',
    failed:     'bg-red-100 text-red-700',
    processing: 'bg-blue-100 text-blue-700',
    unread:     'bg-blue-100 text-blue-700',
    read:       'bg-gray-100 text-gray-600',
    replied:    'bg-green-100 text-green-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

// ── Contact Message Modal ─────────────────────────────────────────────────────
function MessageModal({ msg, onClose, onMarkRead, onMarkResolved, onDelete }: {
  msg: any; onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkResolved: (id: string, val: boolean) => void;
  onDelete: (id: string) => void;
}) {
  // Helper: clean phone for WhatsApp (remove spaces, dashes, +)
  const waNumber = (num: string) => num.replace(/[^0-9]/g, '');

  // Gmail compose URL
  const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(msg.email)}&su=${encodeURIComponent('Re: ' + (msg.subject || 'Your Inquiry'))}&body=${encodeURIComponent(`Hi ${msg.full_name},\n\n`)}`;

  // WhatsApp URL
  const waUrl = msg.whatsapp
    ? `https://wa.me/${waNumber(msg.whatsapp)}?text=${encodeURIComponent(`Hi ${msg.full_name}, thank you for contacting Super Townhouse! Regarding your inquiry: "${msg.subject || 'General Inquiry'}" — `)}`
    : null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-heading font-bold text-lg text-on-surface">{msg.full_name}</h3>
            <p className="text-sm text-on-surface-variant">{msg.email} {msg.phone && `· ${msg.phone}`}</p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1">✕</button>
        </div>

        {/* Subject */}
        <div className="bg-surface rounded-lg px-4 py-2 mb-4">
          <p className="text-xs text-on-surface-variant">Subject</p>
          <p className="font-semibold text-sm text-on-surface mt-0.5">{msg.subject || 'General Inquiry'}</p>
        </div>

        {/* Message */}
        <div className="bg-surface rounded-lg px-4 py-3 mb-5">
          <p className="text-xs text-on-surface-variant mb-1">Message</p>
          <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{msg.message}</p>
        </div>

        {/* Meta */}
        <div className="bg-surface rounded-lg px-4 py-2 mb-5 text-xs text-on-surface-variant space-y-1">
          <p>📅 Received: {new Date(msg.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          {msg.phone    && <p>📞 Phone: <a href={`tel:${msg.phone}`} className="text-primary">{msg.phone}</a></p>}
          {msg.whatsapp && <p>💬 WhatsApp: <a href={`https://wa.me/${waNumber(msg.whatsapp)}`} target="_blank" rel="noopener noreferrer" className="text-green-600">{msg.whatsapp}</a></p>}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <a href={gmailUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm rounded-lg hover:opacity-90">
            <Mail size={13} /> Reply via Gmail
          </a>
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:opacity-90">
              <MessageCircle size={13} /> Reply on WhatsApp
            </a>
          )}
          {msg.phone && (
            <a href={`tel:${msg.phone}`}
              className="flex items-center gap-1.5 px-3 py-2 border border-outline-variant text-sm rounded-lg hover:bg-surface">
              <Phone size={13} /> Call
            </a>
          )}
          {!msg.is_read && (
            <button onClick={() => onMarkRead(msg.id)}
              className="flex items-center gap-1.5 px-3 py-2 border border-outline-variant text-sm rounded-lg hover:bg-surface">
              <MailOpen size={13} /> Mark Read
            </button>
          )}
          <button onClick={() => onMarkResolved(msg.id, !msg.is_replied)}
            className="flex items-center gap-1.5 px-3 py-2 border border-outline-variant text-sm rounded-lg hover:bg-surface">
            <CheckCircle size={13} /> {msg.is_replied ? 'Mark Unresolved' : 'Mark Resolved'}
          </button>
          <button onClick={() => { onDelete(msg.id); onClose(); }}
            className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 ml-auto">
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CommunicationsPage() {
  const { supabase } = useSupabase();
  const [contacts,   setContacts]   = useState<any[]>([]);
  const [emailStats, setEmailStats] = useState<any>(null);
  const [emailQueue, setEmailQueue] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [selectedMsg, setSelectedMsg] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'resolved'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Load contact messages
      const { data: msgs } = await (supabase as any)
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      setContacts(msgs ?? []);

      // Load email stats
      const { data: eq } = await (supabase as any)
        .from('email_queue')
        .select('status')
        .limit(1000);
      const rows = eq ?? [];
      setEmailStats({
        pending: rows.filter((r: any) => r.status === 'pending').length,
        sent:    rows.filter((r: any) => r.status === 'sent').length,
        failed:  rows.filter((r: any) => r.status === 'failed').length,
        total:   rows.length,
      });

      // Load email queue
      const { data: queue } = await (supabase as any)
        .from('email_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);
      setEmailQueue(queue ?? []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (id: string) => {
    await markContactRead(supabase, id);
    setContacts(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
    toast.success('Marked as read');
  };

  const handleMarkResolved = async (id: string, val: boolean) => {
    await markContactResolved(supabase, id, val);
    setContacts(prev => prev.map(m => m.id === id ? { ...m, is_replied: val } : m));
    toast.success(val ? 'Marked as resolved' : 'Marked as unresolved');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    await deleteContactMessage(supabase, id);
    setContacts(prev => prev.filter(m => m.id !== id));
    toast.success('Message deleted');
  };

  const handleRetry = async (id: string) => {
    const ok = await retryEmail(supabase, id);
    if (ok) { toast.success('Email queued for retry'); load(); }
    else toast.error('Retry failed');
  };

  const openMsg = async (msg: any) => {
    setSelectedMsg(msg);
    if (!msg.is_read) await handleMarkRead(msg.id);
  };

  const filtered = contacts.filter(m => {
    if (filter === 'unread')   return !m.is_read;
    if (filter === 'resolved') return m.is_replied;
    return true;
  });

  const unreadCount   = contacts.filter(m => !m.is_read).length;
  const resolvedCount = contacts.filter(m => m.is_replied).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">Communication Center</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Contact Inquiries · Email Queue · Activity Feed
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* ── Contact Messages Section ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden shadow-sm">

        {/* Section Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <MessageSquare size={17} className="text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-on-surface">Contact Inquiries</h2>
              <p className="text-xs text-on-surface-variant">{contacts.length} total · {unreadCount} unread</p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 bg-surface rounded-lg p-1">
            {(['all', 'unread', 'resolved'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs rounded-md font-medium capitalize transition-colors ${filter === f ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-on-surface'}`}>
                {f} {f === 'unread' && unreadCount > 0 && `(${unreadCount})`}
                {f === 'resolved' && resolvedCount > 0 && `(${resolvedCount})`}
              </button>
            ))}
          </div>
        </div>

        {/* Messages List */}
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant gap-3">
            <MessageSquare size={40} className="opacity-30" />
            <p className="font-medium">
              {filter === 'all' ? 'No messages yet' : `No ${filter} messages`}
            </p>
            <p className="text-sm">Messages from the contact form will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/50">
            {filtered.map(msg => (
              <div key={msg.id}
                className={`flex items-start gap-4 px-6 py-4 hover:bg-surface/50 cursor-pointer transition-colors ${!msg.is_read ? 'bg-blue-50/30' : ''}`}
                onClick={() => openMsg(msg)}>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-primary" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-semibold text-on-surface ${!msg.is_read ? 'font-bold' : ''}`}>
                      {msg.full_name}
                    </p>
                    {!msg.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" title="Unread" />
                    )}
                    {msg.is_replied && statusBadge('replied')}
                  </div>
                  <p className="text-xs text-on-surface-variant truncate">
                    {msg.email}
                    {msg.phone    && ` · 📞 ${msg.phone}`}
                    {msg.whatsapp && ` · 💬 ${msg.whatsapp}`}
                  </p>
                  <p className="text-sm text-on-surface-variant truncate mt-0.5">
                    <span className="font-medium text-on-surface">{msg.subject || 'General Inquiry'}</span> — {msg.message}
                  </p>
                </div>

                {/* Time & actions */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <p className="text-[10px] text-on-surface-variant whitespace-nowrap">
                    {new Date(msg.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <a href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(msg.email)}&su=${encodeURIComponent('Re: ' + (msg.subject || 'Your Inquiry'))}&body=${encodeURIComponent('Hi ' + msg.full_name + ',\n\n')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors" title="Reply via Gmail">
                      <Mail size={13} />
                    </a>
                    {msg.whatsapp && (
                      <a href={`https://wa.me/${msg.whatsapp.replace(/[^0-9]/g,'')}?text=${encodeURIComponent('Hi ' + msg.full_name + ', thank you for contacting Super Townhouse! ')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded hover:bg-green-50 text-on-surface-variant hover:text-green-600 transition-colors" title="Reply on WhatsApp">
                        <MessageCircle size={13} />
                      </a>
                    )}
                    <button onClick={() => handleMarkResolved(msg.id, !msg.is_replied)}
                      className={`p-1.5 rounded hover:bg-green-50 transition-colors ${msg.is_replied ? 'text-green-600' : 'text-on-surface-variant hover:text-green-600'}`} title="Toggle resolved">
                      <CheckCircle size={13} />
                    </button>
                    <button onClick={() => handleDelete(msg.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-on-surface-variant hover:text-red-500 transition-colors" title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Email Queue Stats ──────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-3">📧 Email Queue</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />) : (
            <>
              <StatCard label="Pending"    value={emailStats?.pending ?? 0} icon={Clock}       color="text-yellow-600" />
              <StatCard label="Sent"       value={emailStats?.sent    ?? 0} icon={Send}        color="text-green-600"  />
              <StatCard label="Failed"     value={emailStats?.failed  ?? 0} icon={XCircle}     color="text-red-500"    />
              <StatCard label="Total"      value={emailStats?.total   ?? 0} icon={Mail}        color="text-blue-600"   />
            </>
          )}
        </div>
      </div>

      {/* ── Recent Email Queue Table ───────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
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
                {['To', 'Template', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-on-surface-variant">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {loading
                ? <tr><td colSpan={4} className="px-4 py-8 text-center text-on-surface-variant">Loading…</td></tr>
                : emailQueue.length === 0
                  ? <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-on-surface-variant">No emails in queue</td></tr>
                  : emailQueue.map(e => (
                      <tr key={e.id} className="hover:bg-surface/40">
                        <td className="px-4 py-2.5 max-w-[160px]">
                          <p className="truncate text-xs font-medium">{e.to_name ?? e.to_email}</p>
                          <p className="truncate text-[10px] text-on-surface-variant">{e.to_email}</p>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-on-surface-variant font-mono">{e.template_id}</td>
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

      {/* Activity Feed */}
      <ActivityFeedWidget limit={10} />

      {/* Modal */}
      {selectedMsg && (
        <MessageModal
          msg={selectedMsg}
          onClose={() => setSelectedMsg(null)}
          onMarkRead={handleMarkRead}
          onMarkResolved={handleMarkResolved}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
