'use client';
/**
 * components/invoice/InvoiceView.tsx
 * Full invoice display — clean single-page print, no admin UI visible.
 */
import { formatINR, formatDate } from '@/services/pricingService';
import { Printer, X } from 'lucide-react';

interface InvoiceViewProps {
  invoice: any;
  booking?: any;
  onClose?: () => void;
}

export function InvoiceView({ invoice, booking, onClose }: InvoiceViewProps) {
  const handlePrint = () => {
    // Add class so print CSS can hide admin chrome
    document.body.classList.add('invoice-print-mode');
    window.print();
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('invoice-print-mode');
    }, { once: true });
  };

  const lineItems: any[] = invoice.line_items ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar — hidden when printing */}
      <div className="no-print bg-white border-b border-outline-variant px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onClose && (
            <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors">
              <X size={16} /> Close
            </button>
          )}
          <span className="text-sm font-medium text-on-surface">Invoice {invoice.invoice_number}</span>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          <Printer size={15} /> Print / Download PDF
        </button>
      </div>

      {/* Invoice body */}
      <div className="max-w-2xl mx-auto py-8 px-6" id="invoice-content">
        <div className="bg-white rounded-xl border border-outline-variant p-8">

          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="font-heading font-bold text-2xl text-primary">Super Townhouse</h1>
              <p className="text-xs text-on-surface-variant mt-1">Plot No. 12, ITPL Main Road, Whitefield</p>
              <p className="text-xs text-on-surface-variant">Bengaluru, Karnataka 560066</p>
              <p className="text-xs text-on-surface-variant">GSTIN: 29AABCU9603R1ZX</p>
              <p className="text-xs text-on-surface-variant">Phone: +91 80 2345 6789</p>
            </div>
            <div className="text-right">
              <p className="font-heading font-bold text-xl text-on-surface">TAX INVOICE</p>
              <p className="text-xs text-on-surface-variant mt-1">Invoice No: <span className="font-mono font-semibold">{invoice.invoice_number}</span></p>
              <p className="text-xs text-on-surface-variant">Date: {formatDate(invoice.issued_at?.split('T')[0])}</p>
              {booking?.booking_reference && (
                <p className="text-xs text-on-surface-variant">Booking Ref: <span className="font-mono">{booking.booking_reference}</span></p>
              )}
            </div>
          </div>

          <hr className="border-outline-variant mb-6" />

          {/* Guest Info */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Bill To</p>
            <p className="font-semibold text-on-surface">{invoice.guest_name}</p>
            {invoice.guest_email && <p className="text-sm text-on-surface-variant">{invoice.guest_email}</p>}
            {invoice.guest_phone && <p className="text-sm text-on-surface-variant">{invoice.guest_phone}</p>}
            {invoice.guest_address && <p className="text-sm text-on-surface-variant">{invoice.guest_address}</p>}
            {invoice.guest_gstin && <p className="text-xs text-on-surface-variant mt-1">GSTIN: {invoice.guest_gstin}</p>}
            {invoice.company_name && <p className="text-sm text-on-surface-variant">{invoice.company_name}</p>}
          </div>

          {/* Stay Details */}
          {booking && (
            <div className="mb-6 bg-surface rounded-lg p-4 grid grid-cols-2 gap-2 text-sm">
              <div><p className="text-xs text-on-surface-variant">Check-in</p><p className="font-medium">{formatDate(booking.check_in)}</p></div>
              <div><p className="text-xs text-on-surface-variant">Check-out</p><p className="font-medium">{formatDate(booking.check_out)}</p></div>
              <div><p className="text-xs text-on-surface-variant">Duration</p><p className="font-medium">{booking.nights} night{booking.nights !== 1 ? 's' : ''}</p></div>
              <div><p className="text-xs text-on-surface-variant">Guests</p><p className="font-medium">{booking.num_adults} adult{booking.num_adults !== 1 ? 's' : ''}</p></div>
            </div>
          )}

          {/* Line Items */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="text-left py-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Description</th>
                <th className="text-center py-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Nights</th>
                <th className="text-right py-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Rate</th>
                <th className="text-right py-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {lineItems.map((item: any, i: number) => (
                <tr key={i}>
                  <td className="py-2.5 text-on-surface">{item.description}</td>
                  <td className="py-2.5 text-center text-on-surface-variant">{item.nights ?? '—'}</td>
                  <td className="py-2.5 text-right text-on-surface-variant">{item.rate ? formatINR(item.rate) : '—'}</td>
                  <td className="py-2.5 text-right font-medium text-on-surface">{formatINR(Math.abs(item.amount))}{item.amount < 0 ? ' (−)' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="space-y-2 text-sm border-t border-outline-variant pt-4">
            <div className="flex justify-between"><span className="text-on-surface-variant">Subtotal</span><span>{formatINR(Number(invoice.subtotal))}</span></div>
            {Number(invoice.discount_amount) > 0 && (
              <div className="flex justify-between text-green-600"><span>Discount</span><span>− {formatINR(Number(invoice.discount_amount))}</span></div>
            )}
            {Number(invoice.cgst_amount) > 0 && (
              <div className="flex justify-between text-on-surface-variant text-xs">
                <span>CGST ({Number(invoice.subtotal) > 0 ? (Number(invoice.cgst_amount) / Number(invoice.subtotal) * 100).toFixed(0) : 0}%)</span>
                <span>{formatINR(Number(invoice.cgst_amount))}</span>
              </div>
            )}
            {Number(invoice.sgst_amount) > 0 && (
              <div className="flex justify-between text-on-surface-variant text-xs">
                <span>SGST</span>
                <span>{formatINR(Number(invoice.sgst_amount))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-outline-variant">
              <span>Total Amount</span>
              <span className="text-primary">{formatINR(Number(invoice.total_amount))} {invoice.currency}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-outline-variant text-center text-xs text-on-surface-variant">
            <p>Thank you for choosing Super Townhouse!</p>
            <p className="mt-1">For any queries, contact us at info@supertownhouse.com | +91 80 2345 6789</p>
            <p className="mt-2 text-[10px]">This is a computer-generated invoice and does not require a physical signature.</p>
          </div>
        </div>
      </div>

      <style>{`
        /* Remove browser default URL / date / page-number from print header & footer */
        @page {
          margin: 10mm 12mm;
          size: A4 portrait;
        }

        @media print {
          /* Hide the InvoiceView's own control bar */
          .no-print { display: none !important; }

          /* Hide ALL admin chrome (sidebar, header, breadcrumb, etc.) */
          body.invoice-print-mode > * { visibility: hidden; }
          body.invoice-print-mode #invoice-content,
          body.invoice-print-mode #invoice-content * { visibility: visible; }

          /* Snap invoice to top-left corner of the A4 page */
          body.invoice-print-mode #invoice-content {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Stretch max-width to full page */
          body.invoice-print-mode .max-w-2xl {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Remove rounded corners and borders for clean print */
          body.invoice-print-mode .rounded-xl { border-radius: 0 !important; }
          body.invoice-print-mode .border { border: none !important; }

          /* Prevent page breaks inside invoice */
          body.invoice-print-mode #invoice-content > div {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
