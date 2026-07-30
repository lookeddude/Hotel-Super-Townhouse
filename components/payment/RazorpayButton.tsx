'use client';
/**
 * components/payment/RazorpayButton.tsx
 * "Pay Online" button — initiates the full Razorpay checkout flow.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { CreditCard, Loader2 } from 'lucide-react';
import { initiateOnlinePayment } from '@/services/razorpayClientService';
import { formatINR } from '@/services/pricingService';

interface Props {
  bookingId: string;
  amount: number;
  onSuccess?: (bookingRef: string) => void;
  className?: string;
}

export function RazorpayButton({ bookingId, amount, onSuccess, className }: Props) {
  const [loading, setLoading] = useState(false);

  const isConfigured = !!(
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
    !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.includes('REPLACE')
  );

  const handlePay = async () => {
    if (!isConfigured) {
      toast.error('Online payment is not yet configured. Please use Pay at Hotel.');
      return;
    }
    setLoading(true);
    await initiateOnlinePayment({
      bookingId,
      onSuccess: (ref) => {
        setLoading(false);
        toast.success('Payment successful! 🎉');
        onSuccess?.(ref);
      },
      onError: (msg) => {
        setLoading(false);
        toast.error(msg || 'Payment failed. Please try again.');
      },
      onDismiss: () => setLoading(false),
    });
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading || !isConfigured}
      title={!isConfigured ? 'Add Razorpay keys to enable online payment' : undefined}
      className={`flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
      {loading ? 'Processing…' : `Pay ${formatINR(amount)} Online`}
    </button>
  );
}
