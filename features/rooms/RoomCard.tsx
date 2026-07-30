import Link from 'next/link';
import { BedDouble, Users, Maximize2, ArrowRight, Star } from 'lucide-react';
import { type Room } from '@/types/room';
import { formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/lib/utils';

interface RoomCardProps {
  room: Room;
  className?: string;
}

export function RoomCard({ room, className }: RoomCardProps) {
  const discount = room.originalPrice
    ? Math.round(((room.originalPrice - room.price) / room.originalPrice) * 100)
    : null;

  return (
    <article
      className={cn('card-base group bg-white', className)}
      aria-label={`Room: ${room.title}`}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-surface">
        {room.thumbnailImage ? (
          <img
            src={room.thumbnailImage}
            alt={room.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-container">
            <BedDouble size={48} className="text-outline" aria-hidden="true" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {room.isFeatured && (
            <span className="px-2.5 py-1 bg-primary text-white text-caption font-semibold rounded">
              Featured
            </span>
          )}
          {discount && (
            <span className="px-2.5 py-1 bg-black/70 text-white text-caption font-semibold rounded">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Availability indicator */}
        <div className="absolute top-3 right-3">
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded text-caption font-medium',
              room.isAvailable
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            )}
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                room.isAvailable ? 'bg-green-500' : 'bg-red-500'
              )}
              aria-hidden="true"
            />
            {room.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Title & Rating */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading font-semibold text-base text-on-surface leading-snug line-clamp-2">
            {room.title}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star size={13} fill="#e31837" className="text-primary" aria-hidden="true" />
            <span className="text-caption font-semibold text-on-surface">{room.rating}</span>
            <span className="text-caption text-on-surface-variant">({room.reviewCount})</span>
          </div>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-4 text-caption text-on-surface-variant">
          <span className="flex items-center gap-1">
            <Users size={13} aria-hidden="true" />
            {room.maxGuests} Guests
          </span>
          <span className="flex items-center gap-1">
            <Maximize2 size={13} aria-hidden="true" />
            {room.size} sq ft
          </span>
          <span className="flex items-center gap-1">
            <BedDouble size={13} aria-hidden="true" />
            {room.bedType}
          </span>
        </div>

        {/* Amenity chips */}
        {room.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {room.amenities.slice(0, 3).map((a) => (
              <span
                key={a}
                className="px-2.5 py-1 bg-surface text-caption text-on-surface-variant rounded"
              >
                {a}
              </span>
            ))}
            {room.amenities.length > 3 && (
              <span className="px-2.5 py-1 bg-surface text-caption text-on-surface-variant rounded">
                +{room.amenities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-outline-variant">
          <div>
            {room.originalPrice && (
              <span className="block text-caption text-on-surface-variant line-through">
                {formatCurrency(room.originalPrice)}
              </span>
            )}
            <span className="price-tag text-xl">
              {formatCurrency(room.price)}
            </span>
            <span className="text-caption text-on-surface-variant"> / night</span>
          </div>
          <Link
            href={`/rooms/${room.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-label-md rounded-lg hover:bg-primary-dark transition-colors group/btn"
            aria-label={`Book ${room.title}`}
          >
            Book Now
            <ArrowRight
              size={14}
              className="group-hover/btn:translate-x-0.5 transition-transform"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
