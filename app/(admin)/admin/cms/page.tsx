'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Save, Loader2, Plus, Trash2, Edit2, Check, X, ImageIcon, Upload, Clock, ToggleLeft, ToggleRight, GripVertical } from 'lucide-react';
import { useSupabase } from '@/providers/SupabaseProvider';
import {
  getHotelInfo, updateHotelInfo,
  getFAQs, createFAQ, updateFAQ, deleteFAQ,
  getAllSettings, upsertSetting,
} from '@/services/cmsService';
import { getContactMessages, markContactResolved, deleteContactMessage } from '@/services/contactService';
import { toast } from 'sonner';

type Tab = 'hotel' | 'faq' | 'contacts' | 'settings' | 'slideshow';

export default function AdminCMSPage() {
  const [activeTab, setActiveTab] = useState<Tab>('hotel');
  const TABS: { id: Tab; label: string }[] = [
    { id: 'hotel',     label: 'Hotel Info' },
    { id: 'faq',       label: 'FAQ' },
    { id: 'contacts',  label: 'Contact Requests' },
    { id: 'settings',  label: 'Site Settings' },
    { id: 'slideshow', label: '🆼 Hero Slideshow' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-headline-md text-on-surface">Website CMS</h1>
        <p className="text-body-sm text-on-surface-variant mt-1">Manage all website content and settings</p>
      </div>
      <div className="border-b border-outline-variant">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      {activeTab === 'hotel'     && <HotelInfoTab />}
      {activeTab === 'faq'       && <FAQTab />}
      {activeTab === 'contacts'  && <ContactsTab />}
      {activeTab === 'settings'  && <SettingsTab />}
      {activeTab === 'slideshow' && <SlideshowTab />}
    </div>
  );
}

// ─── Hotel Info (corrected column names) ─────────────────────────────────────

function HotelInfoTab() {
  const { supabase } = useSupabase();
  const [hotel, setHotel] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getHotelInfo(supabase).then(({ data }) => {
      setHotel(data);
      setForm(data ?? {});
      setIsLoading(false);
    });
  }, [supabase]);

  const handleSave = async () => {
    if (!hotel?.id) { toast.error('No hotel record found'); return; }
    setIsSaving(true);
    // Only send updatable fields (not id, created_at, updated_at)
    const { id, created_at, updated_at, ...updateData } = form;
    const { error } = await updateHotelInfo(supabase, hotel.id, updateData);
    if (error) toast.error('Failed to save: ' + error.message);
    else toast.success('Hotel information updated successfully');
    setIsSaving(false);
  };

  if (isLoading) return <div className="py-16 text-center text-sm text-on-surface-variant">Loading hotel information…</div>;

  // Using actual DB column names
  const FIELDS = [
    { key: 'name', label: 'Hotel Name', type: 'text' },
    { key: 'tagline', label: 'Tagline', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea', span: true },
    { key: 'phone_primary', label: 'Primary Phone', type: 'text' },
    { key: 'phone_secondary', label: 'Secondary Phone', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'website', label: 'Website', type: 'url' },
    { key: 'address_line1', label: 'Address Line 1', type: 'text' },
    { key: 'address_line2', label: 'Address Line 2', type: 'text' },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'state', label: 'State', type: 'text' },
    { key: 'postal_code', label: 'Postal Code', type: 'text' },
    { key: 'country', label: 'Country', type: 'text' },
    { key: 'check_in_time', label: 'Check-in Time', type: 'time' },
    { key: 'check_out_time', label: 'Check-out Time', type: 'time' },
    { key: 'latitude', label: 'Latitude', type: 'number' },
    { key: 'longitude', label: 'Longitude', type: 'number' },
    { key: 'star_rating', label: 'Star Rating', type: 'number' },
    { key: 'total_rooms', label: 'Total Rooms', type: 'number' },
    { key: 'gstin', label: 'GSTIN', type: 'text' },
    { key: 'pan', label: 'PAN', type: 'text' },
    { key: 'social_instagram', label: 'Instagram URL', type: 'url' },
    { key: 'social_facebook', label: 'Facebook URL', type: 'url' },
    { key: 'social_twitter', label: 'Twitter / X URL', type: 'url' },
    { key: 'social_youtube', label: 'YouTube URL', type: 'url' },
    { key: 'logo_url', label: 'Logo URL', type: 'url' },
    { key: 'cover_image_url', label: 'Cover Image URL', type: 'url' },
  ];

  return (
    <div className="bg-white rounded-lg border border-outline-variant">
      <div className="p-6 border-b border-outline-variant flex items-center justify-between">
        <h2 className="font-heading font-semibold text-base text-on-surface">Hotel Information</h2>
        <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-60">
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {isSaving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        {FIELDS.map((f) => (
          <div key={f.key} className={(f as any).span ? 'md:col-span-2' : ''}>
            <label className="block text-xs font-medium text-on-surface mb-1.5">{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea value={form[f.key] ?? ''} onChange={(e) => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))} rows={4} className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary resize-none" />
            ) : (
              <input type={f.type} value={form[f.key] ?? ''} onChange={(e) => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))} className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FAQ (corrected: is_active not is_published) ──────────────────────────────

function FAQTab() {
  const { supabase } = useSupabase();
  const [faqs, setFaqs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ question: '', answer: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data } = await getFAQs(supabase);
    setFaqs(data ?? []);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newFaq.question || !newFaq.answer) { toast.error('Question and answer required'); return; }
    const { error } = await createFAQ(supabase, { question: newFaq.question, answer: newFaq.answer, display_order: faqs.length + 1, is_active: true });
    if (error) { toast.error('Failed to create FAQ'); return; }
    toast.success('FAQ added');
    setNewFaq({ question: '', answer: '' });
    setShowAdd(false);
    load();
  };

  const handleUpdate = async (id: string) => {
    const { error } = await updateFAQ(supabase, id, editForm);
    if (error) { toast.error('Failed to update'); return; }
    toast.success('FAQ updated');
    setEditingId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    await deleteFAQ(supabase, id);
    toast.success('FAQ deleted');
    load();
  };

  const handleToggle = async (faq: any) => {
    await updateFAQ(supabase, faq.id, { is_active: !faq.is_active });
    load();
  };

  if (isLoading) return <div className="py-16 text-center text-sm text-on-surface-variant">Loading FAQs…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-on-surface-variant">{faqs.length} FAQs</p>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark">
          <Plus size={14} />Add FAQ
        </button>
      </div>
      {showAdd && (
        <div className="bg-white rounded-lg border border-primary/30 p-5 space-y-3">
          <h3 className="font-medium text-sm">New FAQ</h3>
          <input placeholder="Question" value={newFaq.question} onChange={(e) => setNewFaq(p => ({ ...p, question: e.target.value }))} className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary" />
          <textarea placeholder="Answer" value={newFaq.answer} onChange={(e) => setNewFaq(p => ({ ...p, answer: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary resize-none" />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 bg-primary text-white text-sm rounded-lg">Save</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-outline-variant rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {faqs.map((faq) => (
          <div key={faq.id} className="bg-white rounded-lg border border-outline-variant">
            {editingId === faq.id ? (
              <div className="p-4 space-y-3">
                <input value={editForm.question} onChange={(e) => setEditForm(p => ({ ...p, question: e.target.value }))} className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none" />
                <textarea value={editForm.answer} onChange={(e) => setEditForm(p => ({ ...p, answer: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none resize-none" />
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(faq.id)} className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg flex items-center gap-1"><Check size={12} />Save</button>
                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 border border-outline-variant text-xs rounded-lg flex items-center gap-1"><X size={12} />Cancel</button>
                </div>
              </div>
            ) : (
              <div className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-on-surface">{faq.question}</p>
                  <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">{faq.answer}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleToggle(faq)} className={`text-xs px-2 py-0.5 rounded-full ${faq.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {faq.is_active ? 'Active' : 'Draft'}
                  </button>
                  <button onClick={() => { setEditingId(faq.id); setEditForm({ question: faq.question, answer: faq.answer }); }} className="p-1.5 hover:bg-surface rounded text-on-surface-variant hover:text-primary">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDelete(faq.id)} className="p-1.5 hover:bg-red-50 rounded text-on-surface-variant hover:text-error">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {faqs.length === 0 && !showAdd && (
          <div className="bg-white rounded-lg border border-outline-variant py-16 text-center text-sm text-on-surface-variant">No FAQs yet.</div>
        )}
      </div>
    </div>
  );
}

// ─── Contacts (corrected: full_name, is_replied) ──────────────────────────────

function ContactsTab() {
  const { supabase } = useSupabase();
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const resolved = filter === 'all' ? undefined : filter === 'resolved';
    const { data } = await getContactMessages(supabase, { resolved });
    setContacts(data ?? []);
    setIsLoading(false);
  }, [supabase, filter]);

  useEffect(() => { load(); }, [load]);

  const handleResolve = async (id: string, resolved: boolean) => {
    await markContactResolved(supabase, id, !resolved);
    toast.success(!resolved ? 'Marked as resolved' : 'Marked as pending');
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    await deleteContactMessage(supabase, id);
    toast.success('Message deleted');
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {(['all', 'pending', 'resolved'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-surface text-on-surface-variant hover:bg-outline-variant'}`}>{f}</button>
        ))}
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({length:5}).map((_,i) => <div key={i} className="h-16 bg-surface rounded-lg animate-pulse" />)}</div>
      ) : contacts.length === 0 ? (
        <div className="bg-white rounded-lg border border-outline-variant py-16 text-center text-sm text-on-surface-variant">No messages found</div>
      ) : (
        <div className="space-y-2">
          {contacts.map((c) => (
            <div key={c.id} className="bg-white rounded-lg border border-outline-variant overflow-hidden">
              <div className="px-5 py-4 flex items-start justify-between gap-4 cursor-pointer" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.is_replied ? 'bg-green-400' : 'bg-yellow-400'}`} />
                    <p className="font-medium text-sm text-on-surface">{c.full_name}</p>
                    <span className="text-xs text-on-surface-variant">{c.email}</span>
                  </div>
                  <p className="text-sm text-on-surface-variant mt-0.5 truncate">{c.subject}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-on-surface-variant">{new Date(c.created_at).toLocaleDateString('en-IN')}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleResolve(c.id, c.is_replied); }} className={`text-xs px-2 py-0.5 rounded-full ${c.is_replied ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {c.is_replied ? '✓ Replied' : 'Pending'}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="p-1.5 hover:bg-red-50 rounded text-on-surface-variant hover:text-error">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {expanded === c.id && (
                <div className="px-5 pb-4 border-t border-outline-variant pt-4 text-sm text-on-surface-variant whitespace-pre-wrap bg-surface/30">{c.message}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function SettingsTab() {
  const { supabase } = useSupabase();
  const [settings, setSettings] = useState<any[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    getAllSettings(supabase).then(({ data }) => { setSettings(data ?? []); setIsLoading(false); });
  }, [supabase]);

  const handleSave = async (key: string) => {
    const value = edits[key] ?? settings.find(s => s.key === key)?.value;
    setSavingKey(key);
    const { error } = await upsertSetting(supabase, key, value);
    if (error) toast.error('Failed to save');
    else { toast.success(`"${key}" updated`); setEdits(p => { const n = {...p}; delete n[key]; return n; }); }
    setSavingKey(null);
  };

  if (isLoading) return <div className="py-16 text-center text-sm text-on-surface-variant">Loading settings…</div>;

  return (
    <div className="bg-white rounded-lg border border-outline-variant">
      <div className="p-5 border-b border-outline-variant">
        <h2 className="font-semibold text-base">Site Settings</h2>
        <p className="text-xs text-on-surface-variant mt-0.5">Settings are applied immediately on save</p>
      </div>
      <div className="divide-y divide-outline-variant">
        {settings.length === 0 ? (
          <div className="py-12 text-center text-sm text-on-surface-variant">No settings found</div>
        ) : settings.map((s) => {
          const isDirty = edits[s.key] !== undefined && edits[s.key] !== s.value;
          return (
            <div key={s.key} className="flex items-center gap-4 px-5 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono font-medium text-on-surface">{s.key}</p>
                {s.description && <p className="text-xs text-on-surface-variant">{s.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={edits[s.key] ?? s.value ?? ''}
                  onChange={(e) => setEdits(p => ({ ...p, [s.key]: e.target.value }))}
                  className="w-48 px-3 py-1.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary"
                />
                {isDirty && (
                  <button onClick={() => handleSave(s.key)} disabled={savingKey === s.key} className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg disabled:opacity-60">
                    {savingKey === s.key ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Hero Slideshow Manager ──────────────────────────────────────────────────────
function SlideshowTab() {
  const { supabase }             = useSupabase();
  const fileRef                  = useRef<HTMLInputElement>(null);
  const mobileFileRefs            = useRef<Record<string, HTMLInputElement | null>>({});
  const tabletFileRefs            = useRef<Record<string, HTMLInputElement | null>>({});
  const [slides, setSlides]      = useState<any[]>([]);
  const [loading, setLoading]    = useState(true);
  const [uploading, setUploading]= useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [intervalVal, setIntervalVal] = useState(4);
  const [savingInterval, setSavingInterval] = useState(false);
  const [editId, setEditId]      = useState<string | null>(null);
  const [editForm, setEditForm]  = useState({ title: '', subtitle: '' });

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: sl }, { data: st }] = await Promise.all([
      (supabase as any).from('hero_slides').select('*').order('sort_order', { ascending: true }),
      (supabase as any).from('settings').select('value').eq('key', 'slideshow_interval').single(),
    ]);
    setSlides(sl ?? []);
    if (st?.value) setIntervalVal(Number(st.value));
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setUploading(true);
    const ext      = file.name.split('.').pop();
    const fileName = `slide-${Date.now()}.${ext}`;
    const { error: upErr } = await (supabase as any).storage.from('hero-slides').upload(fileName, file, { upsert: false });
    if (upErr) { toast.error('Upload failed: ' + upErr.message); setUploading(false); return; }
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/hero-slides/${fileName}`;
    const { error: dbErr } = await (supabase as any).from('hero_slides').insert({
      image_url: publicUrl, title: '', subtitle: '', sort_order: (slides.length + 1), is_active: true,
    });
    if (dbErr) toast.error('DB error'); else { toast.success('Slide added!'); load(); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const toggleActive = async (id: string, current: boolean) => {
    await (supabase as any).from('hero_slides').update({ is_active: !current }).eq('id', id);
    setSlides(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s));
    toast.success(!current ? 'Slide shown on website' : 'Slide hidden from website');
  };

  const deleteSlide = async (id: string, imageUrl: string) => {
    if (!confirm('Delete this slide?')) return;
    if (imageUrl.includes('/hero-slides/')) {
      const path = imageUrl.split('/hero-slides/')[1];
      await (supabase as any).storage.from('hero-slides').remove([path]);
    }
    await (supabase as any).from('hero_slides').delete().eq('id', id);
    setSlides(prev => prev.filter(s => s.id !== id));
    toast.success('Slide deleted');
  };

  const saveEdit = async () => {
    if (!editId) return;
    await (supabase as any).from('hero_slides').update({ title: editForm.title, subtitle: editForm.subtitle }).eq('id', editId);
    setSlides(prev => prev.map(s => s.id === editId ? { ...s, ...editForm } : s));
    setEditId(null);
    toast.success('Slide updated');
  };

  const updateOrder = async (id: string, order: number) => {
    await (supabase as any).from('hero_slides').update({ sort_order: order }).eq('id', id);
    setSlides(prev => [...prev.map(s => s.id === id ? { ...s, sort_order: order } : s)].sort((a,b) => a.sort_order - b.sort_order));
  };

  const saveInterval = async () => {
    setSavingInterval(true);
    await (supabase as any).from('settings').update({ value: String(intervalVal) }).eq('key', 'slideshow_interval');
    setSavingInterval(false);
    toast.success(`Speed saved — slides change every ${intervalVal}s`);
  };

  // Upload a device-specific image for an existing slide
  const handleDeviceUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    slideId: string,
    device: 'mobile' | 'tablet'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setUploadingId(slideId + device);
    const ext      = file.name.split('.').pop();
    const fileName = `slide-${device}-${Date.now()}.${ext}`;
    const { error: upErr } = await (supabase as any).storage.from('hero-slides').upload(fileName, file, { upsert: false });
    if (upErr) { toast.error('Upload failed: ' + upErr.message); setUploadingId(null); return; }
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/hero-slides/${fileName}`;
    const col = device === 'mobile' ? 'mobile_image_url' : 'tablet_image_url';
    await (supabase as any).from('hero_slides').update({ [col]: publicUrl }).eq('id', slideId);
    setSlides(prev => prev.map(s => s.id === slideId ? { ...s, [col]: publicUrl } : s));
    toast.success(`${device === 'mobile' ? 'Mobile' : 'Tablet'} image uploaded!`);
    setUploadingId(null);
    e.target.value = '';
  };

  // Remove device-specific image (reverts to desktop fallback)
  const removeDeviceImage = async (slideId: string, device: 'mobile' | 'tablet', imageUrl: string) => {
    const col = device === 'mobile' ? 'mobile_image_url' : 'tablet_image_url';
    if (imageUrl?.includes('/hero-slides/')) {
      const path = imageUrl.split('/hero-slides/')[1];
      await (supabase as any).storage.from('hero-slides').remove([path]);
    }
    await (supabase as any).from('hero_slides').update({ [col]: null }).eq('id', slideId);
    setSlides(prev => prev.map(s => s.id === slideId ? { ...s, [col]: null } : s));
    toast.success(`${device === 'mobile' ? 'Mobile' : 'Tablet'} image removed`);
  };

  const INPUT = 'w-full px-3 py-1.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary';

  return (
    <div className="space-y-5 pt-4">

      {/* Interval */}
      <div className="bg-white rounded-xl border border-outline-variant p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-primary" />
          <h3 className="font-semibold text-on-surface">Slideshow Speed</h3>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm text-on-surface-variant">Change image every</span>
          <input type="number" min={2} max={30} value={intervalVal}
            onChange={e => setIntervalVal(Number(e.target.value))}
            className="w-20 px-3 py-2 border border-outline-variant rounded-lg text-sm text-center focus:outline-none focus:border-primary" />
          <span className="text-sm text-on-surface-variant">seconds</span>
          <button onClick={saveInterval} disabled={savingInterval}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50">
            {savingInterval ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save Speed
          </button>
        </div>
        <p className="text-xs text-on-surface-variant mt-2">Min: 2s &nbsp;|&nbsp; Max: 30s. Changes apply instantly on the website without redeployment.</p>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-xl border border-outline-variant p-5">
        <div className="flex items-center gap-2 mb-4">
          <Upload size={16} className="text-primary" />
          <h3 className="font-semibold text-on-surface">Upload New Slide</h3>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleUpload} className="hidden" />
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="flex items-center justify-center gap-2 px-5 py-4 border-2 border-dashed border-outline-variant rounded-xl text-sm text-on-surface-variant hover:border-primary hover:text-primary transition-colors disabled:opacity-50 w-full">
          {uploading
            ? <><Loader2 size={16} className="animate-spin" /> Uploading…</>
            : <><ImageIcon size={16} /> Click to upload &nbsp;(JPG, PNG, WebP &middot; max 5MB)</>}
        </button>
        <p className="text-xs text-on-surface-variant mt-2">Recommended: 1920×1080px landscape. After upload you can add a title and subtitle.</p>
      </div>

      {/* Slides */}
      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
          <h3 className="font-semibold text-on-surface">All Slides ({slides.length})</h3>
          <button onClick={load} className="text-xs text-primary hover:underline">Refresh</button>
        </div>

        {loading ? (
          <div className="p-8 text-center"><Loader2 size={20} className="animate-spin mx-auto text-on-surface-variant" /></div>
        ) : slides.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            <ImageIcon size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">No slides yet</p>
            <p className="text-sm mt-1">Upload your first slide above</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/40">
            {slides.map((slide, idx) => (
              <div key={slide.id} className="p-5 space-y-4">

                {/* Slide header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-semibold text-sm text-on-surface">Slide {idx + 1}</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => toggleActive(slide.id, slide.is_active)}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                        slide.is_active ? 'border-green-200 text-green-700 bg-green-50' : 'border-outline-variant text-on-surface-variant'
                      }`}>
                      {slide.is_active ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                      {slide.is_active ? 'Active' : 'Hidden'}
                    </button>
                    {editId !== slide.id && (
                      <button onClick={() => { setEditId(slide.id); setEditForm({ title: slide.title||'', subtitle: slide.subtitle||'' }); }}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs border border-outline-variant rounded-lg hover:bg-surface">
                        <Edit2 size={11} /> Edit Text
                      </button>
                    )}
                    <button onClick={() => deleteSlide(slide.id, slide.image_url)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50">
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                </div>

                {/* Edit title/subtitle */}
                {editId === slide.id && (
                  <div className="space-y-2 p-3 bg-surface rounded-lg">
                    <input value={editForm.title} onChange={e => setEditForm(p => ({...p, title: e.target.value}))}
                      placeholder="Title on slide (optional)" className={INPUT} />
                    <input value={editForm.subtitle} onChange={e => setEditForm(p => ({...p, subtitle: e.target.value}))}
                      placeholder="Subtitle on slide (optional)" className={INPUT} />
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs rounded-lg"><Check size={11} /> Save</button>
                      <button onClick={() => setEditId(null)} className="flex items-center gap-1 px-3 py-1.5 border border-outline-variant text-xs rounded-lg"><X size={11} /> Cancel</button>
                    </div>
                  </div>
                )}

                {/* 3 image slots */}
                <div className="grid grid-cols-3 gap-3">

                  {/* Desktop */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">💻 Desktop <span className="font-normal normal-case">(1920×900)</span></p>
                    <div className="relative rounded-lg overflow-hidden border border-outline-variant bg-surface" style={{ aspectRatio: '16/9' }}>
                      <Image src={slide.image_url} alt="Desktop" fill className="object-cover" sizes="200px" />
                    </div>
                    <p className="text-[9px] text-green-600 font-medium">✓ Uploaded</p>
                  </div>

                  {/* Tablet */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">📱 Tablet <span className="font-normal normal-case">(1080×1080)</span></p>
                    {slide.tablet_image_url ? (
                      <div className="relative rounded-lg overflow-hidden border border-outline-variant bg-surface" style={{ aspectRatio: '1/1' }}>
                        <Image src={slide.tablet_image_url} alt="Tablet" fill className="object-cover" sizes="200px" />
                        <button onClick={() => removeDeviceImage(slide.id, 'tablet', slide.tablet_image_url)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px]">
                          <X size={9} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input type="file" accept="image/*" className="hidden"
                          ref={el => { tabletFileRefs.current[slide.id] = el; }}
                          onChange={e => handleDeviceUpload(e, slide.id, 'tablet')} />
                        <button onClick={() => tabletFileRefs.current[slide.id]?.click()}
                          disabled={uploadingId === slide.id + 'tablet'}
                          className="w-full flex flex-col items-center justify-center gap-1 border-2 border-dashed border-outline-variant rounded-lg text-on-surface-variant hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                          style={{ aspectRatio: '1/1' }}>
                          {uploadingId === slide.id + 'tablet'
                            ? <Loader2 size={14} className="animate-spin" />
                            : <><Upload size={14} /><span className="text-[9px]">Upload</span></>}
                        </button>
                      </>
                    )}
                    <p className="text-[9px] text-on-surface-variant">{slide.tablet_image_url ? '✓ Custom' : 'Using desktop fallback'}</p>
                  </div>

                  {/* Mobile */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">📱 Mobile <span className="font-normal normal-case">(900×1200)</span></p>
                    {slide.mobile_image_url ? (
                      <div className="relative rounded-lg overflow-hidden border border-outline-variant bg-surface" style={{ aspectRatio: '3/4' }}>
                        <Image src={slide.mobile_image_url} alt="Mobile" fill className="object-cover" sizes="200px" />
                        <button onClick={() => removeDeviceImage(slide.id, 'mobile', slide.mobile_image_url)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px]">
                          <X size={9} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input type="file" accept="image/*" className="hidden"
                          ref={el => { mobileFileRefs.current[slide.id] = el; }}
                          onChange={e => handleDeviceUpload(e, slide.id, 'mobile')} />
                        <button onClick={() => mobileFileRefs.current[slide.id]?.click()}
                          disabled={uploadingId === slide.id + 'mobile'}
                          className="w-full flex flex-col items-center justify-center gap-1 border-2 border-dashed border-outline-variant rounded-lg text-on-surface-variant hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                          style={{ aspectRatio: '3/4' }}>
                          {uploadingId === slide.id + 'mobile'
                            ? <Loader2 size={14} className="animate-spin" />
                            : <><Upload size={14} /><span className="text-[9px]">Upload</span></>}
                        </button>
                      </>
                    )}
                    <p className="text-[9px] text-on-surface-variant">{slide.mobile_image_url ? '✓ Custom' : 'Using desktop fallback'}</p>
                  </div>

                </div>

                {/* Order */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant">Display Order:</span>
                  <input type="number" min={1} value={slide.sort_order}
                    onChange={e => updateOrder(slide.id, Number(e.target.value))}
                    className="w-16 px-2 py-1 border border-outline-variant rounded text-xs text-center focus:outline-none focus:border-primary" />
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
