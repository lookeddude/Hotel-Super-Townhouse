'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Upload, Trash2, RefreshCcw, Image as ImageIcon } from 'lucide-react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { getGallery, createGalleryItem, updateGalleryItem, deleteGalleryItem, uploadToStorage, deleteFromStorage } from '@/services/galleryService';
import { toast } from 'sonner';

const CATEGORIES = ['rooms', 'lobby', 'reception', 'restaurant', 'exterior', 'parking', 'dining', 'other'];

export default function AdminGalleryPage() {
  const { supabase } = useSupabase();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] = useState('rooms');

  const load = useCallback(async () => {
    setIsLoading(true);
    const result = await getGallery(supabase, filterCategory || undefined);
    setItems(result.data ?? []);
    setIsLoading(false);
  }, [supabase, filterCategory]);

  useEffect(() => { load(); }, [load]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    let successCount = 0;
    for (const file of files) {
      if (!file.type.startsWith('image/')) { toast.error(`${file.name} is not an image`); continue; }
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} exceeds 5MB limit`); continue; }

      const ext = file.name.split('.').pop();
      const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { storagePath, error } = await uploadToStorage(supabase, path, file);

      if (error || !storagePath) { toast.error(`Failed to upload ${file.name}`); continue; }

      const { error: dbError } = await createGalleryItem(supabase, {
        storage_path: storagePath,
        title: file.name.replace(/\.[^.]+$/, ''),
        category: uploadCategory,
        alt_text: file.name,
        display_order: items.length + successCount + 1,
        is_active: true,
        file_size: file.size,
        mime_type: file.type,
      });
      if (dbError) toast.error(`Failed to save ${file.name} to gallery`);
      else successCount++;
    }

    if (successCount > 0) toast.success(`${successCount} image(s) uploaded successfully`);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    load();
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    const [{ error: dbError }] = await Promise.all([
      deleteGalleryItem(supabase, item.id),
      item.storage_path ? deleteFromStorage(supabase, item.storage_path) : Promise.resolve(),
    ]);
    if (dbError) { toast.error('Failed to delete'); return; }
    toast.success('Image deleted');
    load();
  };

  const handleToggleActive = async (item: any) => {
    await updateGalleryItem(supabase, item.id, { is_active: !item.is_active });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">Gallery Management</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">{items.length} images</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} disabled={isLoading} className="p-2 border border-outline-variant rounded-lg hover:bg-surface">
            <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-60">
            <Upload size={16} />{uploading ? 'Uploading…' : 'Upload Images'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
        </div>
      </div>

      {/* Upload settings */}
      <div className="bg-white rounded-lg border border-outline-variant p-4 flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-xs font-medium text-on-surface block mb-1">Upload to Category</label>
          <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} className="px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary">
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <p className="text-xs text-on-surface-variant self-end pb-0.5">Max 5MB per image • JPG, PNG, WebP accepted</p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterCategory('')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!filterCategory ? 'bg-primary text-white' : 'bg-surface text-on-surface-variant hover:bg-outline-variant'}`}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilterCategory(c)} className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${filterCategory === c ? 'bg-primary text-white' : 'bg-surface text-on-surface-variant hover:bg-outline-variant'}`}>{c}</button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({length: 10}).map((_,i) => <div key={i} className="aspect-square bg-surface rounded-lg animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg border border-outline-variant py-24 flex flex-col items-center gap-3 text-on-surface-variant">
          <ImageIcon size={40} className="opacity-30" />
          <p className="text-sm">No images yet. Click &quot;Upload Images&quot; to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((item) => (
            <div key={item.id} className="group relative bg-surface rounded-lg overflow-hidden aspect-square border border-outline-variant">
              {item.public_url ? (
                <img src={item.public_url} alt={item.alt_text || item.title} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-on-surface-variant"><ImageIcon size={24} /></div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <button onClick={() => handleToggleActive(item)} className={`text-xs px-3 py-1 rounded-full font-medium ${item.is_active ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
                  {item.is_active ? 'Active' : 'Hidden'}
                </button>
                <button onClick={() => handleDelete(item)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="absolute top-2 left-2">
                <span className="bg-black/50 text-white text-xs px-2 py-0.5 rounded capitalize">{item.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
