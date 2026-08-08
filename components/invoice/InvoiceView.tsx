'use client';
/**
 * components/invoice/InvoiceView.tsx
 * Full invoice display. Print opens a clean new window — no admin chrome, no browser URL/headers.
 */
import { formatINR, formatDate } from '@/services/pricingService';
import { Printer, X } from 'lucide-react';

interface InvoiceViewProps {
  invoice: any;
  booking?: any;
  onClose?: () => void;
}

export function InvoiceView({ invoice, booking, onClose }: InvoiceViewProps) {
  const lineItems: any[] = invoice.line_items ?? [];

  // Format currency inline (no import in new window)
  const fmt = (n: number) =>
    '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const handlePrint = () => {
    const cgstPct = Number(invoice.subtotal) > 0
      ? ((Number(invoice.cgst_amount) / Number(invoice.subtotal)) * 100).toFixed(0)
      : '0';

    const lineItemsHtml = lineItems.map((item: any) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #e6bdbb;">${item.description ?? ''}</td>
        <td style="padding:10px 0;border-bottom:1px solid #e6bdbb;text-align:center;">${item.nights ?? '—'}</td>
        <td style="padding:10px 0;border-bottom:1px solid #e6bdbb;text-align:right;">${item.rate ? fmt(item.rate) : '—'}</td>
        <td style="padding:10px 0;border-bottom:1px solid #e6bdbb;text-align:right;font-weight:600;">${fmt(Math.abs(item.amount))}${item.amount < 0 ? ' (−)' : ''}</td>
      </tr>
    `).join('');

    const stayHtml = booking ? `
      <div style="background:#f5f3f3;border-radius:8px;padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
        <div><div style="font-size:11px;color:#5d3f3e;">Check-in</div><div style="font-weight:600;">${formatDate(booking.check_in)}</div></div>
        <div><div style="font-size:11px;color:#5d3f3e;">Check-out</div><div style="font-weight:600;">${formatDate(booking.check_out)}</div></div>
        <div><div style="font-size:11px;color:#5d3f3e;">Duration</div><div style="font-weight:600;">${booking.nights} night${booking.nights !== 1 ? 's' : ''}</div></div>
        <div><div style="font-size:11px;color:#5d3f3e;">Guests</div><div style="font-weight:600;">${booking.num_adults} adult${booking.num_adults !== 1 ? 's' : ''}</div></div>
      </div>
    ` : '';

    const discountHtml = Number(invoice.discount_amount) > 0 ? `
      <div style="display:flex;justify-content:space-between;color:#2d6a4f;margin-bottom:6px;">
        <span>Discount</span><span>− ${fmt(Number(invoice.discount_amount))}</span>
      </div>` : '';

    const cgstHtml = Number(invoice.cgst_amount) > 0 ? `
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#5d3f3e;margin-bottom:6px;">
        <span>CGST (${cgstPct}%)</span><span>${fmt(Number(invoice.cgst_amount))}</span>
      </div>` : '';

    const sgstHtml = Number(invoice.sgst_amount) > 0 ? `
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#5d3f3e;margin-bottom:6px;">
        <span>SGST</span><span>${fmt(Number(invoice.sgst_amount))}</span>
      </div>` : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm 16mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 13px;
      color: #1b1c1c;
      background: #fff;
      line-height: 1.5;
    }
    .wrap { max-width: 680px; margin: 0 auto; }
    h1 { font-family: Georgia, serif; }
    table { width: 100%; border-collapse: collapse; }
    th { font-size: 11px; font-weight: 700; text-transform: uppercase;
         letter-spacing: 0.05em; color: #5d3f3e; padding: 8px 0;
         border-bottom: 2px solid #e6bdbb; }
    th:not(:first-child) { text-align: right; }
    th:nth-child(2) { text-align: center; }
  </style>
</head>
<body>
  <div class="wrap">

    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;">
      <div>
        <h1 style="font-size:26px;color:#e31837;font-weight:700;margin-bottom:6px;">Super Townhouse</h1>
        <div style="font-size:11px;color:#5d3f3e;line-height:1.8;">
          Plot No. 12, ITPL Main Road, Whitefield<br/>
          Bengaluru, Karnataka 560066<br/>
          GSTIN: 29AABCU9603R1ZX<br/>
          Phone: +91 80 2345 6789
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:20px;font-weight:700;color:#1b1c1c;margin-bottom:6px;">TAX INVOICE</div>
        <div style="font-size:11px;color:#5d3f3e;line-height:1.8;">
          Invoice No: <strong style="font-family:monospace;">${invoice.invoice_number}</strong><br/>
          Date: ${formatDate(invoice.issued_at?.split('T')[0])}<br/>
          ${booking?.booking_reference ? `Booking Ref: <span style="font-family:monospace;">${booking.booking_reference}</span>` : ''}
        </div>
      </div>
    </div>

    <hr style="border:none;border-top:1px solid #e6bdbb;margin-bottom:24px;"/>

    <!-- Bill To -->
    <div style="margin-bottom:24px;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#5d3f3e;margin-bottom:8px;">Bill To</div>
      <div style="font-weight:700;font-size:15px;">${invoice.guest_name ?? ''}</div>
      ${invoice.guest_email ? `<div style="color:#5d3f3e;">${invoice.guest_email}</div>` : ''}
      ${invoice.guest_phone ? `<div style="color:#5d3f3e;">${invoice.guest_phone}</div>` : ''}
      ${invoice.company_name ? `<div style="color:#5d3f3e;">${invoice.company_name}</div>` : ''}
      ${invoice.guest_gstin ? `<div style="font-size:11px;color:#5d3f3e;">GSTIN: ${invoice.guest_gstin}</div>` : ''}
    </div>

    <!-- Stay Details -->
    ${stayHtml}

    <!-- Line Items -->
    <table>
      <thead>
        <tr>
          <th style="text-align:left;">Description</th>
          <th style="text-align:center;">Nights</th>
          <th style="text-align:right;">Rate</th>
          <th style="text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>${lineItemsHtml}</tbody>
    </table>

    <!-- Totals -->
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e6bdbb;">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="color:#5d3f3e;">Subtotal</span>
        <span>${fmt(Number(invoice.subtotal))}</span>
      </div>
      ${discountHtml}
      ${cgstHtml}
      ${sgstHtml}
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;
                  padding-top:12px;border-top:2px solid #e6bdbb;margin-top:8px;">
        <span>Total Amount</span>
        <span style="color:#e31837;">${fmt(Number(invoice.total_amount))} ${invoice.currency ?? 'INR'}</span>
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top:36px;padding-top:20px;border-top:1px solid #e6bdbb;text-align:center;font-size:11px;color:#5d3f3e;">
      <div>Thank you for choosing Super Townhouse!</div>
      <div style="margin-top:4px;">For any queries, contact us at info@supertownhouse.com | +91 80 2345 6789</div>
      <div style="margin-top:8px;font-size:10px;">This is a computer-generated invoice and does not require a physical signature.</div>
    </div>

  </div>
  <script>
    window.onload = function() {
      window.focus();
      window.print();
      // Close the tab after printing (optional — comment out if you want to keep it)
      setTimeout(function(){ window.close(); }, 500);
    };
  </script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) {
      alert('Pop-up blocked! Please allow pop-ups for this site and try again.');
      return;
    }
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar */}
      <div className="bg-white border-b border-outline-variant px-6 py-3 flex items-center justify-between print:hidden">
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

      {/* Preview */}
      <div className="max-w-2xl mx-auto py-8 px-6">
        <div className="bg-white rounded-xl border border-outline-variant p-8">

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

          <div className="mb-6">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Bill To</p>
            <p className="font-semibold text-on-surface">{invoice.guest_name}</p>
            {invoice.guest_email && <p className="text-sm text-on-surface-variant">{invoice.guest_email}</p>}
            {invoice.guest_phone && <p className="text-sm text-on-surface-variant">{invoice.guest_phone}</p>}
            {invoice.guest_address && <p className="text-sm text-on-surface-variant">{invoice.guest_address}</p>}
          </div>

          {booking && (
            <div className="mb-6 bg-surface rounded-lg p-4 grid grid-cols-2 gap-2 text-sm">
              <div><p className="text-xs text-on-surface-variant">Check-in</p><p className="font-medium">{formatDate(booking.check_in)}</p></div>
              <div><p className="text-xs text-on-surface-variant">Check-out</p><p className="font-medium">{formatDate(booking.check_out)}</p></div>
              <div><p className="text-xs text-on-surface-variant">Duration</p><p className="font-medium">{booking.nights} night{booking.nights !== 1 ? 's' : ''}</p></div>
              <div><p className="text-xs text-on-surface-variant">Guests</p><p className="font-medium">{booking.num_adults} adult{booking.num_adults !== 1 ? 's' : ''}</p></div>
            </div>
          )}

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

          <div className="space-y-2 text-sm border-t border-outline-variant pt-4">
            <div className="flex justify-between"><span className="text-on-surface-variant">Subtotal</span><span>{formatINR(Number(invoice.subtotal))}</span></div>
            {Number(invoice.discount_amount) > 0 && (
              <div className="flex justify-between text-green-600"><span>Discount</span><span>− {formatINR(Number(invoice.discount_amount))}</span></div>
            )}
            {Number(invoice.cgst_amount) > 0 && (
              <div className="flex justify-between text-on-surface-variant text-xs">
                <span>CGST</span><span>{formatINR(Number(invoice.cgst_amount))}</span>
              </div>
            )}
            {Number(invoice.sgst_amount) > 0 && (
              <div className="flex justify-between text-on-surface-variant text-xs">
                <span>SGST</span><span>{formatINR(Number(invoice.sgst_amount))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-outline-variant">
              <span>Total Amount</span>
              <span className="text-primary">{formatINR(Number(invoice.total_amount))} {invoice.currency}</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-outline-variant text-center text-xs text-on-surface-variant">
            <p>Thank you for choosing Super Townhouse!</p>
            <p className="mt-1">For any queries, contact us at info@supertownhouse.com | +91 80 2345 6789</p>
            <p className="mt-2 text-[10px]">This is a computer-generated invoice and does not require a physical signature.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
