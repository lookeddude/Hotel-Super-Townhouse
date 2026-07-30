import type { Metadata } from 'next';
import { createMetadata } from '@/lib/metadata';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { createServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = createMetadata({
  title: 'FAQ',
  description: 'Frequently asked questions about Super Townhouse — check-in, check-out, policies, and more.',
});

export const revalidate = 60;

// Fallback FAQ data if DB is empty
const FALLBACK_FAQS = [
  { id: '1', question: 'What are the check-in and check-out times?', answer: 'Check-in is from 2:00 PM and check-out is by 11:00 AM. Early check-in and late check-out are subject to availability.' },
  { id: '2', question: 'Is parking available?', answer: 'Yes, we offer complimentary covered parking for all in-house guests.' },
  { id: '3', question: 'Do you have a restaurant?', answer: 'Yes, our in-house restaurant serves multi-cuisine breakfast, lunch, and dinner from 7:00 AM to 11:00 PM.' },
  { id: '4', question: 'Is Wi-Fi complimentary?', answer: 'High-speed fibre Wi-Fi is complimentary throughout the property — in rooms, lobby, and common areas.' },
  { id: '5', question: 'What is the cancellation policy?', answer: 'Cancellations made 24 hours before check-in receive a full refund. Late cancellations may be charged for one night.' },
  { id: '6', question: 'Is the hotel near ITPL?', answer: 'Yes, we are located within the ITPL Tech Park vicinity in Whitefield, making us ideal for business travelers.' },
];

export default async function FaqPage() {
  // Server-side Supabase fetch — reads from DB
  let faqs = FALLBACK_FAQS;
  try {
    const supabase = await createServerClient();
    const { data } = await (supabase as any)
      .from('faq')
      .select('id, question, answer, category, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (data && data.length > 0) faqs = data;
  } catch {
    // Silently fall back to static content
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-outline-variant py-8">
        <div className="container-custom">
          <Breadcrumb className="mb-3" />
          <h1 className="font-heading text-headline-lg text-on-surface">Frequently Asked Questions</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            Everything you need to know about your stay with us
          </p>
        </div>
      </div>

      <div className="container-custom py-12 max-w-3xl">
        <div className="space-y-4">
          {faqs.map((faq: any) => (
            <details
              key={faq.id}
              className="group bg-white rounded-lg border border-outline-variant p-5 cursor-pointer open:shadow-sm transition-shadow"
            >
              <summary className="flex items-center justify-between gap-4 font-heading font-semibold text-base text-on-surface list-none select-none">
                {faq.question}
                <span className="text-primary text-2xl flex-shrink-0 group-open:rotate-45 transition-transform duration-200">+</span>
              </summary>
              <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">{faq.answer}</p>
            </details>
          ))}
        </div>

        {faqs.length === 0 && (
          <div className="text-center py-16 text-on-surface-variant text-sm">
            No FAQs available yet. Please check back soon.
          </div>
        )}
      </div>
    </div>
  );
}
