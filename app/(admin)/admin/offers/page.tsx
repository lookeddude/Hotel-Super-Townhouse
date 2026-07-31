'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, RefreshCcw, Tag, Calendar } from 'lucide-react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { getOffers, createOffer, updateOffer, deleteOffer } from '@/services/offersService';
import { toast } from 'sonner';

export default function AdminOffersPage() {
  const { supabase } = useSupabase();
  const [offers, setOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data } = await getOffers(supabase);
    setOffers(data ?? []);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete offer "${title}"?`)) return;
    const { error } = await deleteOffer(supabase, id);
    if (error) { toast.error('Failed to delete offer'); return; }
    toast.success('Offer deleted');
    load();
  };

  const handleToggleActive = async (offer: any) => {
    await updateOffer(supabase, offer.id, { is_active: !offer.is_active });
    toast.success(offer.is_active ? 'Offer deactivated' : 'Offer activated');
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">Offers & Promotions</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">{offers.length} offers</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} disabled={isLoading} className="p-2 border border-outline-variant rounded-lg hover:bg-surface">
            <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => { setEditingOffer(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark">
            <Plus size={16} />Create Offer
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({length:3}).map((_,i) => <div key={i} className="h-48 bg-surface rounded-xl animate-pulse" />)}
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-white rounded-lg border border-outline-variant py-20 text-center text-sm text-on-surface-variant">
          No offers yet. Create your first promotional offer.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer) => (
            <div key={offer.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${offer.is_active ? 'border-primary/30' : 'border-outline-variant opacity-70'}`}>
              {offer.thumbnail_url && <img src={offer.thumbnail_url} alt={offer.title} className="w-full h-32 object-cover" />}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-semibold text-base truncate">{offer.title}</h3>
                    {offer.discount_type && (
                      <div className="flex items-center gap-1 mt-1">
                        <Tag size={12} className="text-primary" />
                        <span className="text-sm font-semibold text-primary">
                          {offer.discount_value}{offer.discount_type === 'percentage' ? '%' : '₹'} OFF
                        </span>
                      </div>
                    )}
                  </div>
                  <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${offer.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {offer.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {offer.description && <p className="text-xs text-on-surface-variant mt-2 line-clamp-2">{offer.description}</p>}
                {/* DB uses 'code' column */}
                {offer.code && (
                  <div className="mt-3">
                    <span className="font-mono text-xs bg-surface px-3 py-1 rounded border border-outline-variant">{offer.code}</span>
                  </div>
                )}
                {(offer.valid_from || offer.valid_until) && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-on-surface-variant">
                    <Calendar size={11} />
                    <span>{offer.valid_from ? new Date(offer.valid_from).toLocaleDateString('en-IN') : ''}</span>
                    {offer.valid_from && offer.valid_until && <span>→</span>}
                    <span>{offer.valid_until ? new Date(offer.valid_until).toLocaleDateString('en-IN') : ''}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-outline-variant">
                  <button onClick={() => handleToggleActive(offer)} className="flex-1 py-1.5 text-xs border border-outline-variant rounded-lg hover:bg-surface text-on-surface-variant">
                    {offer.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => { setEditingOffer(offer); setShowModal(true); }} className="p-1.5 hover:bg-surface rounded text-on-surface-variant hover:text-primary">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(offer.id, offer.title)} className="p-1.5 hover:bg-red-50 rounded text-on-surface-variant hover:text-error">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <OfferModal
          offer={editingOffer}
          supabase={supabase}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}

function OfferModal({ offer, supabase, onClose, onSaved }: any) {
  const isEdit = !!offer;
  const [form, setForm] = useState({
    title: offer?.title ?? '',
    description: offer?.description ?? '',
    code: offer?.code ?? '',           // DB uses 'code' not 'coupon_code'
    discount_type: offer?.discount_type ?? 'percentage',
    discount_value: offer?.discount_value ?? '',
    valid_from: offer?.valid_from ?? '',
    valid_until: offer?.valid_until ?? '',
    is_active: offer?.is_active ?? true,
    min_nights: offer?.min_nights ?? '',
    thumbnail_url: offer?.thumbnail_url ?? '',  // DB uses 'thumbnail_url' not 'banner_url'
  });
  const [isSaving, setIsSaving] = useState(false);
  const INPUT = 'w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) { toast.error('Title is required'); return; }
    setIsSaving(true);
    const slug = form.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Math.random().toString(36).slice(2, 7);

    const payload = {
      ...form,
      slug: isEdit ? offer.slug : slug,
      discount_value: form.discount_value ? Number(form.discount_value) : null,
      min_nights: form.min_nights ? Number(form.min_nights) : null,
      code: form.code?.toUpperCase() || null,
      valid_from: form.valid_from || null,
      valid_until: form.valid_until || null,
      thumbnail_url: form.thumbnail_url || null,
    };
    const { error } = isEdit ? await updateOffer(supabase, offer.id, payload) : await createOffer(supabase, payload);
    if (error) { toast.error(error.message); setIsSaving(false); return; }
    toast.success(isEdit ? 'Offer updated' : 'Offer created');
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-outline-variant flex items-center justify-between">
          <h2 className="font-heading font-semibold text-lg">{isEdit ? 'Edit Offer' : 'Create Offer'}</h2>
          <button onClick={onClose} className="text-2xl text-on-surface-variant">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="block text-xs font-medium mb-1">Title *</label><input required value={form.title} onChange={(e) => setForm(p=>({...p,title:e.target.value}))} className={INPUT} /></div>
          <div><label className="block text-xs font-medium mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm(p=>({...p,description:e.target.value}))} rows={2} className={INPUT+' resize-none'} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium mb-1">Discount Type</label>
              <select value={form.discount_type} onChange={(e) => setForm(p=>({...p,discount_type:e.target.value}))} className={INPUT}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div><label className="block text-xs font-medium mb-1">Discount Value</label><input type="number" min={0} value={form.discount_value} onChange={(e) => setForm(p=>({...p,discount_value:e.target.value}))} className={INPUT} /></div>
            <div><label className="block text-xs font-medium mb-1">Promo Code</label><input value={form.code} onChange={(e) => setForm(p=>({...p,code:e.target.value.toUpperCase()}))} className={INPUT} placeholder="SUMMER20" /></div>
            <div><label className="block text-xs font-medium mb-1">Min Nights</label><input type="number" min={1} value={form.min_nights} onChange={(e) => setForm(p=>({...p,min_nights:e.target.value}))} className={INPUT} /></div>
            <div><label className="block text-xs font-medium mb-1">Valid From</label><input type="date" value={form.valid_from} onChange={(e) => setForm(p=>({...p,valid_from:e.target.value}))} className={INPUT} /></div>
            <div><label className="block text-xs font-medium mb-1">Valid Until</label><input type="date" value={form.valid_until} onChange={(e) => setForm(p=>({...p,valid_until:e.target.value}))} className={INPUT} /></div>
          </div>
          <div><label className="block text-xs font-medium mb-1">Thumbnail URL</label><input type="url" value={form.thumbnail_url} onChange={(e) => setForm(p=>({...p,thumbnail_url:e.target.value}))} className={INPUT} /></div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm(p=>({...p,is_active:e.target.checked}))} className="accent-primary w-4 h-4" /><span className="text-sm">Active</span></label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-outline-variant rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={isSaving} className="flex-1 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg disabled:opacity-60">
              {isSaving ? 'Saving…' : isEdit ? 'Update' : 'Create Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
