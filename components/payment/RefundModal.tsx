'use client';
/**
 * components/payment/RefundModal.tsx
 * Admin refund initiation modal.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { formatINR } from '@/services/pricingService';

interface Props {
  paymentId: string;
  bookingRef: string;
  maxAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

const REASONS = [
  'Guest request',
  'Booking cancelled by hotel',
  'Room not as described',
  'Emergency/personal reasons',
  'Duplicate booking',
  'Payment error',
  'Other',
];

export function RefundModal({ paymentId, bookingRef, maxAmount, onClose, onSuccess }: Props) {
  const [amount, setAmount]   = useState(maxAmount);
  const [reason, setReason]   = useState('');
  const [notes, setNotes]     = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!reason) { toast.error('Please select a reason'); return; }
    if (amount <= 0 || amount > maxAmount) { toast.error(`Amount must be between ₹1 and ${formatINR(maxAmount)}`); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, amount, reason, notes }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Refund failed'); return; }
      toast.success(`Refund of ${formatINR(amount)} initiated`);
      onSuccess();
    } catch { toast.error('Network error'); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h2 className="font-heading font-semibold text-lg text-on-surface">Initiate Refund</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
            <AlertTriangle size={16} className="text-orange-500 mt-0.5 shrink-0" />
            <p className="text-sm text-orange-800">Refund for booking <strong>{bookingRef}</strong>. Max refundable: <strong>{formatINR(maxAmount)}</strong></p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">Refund Amount (₹)</label>
            <input type="number" min={1} max={maxAmount} step={0.01} value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">Reason *</label>
            <select value={reason} onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
              <option value="">Select reason…</option>
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">Notes (optional)</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes for the record…"
              className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-outline-variant text-sm font-semibold rounded-lg hover:bg-surface transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 px-4 py-2.5 bg-error text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={14} className="animate-spin" /> Processing…</> : `Refund ${formatINR(amount)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
