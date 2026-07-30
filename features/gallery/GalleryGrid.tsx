'use client';

import { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';

interface GalleryItem {
  id: string;
  title: string;
  public_url: string;
  alt_text?: string;
  category?: string;
}

interface GalleryGridProps {
  items: GalleryItem[];
  categories: string[];
}

export function GalleryGrid({ items, categories }: GalleryGridProps) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  const filtered = activeCategory === 'All'
    ? items
    : items.filter((i) => i.category?.toLowerCase() === activeCategory.toLowerCase());

  return (
    <>
      {/* Category Filter */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${
              activeCategory === cat
                ? 'bg-primary text-white border-primary'
                : 'border-outline-variant text-on-surface-variant hover:bg-surface'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-24 flex flex-col items-center gap-4 text-on-surface-variant">
          <ImageIcon size={48} className="opacity-30" />
          <div className="text-center">
            <p className="font-semibold text-on-surface">No images yet</p>
            <p className="text-sm mt-1">Gallery images will appear here once they are uploaded by the hotel team.</p>
          </div>
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setLightbox(item)}
              className="break-inside-avoid cursor-pointer rounded-lg overflow-hidden bg-surface group relative"
            >
              {item.public_url ? (
                <img
                  src={item.public_url}
                  alt={item.alt_text || item.title}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center bg-surface text-outline">
                  <ImageIcon size={32} />
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                <p className="p-3 text-white text-xs font-medium truncate w-full">{item.title}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            aria-label="Close lightbox"
          >
            <X size={24} />
          </button>
          <div onClick={(e) => e.stopPropagation()} className="max-w-4xl max-h-[90vh] w-full">
            {lightbox.public_url ? (
              <img
                src={lightbox.public_url}
                alt={lightbox.alt_text || lightbox.title}
                className="w-full h-full object-contain rounded-lg"
              />
            ) : null}
            {lightbox.title && (
              <p className="text-white text-center text-sm mt-3 opacity-80">{lightbox.title}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
