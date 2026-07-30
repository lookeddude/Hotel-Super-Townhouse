'use client';

import { useEffect, useState, useCallback } from 'react';
import { Star, CheckCircle, XCircle, Trash2, RefreshCcw, MessageSquare } from 'lucide-react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { getReviews, updateReviewStatus, addAdminReply, deleteReview, getReviewStats } from '@/services/reviewService';
import { toast } from 'sonner';

export default function AdminReviewsPage() {
  const { supabase } = useSupabase();
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, avg: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    const [reviewsResult, statsResult] = await Promise.all([
      getReviews(supabase, { status: filterStatus || undefined }),
      getReviewStats(supabase),
    ]);
    setReviews(reviewsResult.data ?? []);
    setStats(statsResult);
    setIsLoading(false);
  }, [supabase, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (id: string, status: string) => {
    const { error } = await updateReviewStatus(supabase, id, status);
    if (error) { toast.error('Failed to update status'); return; }
    toast.success(`Review ${status}`);
    load();
  };

  const handleReply = async (id: string) => {
    if (!replyText.trim()) { toast.error('Reply cannot be empty'); return; }
    const { error } = await addAdminReply(supabase, id, replyText);
    if (error) { toast.error('Failed to save reply'); return; }
    toast.success('Reply saved');
    setReplyingTo(null);
    setReplyText('');
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this review?')) return;
    await deleteReview(supabase, id);
    toast.success('Review deleted');
    load();
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={13} className={i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-outline-variant'} />
    ));

  const STATUS_BADGE: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    flagged: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">Review Moderation</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">
            {stats.avg ? `⭐ ${stats.avg} average rating` : 'No approved reviews yet'}
          </p>
        </div>
        <button onClick={load} disabled={isLoading} className="p-2 border border-outline-variant rounded-lg hover:bg-surface">
          <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
          { label: 'Approved', value: stats.approved, color: 'text-green-600' },
          { label: 'Rejected', value: stats.rejected, color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-outline-variant p-4">
            <p className={`font-heading font-bold text-2xl ${s.color}`}>{s.value}</p>
            <p className="text-caption text-on-surface-variant mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {(['', 'pending', 'approved', 'rejected', 'flagged'] as const).map((f) => (
          <button key={f} onClick={() => setFilterStatus(f)} className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${filterStatus === f ? 'bg-primary text-white' : 'bg-surface text-on-surface-variant hover:bg-outline-variant'}`}>
            {f || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({length:4}).map((_,i) => <div key={i} className="h-32 bg-surface rounded-lg animate-pulse" />)}</div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-lg border border-outline-variant py-16 text-center text-sm text-on-surface-variant">
          No reviews found{filterStatus ? ` with status "${filterStatus}"` : ''}.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            // DB uses 'comment' not 'content', 'admin_replied_at' not 'admin_reply_at'
            // guest info comes from profiles join
            const guestName = review.profiles?.full_name ?? 'Guest';
            return (
              <div key={review.id} className="bg-white rounded-lg border border-outline-variant overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-semibold text-sm text-on-surface">{guestName}</p>
                        <div className="flex items-center gap-0.5">{renderStars(review.overall_rating ?? 0)}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_BADGE[review.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {review.status}
                        </span>
                        {review.is_verified_guest && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">✓ Verified Guest</span>}
                        <span className="text-xs text-on-surface-variant">{new Date(review.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                      {review.title && <p className="font-medium text-sm text-on-surface mt-2">{review.title}</p>}
                      {/* DB uses 'comment' column */}
                      <p className="text-sm text-on-surface-variant mt-1 line-clamp-3">{review.comment}</p>
                      {review.admin_reply && (
                        <div className="mt-3 pl-3 border-l-2 border-primary/30">
                          <p className="text-xs text-primary font-semibold">Admin Reply</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">{review.admin_reply}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {review.status !== 'approved' && (
                        <button onClick={() => handleStatus(review.id, 'approved')} className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100" title="Approve">
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {review.status !== 'rejected' && (
                        <button onClick={() => handleStatus(review.id, 'rejected')} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100" title="Reject">
                          <XCircle size={16} />
                        </button>
                      )}
                      <button onClick={() => { setReplyingTo(replyingTo === review.id ? null : review.id); setReplyText(review.admin_reply || ''); }} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" title="Reply">
                        <MessageSquare size={16} />
                      </button>
                      <button onClick={() => handleDelete(review.id)} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {replyingTo === review.id && (
                    <div className="mt-4 pt-4 border-t border-outline-variant space-y-2">
                      <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write your admin reply…" rows={3} className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary resize-none" />
                      <div className="flex gap-2">
                        <button onClick={() => handleReply(review.id)} className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg">Post Reply</button>
                        <button onClick={() => setReplyingTo(null)} className="px-4 py-1.5 border border-outline-variant text-xs rounded-lg">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
