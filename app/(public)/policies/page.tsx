import type { Metadata } from 'next';
import { createMetadata } from '@/lib/metadata';
import { Breadcrumb } from '@/components/shared/Breadcrumb';

export const metadata: Metadata = createMetadata({ title: 'Hotel Policies', description: 'Read Super Townhouse hotel policies — booking, cancellation, check-in, and guest conduct policies.' });

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-outline-variant py-8">
        <div className="container-custom">
          <Breadcrumb className="mb-3" />
          <h1 className="font-heading text-headline-lg text-on-surface">Hotel Policies</h1>
          <p className="text-body-md text-on-surface-variant mt-2">Please read our policies before booking</p>
        </div>
      </div>
      <div className="container-custom py-12 max-w-3xl space-y-10">
        {[
          { id: 'cancellation', title: 'Cancellation Policy', content: 'Cancellations made 24+ hours before check-in: Full refund. Cancellations made within 24 hours: One night charge applies. No-shows: Charged for the full booking.' },
          { title: 'Check-in / Check-out', content: 'Standard check-in time is 2:00 PM. Standard check-out time is 11:00 AM. Early check-in or late check-out is subject to availability and charges.' },
          { title: 'Guest Conduct', content: 'We expect all guests to respect fellow guests and staff. Noise after 10:00 PM should be kept to a minimum. Smoking is permitted only in designated areas.' },
          { title: 'Payment Policy', content: 'We accept all major credit/debit cards, UPI, and net banking. Payment is required at check-in unless a pre-payment was made online.' },
          { title: 'Identification', content: 'A valid government-issued photo ID is mandatory at check-in for all guests. Foreign nationals must present a valid passport.' },
        ].map((section) => (
          <section key={section.title} aria-labelledby={`policy-${section.title}`}>
            <h2 id={`policy-${section.title}`} className="font-heading font-semibold text-lg text-on-surface mb-3 flex items-center gap-3">
              <span className="w-1 h-6 bg-primary rounded-full flex-shrink-0" aria-hidden="true" />
              {section.title}
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed pl-4">{section.content}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
