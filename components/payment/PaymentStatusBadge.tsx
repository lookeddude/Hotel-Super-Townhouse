'use client';
/**
 * components/payment/PaymentStatusBadge.tsx
 */
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:            { label: 'Pending',          cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  authorized:         { label: 'Authorized',       cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  paid:               { label: 'Paid',             cls: 'bg-green-100 text-green-700 border-green-200' },
  failed:             { label: 'Failed',           cls: 'bg-red-100 text-red-700 border-red-200' },
  cancelled:          { label: 'Cancelled',        cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  refund_pending:     { label: 'Refund Pending',   cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  refunded:           { label: 'Refunded',         cls: 'bg-purple-100 text-purple-700 border-purple-200' },
  partially_refunded: { label: 'Partial Refund',   cls: 'bg-purple-50 text-purple-600 border-purple-200' },
};

export function PaymentStatusBadge({ status, size = 'sm' }: { status: string; size?: 'xs' | 'sm' }) {
  const cfg = STATUS_MAP[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex items-center border rounded-full font-medium ${size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1'} ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
