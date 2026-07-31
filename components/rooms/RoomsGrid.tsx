'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BedDouble, Users, Maximize2, Star } from 'lucide-react';

function RoomCard({ room }: { room: any }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-outline-variant overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row">
        {/* Room Image */}
        <div className="w-full md:w-72 h-48 md:h-auto flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-surface to-outline-variant">
          {room.coverUrl && !imgFailed ? (
            <img
              src={room.coverUrl}
              alt={room.name}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BedDouble size={48} className="text-outline" />
            </div>
          )}
          {room.breakfast_included && (
            <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              Breakfast Included
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="font-heading font-semibold text-lg text-on-surface">{room.name}</h2>
              <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">
                {room.short_description || room.description}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-heading font-bold text-xl text-primary">
                ₹{Number(room.base_price || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-on-surface-variant">per night</p>
            </div>
          </div>

          {/* Specs */}
          <div className="flex flex-wrap gap-4 mt-4">
            {room.max_occupancy && (
              <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                <Users size={15} className="text-primary" />
                <span>Up to {room.max_occupancy} guests</span>
              </div>
            )}
            {room.size_sqft && (
              <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                <Maximize2 size={15} className="text-primary" />
                <span>{room.size_sqft} sq ft</span>
              </div>
            )}
            {room.bed_type && (
              <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                <BedDouble size={15} className="text-primary" />
                <span className="capitalize">{room.bed_type}</span>
              </div>
            )}
            {room.view_type && (
              <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                <Star size={15} className="text-primary" />
                <span className="capitalize">{room.view_type} view</span>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3 mt-auto pt-4 border-t border-outline-variant">
            <Link
              href={`/rooms/${room.id}`}
              className="flex-1 text-center py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
            >
              View Details &amp; Book
            </Link>
            <Link
              href={`/rooms/${room.id}`}
              className="px-4 py-2.5 border border-outline-variant text-sm text-on-surface rounded-lg hover:bg-surface transition-colors"
            >
              More Info
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RoomsGrid({ rooms }: { rooms: any[] }) {
  return (
    <div className="space-y-5">
      {rooms.map((room: any) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}
