'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BedDouble, Users, Maximize2, Coffee, Star, ChevronRight } from 'lucide-react';

function RoomCard({ room }: { room: any }) {
  const [imgError, setImgError] = useState(false);

  const price = Number(room.base_price || 0).toLocaleString('en-IN');

  return (
    <div className="group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex flex-col md:flex-row">

        {/* Image */}
        <div className="relative w-full md:w-80 h-56 md:h-auto flex-shrink-0 bg-gradient-to-br from-rose-50 to-rose-100 overflow-hidden">
          {room.coverUrl && !imgError ? (
            <img
              src={room.coverUrl}
              alt={room.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <BedDouble size={52} className="text-rose-300" />
              <span className="text-xs text-rose-400 font-medium">No Image</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {room.breakfast_included && (
              <span className="flex items-center gap-1 bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow">
                <Coffee size={10} /> Breakfast Included
              </span>
            )}
            {room.view_type && (
              <span className="flex items-center gap-1 bg-blue-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow">
                <Star size={10} /> {room.view_type} View
              </span>
            )}
          </div>

          {/* Price tag on image */}
          <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white rounded-xl px-3 py-1.5 text-right">
            <p className="font-bold text-lg leading-none">₹{price}</p>
            <p className="text-xs text-white/70">per night</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex-1">
            <h2 className="font-heading font-bold text-xl text-gray-900 mb-1">{room.name}</h2>
            <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">
              {room.short_description || room.description}
            </p>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              {room.max_occupancy && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <Users size={14} className="text-primary flex-shrink-0" />
                  <span className="text-xs text-gray-600">Up to {room.max_occupancy} guests</span>
                </div>
              )}
              {room.size_sqft && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <Maximize2 size={14} className="text-primary flex-shrink-0" />
                  <span className="text-xs text-gray-600">{room.size_sqft} sq ft</span>
                </div>
              )}
              {room.bed_type && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <BedDouble size={14} className="text-primary flex-shrink-0" />
                  <span className="text-xs text-gray-600 capitalize">{room.bed_type} Bed</span>
                </div>
              )}
            </div>
          </div>

          {/* Price + CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              <p className="text-2xl font-bold text-primary font-heading">₹{price}</p>
              <p className="text-xs text-gray-400">per night + taxes</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/rooms/${room.id}`}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all shadow-sm hover:shadow-md"
              >
                View &amp; Book <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RoomsGrid({ rooms }: { rooms: any[] }) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Showing <strong className="text-gray-800">{rooms.length} room type{rooms.length !== 1 ? 's' : ''}</strong>
      </p>
      {rooms.map((room: any) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}
