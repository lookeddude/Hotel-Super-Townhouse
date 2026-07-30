import type { Metadata } from 'next';
import { createMetadata } from '@/lib/metadata';
import { User, Phone, Mail, MapPin } from 'lucide-react';

export const metadata: Metadata = createMetadata({ title: 'My Profile', noIndex: true });

export default function DashboardProfilePage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-headline-md text-on-surface">Profile & Settings</h1>
        <p className="text-body-md text-on-surface-variant mt-1">Manage your personal information and preferences</p>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-lg border border-outline-variant p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-heading font-bold text-xl">
            G
          </div>
          <div>
            <p className="font-heading font-semibold text-on-surface">Guest User</p>
            <p className="text-sm text-on-surface-variant">Member since — Phase 2</p>
          </div>
          <button className="ml-auto px-4 py-2 border border-outline-variant rounded-lg text-sm hover:bg-surface transition-colors">
            Change Photo
          </button>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-lg border border-outline-variant p-6 space-y-5">
        <h2 className="font-heading font-semibold text-base text-on-surface">Personal Information</h2>
        <form className="space-y-4" aria-label="Profile form">
          {[
            { id: 'profile-name', icon: User, label: 'Full Name', placeholder: 'Your name', type: 'text' },
            { id: 'profile-email', icon: Mail, label: 'Email Address', placeholder: 'your@email.com', type: 'email' },
            { id: 'profile-phone', icon: Phone, label: 'Phone Number', placeholder: '+91 99999 00000', type: 'tel' },
            { id: 'profile-address', icon: MapPin, label: 'Address', placeholder: 'Your city, state', type: 'text' },
          ].map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.id} className="space-y-1.5">
                <label htmlFor={field.id} className="text-label-md text-on-surface flex items-center gap-2">
                  <Icon size={14} className="text-primary" aria-hidden="true" />
                  {field.label}
                </label>
                <input id={field.id} type={field.type} placeholder={field.placeholder}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-on-surface transition-colors" />
              </div>
            );
          })}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-6 py-2.5 bg-primary text-white text-label-md rounded-lg hover:bg-primary-dark transition-colors">Save Changes</button>
            <button type="button" className="px-6 py-2.5 border border-outline-variant text-label-md text-on-surface rounded-lg hover:bg-surface transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
