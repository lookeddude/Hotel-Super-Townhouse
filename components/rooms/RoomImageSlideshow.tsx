'use client';

import { useState, useEffect, useCallback } from 'react';
import { BedDouble, ChevronLeft, ChevronRight } from 'lucide-react';

interface RoomImageSlideshowProps {
  images: { url: string; alt: string }[];
  roomName: string;
}

export function RoomImageSlideshow({ images, roomName }: RoomImageSlideshowProps) {
  const [failedIndexes, setFailedIndexes] = useState<Set<number>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Valid images = those that haven't failed to load
  const validImages = images
    .map((img, idx) => ({ ...img, originalIdx: idx }))
    .filter((_, idx) => !failedIndexes.has(idx));

  const handleImageError = useCallback((idx: number) => {
    setFailedIndexes((prev) => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
    // If the broken one is currently showing, jump to next valid one
    setCurrentIndex((prev) => {
      if (prev === idx) {
        const nextValid = images.findIndex((_, i) => i > idx && !failedIndexes.has(i));
        if (nextValid !== -1) return nextValid;
        const firstValid = images.findIndex((_, i) => !failedIndexes.has(i) && i !== idx);
        return firstValid !== -1 ? firstValid : prev;
      }
      return prev;
    });
  }, [images, failedIndexes]);

  // Auto-advance through valid images only
  useEffect(() => {
    if (validImages.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const currentValidPos = validImages.findIndex(v => v.originalIdx === prev);
        const nextPos = (currentValidPos + 1) % validImages.length;
        return validImages[nextPos]?.originalIdx ?? prev;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [validImages.length, isHovered]);

  const goToNext = () => {
    setCurrentIndex((prev) => {
      const currentValidPos = validImages.findIndex(v => v.originalIdx === prev);
      const nextPos = (currentValidPos + 1) % validImages.length;
      return validImages[nextPos]?.originalIdx ?? prev;
    });
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => {
      const currentValidPos = validImages.findIndex(v => v.originalIdx === prev);
      const prevPos = (currentValidPos - 1 + validImages.length) % validImages.length;
      return validImages[prevPos]?.originalIdx ?? prev;
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? goToNext() : goToPrev();
    setTouchStart(null);
  };

  // No valid images at all → show placeholder
  if (!images.length || (failedIndexes.size >= images.length && images.length > 0)) {
    return (
      <div className="relative bg-gray-900 h-72 md:h-[480px] w-full flex items-center justify-center">
        <BedDouble size={80} className="text-white/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white pointer-events-none">
          <div className="container-custom">
            <h1 className="font-heading text-3xl md:text-5xl font-bold">{roomName}</h1>
          </div>
        </div>
      </div>
    );
  }

  const currentValidPos = validImages.findIndex(v => v.originalIdx === currentIndex);

  return (
    <div className="w-full flex flex-col">
      {/* ── Main Hero Image ── */}
      <div
        className="relative h-72 md:h-[480px] w-full overflow-hidden bg-gray-900"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img.url}
            alt={img.alt || roomName}
            onError={() => handleImageError(idx)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              idx === currentIndex && !failedIndexes.has(idx)
                ? 'opacity-100 z-10'
                : 'opacity-0 z-0'
            }`}
          />
        ))}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent z-20 pointer-events-none" />

        {/* Arrows */}
        {validImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); goToPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-3 transition-all z-30 shadow-lg"
              aria-label="Previous image"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); goToNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-3 transition-all z-30 shadow-lg"
              aria-label="Next image"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* Room name */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-30 pointer-events-none text-white">
          <div className="container-custom">
            <h1 className="font-heading text-3xl md:text-5xl font-bold drop-shadow-lg">{roomName}</h1>
          </div>
        </div>

        {/* Dot indicators */}
        {validImages.length > 1 && (
          <div className="absolute bottom-6 right-8 flex gap-2 z-30">
            {validImages.map((v, pos) => (
              <button
                key={v.originalIdx}
                onClick={() => setCurrentIndex(v.originalIdx)}
                className={`transition-all rounded-full ${
                  pos === currentValidPos
                    ? 'w-6 h-2.5 bg-white'
                    : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to image ${pos + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Thumbnail Strip ── */}
      {validImages.length > 0 && (
        <div className="bg-gray-950 py-3">
          <div className="container-custom px-4">
            <p className="text-xs text-white/40 mb-2 uppercase tracking-wider font-medium">
              {validImages.length} Photo{validImages.length !== 1 ? 's' : ''} — Click to view
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {validImages.map((img, pos) => (
                <button
                  key={img.originalIdx}
                  onClick={() => setCurrentIndex(img.originalIdx)}
                  className={`relative flex-shrink-0 rounded-xl overflow-hidden transition-all duration-200 ${
                    img.originalIdx === currentIndex
                      ? 'h-20 w-28 ring-2 ring-primary ring-offset-2 ring-offset-gray-950 opacity-100 scale-105'
                      : 'h-20 w-28 opacity-50 hover:opacity-90 hover:scale-102'
                  }`}
                  aria-label={`View photo ${pos + 1}`}
                >
                  <img
                    src={img.url}
                    alt={`Room view ${pos + 1}`}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(img.originalIdx)}
                  />
                  {img.originalIdx === currentIndex && (
                    <div className="absolute inset-0 bg-primary/10" />
                  )}
                  <span className="absolute bottom-1 right-1.5 text-white text-[10px] font-bold bg-black/50 rounded px-1">
                    {pos + 1}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
