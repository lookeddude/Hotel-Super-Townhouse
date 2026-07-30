'use client';

import { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { submitContactForm } from '@/services/contactService';
import { toast } from 'sonner';

export function ContactForm() {
  const { supabase } = useSupabase();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const INPUT = 'w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.message) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    const { error } = await submitContactForm(supabase, {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || undefined,
      subject: form.subject || 'General Inquiry',
      message: form.message,
    });
    if (error) {
      toast.error('Failed to send message. Please try again.');
      setSubmitting(false);
      return;
    }
    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-lg border border-outline-variant p-8 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h3 className="font-heading font-semibold text-xl text-on-surface">Message Sent!</h3>
        <p className="text-sm text-on-surface-variant max-w-xs">
          Thank you for reaching out. Our team will get back to you within 24 hours.
        </p>
        <button
          onClick={() => { setSubmitted(false); setForm({ full_name: '', email: '', phone: '', subject: '', message: '' }); }}
          className="mt-2 px-5 py-2.5 border border-outline-variant rounded-lg text-sm hover:bg-surface transition-colors"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-outline-variant p-8">
      <h2 className="font-heading text-headline-md text-on-surface mb-6">Send a Message</h2>
      <form className="space-y-4" onSubmit={handleSubmit} aria-label="Contact form" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="full_name" className="text-sm font-medium text-on-surface">Full Name <span className="text-error">*</span></label>
          <input
            id="full_name"
            type="text"
            required
            placeholder="Your full name"
            value={form.full_name}
            onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))}
            className={INPUT}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-on-surface">Email Address <span className="text-error">*</span></label>
          <input
            id="email"
            type="email"
            required
            placeholder="your@email.com"
            value={form.email}
            onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
            className={INPUT}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-sm font-medium text-on-surface">Phone Number</label>
          <input
            id="phone"
            type="tel"
            placeholder="+91 99999 00000"
            value={form.phone}
            onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
            className={INPUT}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="subject" className="text-sm font-medium text-on-surface">Subject</label>
          <input
            id="subject"
            type="text"
            placeholder="Booking inquiry, room availability, etc."
            value={form.subject}
            onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))}
            className={INPUT}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="message" className="text-sm font-medium text-on-surface">Message <span className="text-error">*</span></label>
          <textarea
            id="message"
            rows={4}
            required
            placeholder="How can we help you?"
            value={form.message}
            onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
            className={INPUT + ' resize-none'}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send size={16} />
              Send Message
            </>
          )}
        </button>
      </form>
    </div>
  );
}
