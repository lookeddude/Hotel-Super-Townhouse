'use client';

import { useState, useEffect } from 'react';
import { BedDouble, ChevronLeft, ChevronRight } from 'lucide-react';

interface RoomImageSlideshowProps {
  images: { url: string; alt: string }[];
  roomName: string;
}

export function RoomImageSlideshow({ images, roomName }: RoomImageSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    if (images.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length, isHovered]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
    setTouchStart(null);
  };

  if (!images.length) {
    return (
      <div className="relative bg-gray-900 h-72 md:h-[500px] w-full flex items-center justify-center">
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

  return (
    <div className="w-full flex flex-col">
      <div 
        className="relative h-72 md:h-[500px] w-full overflow-hidden bg-gray-900 group"
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
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-20 pointer-events-none" />
        
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); goToPrev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full p-2.5 transition-all z-30"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); goToNext(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full p-2.5 transition-all z-30"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-30 pointer-events-none text-white">
          <div className="container-custom">
            <h1 className="font-heading text-3xl md:text-5xl font-bold drop-shadow-md">{roomName}</h1>
          </div>
        </div>

        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all ${
                  idx === currentIndex 
                    ? 'w-3 h-3 rounded-full bg-white' 
                    : 'w-2 h-2 rounded-full bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail Strip — always shown */}
      <div className="bg-gray-950 py-3 px-4">
        <div className="container-custom">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative flex-shrink-0 h-20 w-28 rounded-lg overflow-hidden transition-all border-2 ${
                  idx === currentIndex
                    ? 'border-primary scale-105 brightness-110'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img.url}
                  alt={`View ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {idx === currentIndex && (
                  <div className="absolute inset-0 ring-2 ring-inset ring-primary/50 rounded-lg" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
