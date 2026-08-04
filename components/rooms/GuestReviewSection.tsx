'use client';

import { useState, useEffect } from 'react';
import { Star, MessageSquare, CheckCircle, Loader2 } from 'lucide-react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { getRoomReviews } from '@/services/reviewService';

interface Props {
  roomTypeId: string;
  roomName:   string;
}

function StarPicker({ value, onChange, size = 24 }: { value: number; onChange: (v: number) => void; size?: number }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110 focus:outline-none">
          <Star size={size}
            className={(hover || value) >= n ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={size}
          className={value >= n ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
        />
      ))}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const colors = ['bg-blue-500','bg-green-500','bg-purple-500','bg-orange-500','bg-pink-500','bg-teal-500'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-10 h-10 rounded-full ${color} text-white flex items-center justify-center font-semibold text-sm flex-shrink-0`}>
      {initials}
    </div>
  );
}

export function GuestReviewSection({ roomTypeId, roomName }: Props) {
  const { supabase } = useSupabase();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRoomReviews(supabase as any, roomTypeId).then(({ data }) => {
      setReviews(data ?? []);
      setLoading(false);
    });
  }, [supabase, roomTypeId]);

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + (r.overall_rating ?? 0), 0) / reviews.length).toFixed(1)
    : null;

  return (
    <section className="bg-white rounded-xl border border-outline-variant overflow-hidden">

      {/* Header */}
      <div className="px-6 py-5 border-b border-outline-variant flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <MessageSquare size={20} className="text-primary" />
          <div>
            <h2 className="font-heading font-semibold text-lg text-on-surface">Guest Reviews</h2>
            {avg && (
              <div className="flex items-center gap-2 mt-0.5">
                <StarDisplay value={Math.round(Number(avg))} />
                <span className="text-sm font-semibold text-on-surface">{avg}</span>
                <span className="text-xs text-on-surface-variant">· {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-on-surface-variant italic">Reviews from verified guests only</p>
      </div>

      {/* Reviews List */}
      <div className="divide-y divide-outline-variant/40">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 size={20} className="animate-spin mx-auto text-on-surface-variant" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-10 text-center text-on-surface-variant">
            <Star size={36} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">No reviews yet</p>
            <p className="text-sm mt-1">Be the first to review {roomName}!</p>
          </div>
        ) : (
          reviews.map(review => {
            const name = review.profiles?.full_name ?? 'Anonymous Guest';
            const date = new Date(review.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
            return (
              <div key={review.id} className="p-6">
                <div className="flex items-start gap-3">
                  <Avatar name={name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-on-surface">{name}</span>
                      {review.is_verified_guest && (
                        <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          <CheckCircle size={10} /> Verified Guest
                        </span>
                      )}
                      <span className="text-xs text-on-surface-variant">{date}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StarDisplay value={review.overall_rating ?? 0} />
                      <span className="text-xs font-semibold text-on-surface">{review.overall_rating}/5</span>
                    </div>
                    {review.title && <p className="font-medium text-sm text-on-surface mt-2">{review.title}</p>}
                    <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{review.comment}</p>

                    {/* Sub-ratings */}
                    {(review.cleanliness_rating || review.service_rating || review.value_rating) && (
                      <div className="flex flex-wrap gap-4 mt-3">
                        {[['Cleanliness', review.cleanliness_rating], ['Service', review.service_rating], ['Value', review.value_rating]].map(([label, val]) =>
                          val ? (
                            <div key={label as string} className="flex items-center gap-1.5">
                              <span className="text-xs text-on-surface-variant">{label as string}:</span>
                              <StarDisplay value={val as number} size={11} />
                            </div>
                          ) : null
                        )}
                      </div>
                    )}

                    {/* Admin Reply */}
                    {review.admin_reply && (
                      <div className="mt-3 p-3 bg-primary/5 rounded-lg border-l-2 border-primary">
                        <p className="text-xs font-semibold text-primary mb-1">Hotel Response</p>
                        <p className="text-xs text-on-surface-variant leading-relaxed">{review.admin_reply}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
