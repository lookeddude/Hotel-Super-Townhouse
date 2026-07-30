import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { createMetadata } from '@/lib/metadata';
import { BedDouble, Users, Maximize2, Star, Coffee, CheckCircle2 } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';
import { RoomBookingWidget } from '@/features/rooms/RoomBookingWidget';

interface RoomDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: RoomDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const supabase = await createServerClient();
    const { data: rt } = await (supabase as any)
      .from('room_types')
      .select('name, description')
      .or(`id.eq.${id},slug.eq.${id}`)
      .maybeSingle();
    if (rt) return createMetadata({
      title: `${rt.name} — Super Townhouse`,
      description: rt.description ?? `Book the ${rt.name} at Super Townhouse, Whitefield Bengaluru.`,
    });
  } catch { /* fallback */ }
  return createMetadata({ title: 'Room Detail — Super Townhouse' });
}

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  const { id } = await params;

  let roomType: any = null;
  let rooms: any[] = [];
  let amenities: any[] = [];
  let images: any[] = [];

  try {
    const supabase = await createServerClient();
    const db = supabase as any;

    // Fetch room type by id or slug
    const { data: rt } = await db
      .from('room_types')
      .select(`
        id, name, slug, description, short_description,
        base_price, weekend_price, max_occupancy, max_adults, max_children,
        size_sqft, bed_type, view_type, breakfast_included, breakfast_price,
        display_order
      `)
      .or(`id.eq.${id},slug.eq.${id}`)
      .maybeSingle();

    if (!rt) return notFound();
    roomType = rt;

    // Fetch available rooms of this type
    const { data: rms } = await db
      .from('rooms')
      .select('id, room_number, floor, wing, status, cleaning_status, is_featured, override_price')
      .eq('room_type_id', rt.id)
      .eq('is_available', true)
      .neq('status', 'out_of_service')
      .order('room_number');
    rooms = rms ?? [];

    // Fetch amenities for this room type
    const { data: ras } = await db
      .from('room_amenities')
      .select('amenities(id, name, icon, category)')
      .eq('room_type_id', rt.id);
    amenities = (ras ?? []).map((ra: any) => Array.isArray(ra.amenities) ? ra.amenities[0] : ra.amenities).filter(Boolean);

    // Fetch room images
    const { data: imgs } = await db
      .from('room_images')
      .select('id, storage_path, alt_text, is_primary, display_order')
      .eq('room_type_id', rt.id)
      .order('display_order');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    images = (imgs ?? []).map((img: any) => ({
      ...img,
      public_url: img.storage_path
        ? `${supabaseUrl}/storage/v1/object/public/hotel-images/${img.storage_path}`
        : null,
    }));
  } catch {
    return notFound();
  }

  if (!roomType) return notFound();

  const effectivePrice = rooms.find(r => r.override_price)?.override_price ?? roomType.base_price;
  const availableCount = rooms.filter(r => r.status === 'available').length;

  // Group amenities by category
  const amenityGroups: Record<string, any[]> = {};
  amenities.forEach((a) => {
    const cat = a.category ?? 'Other';
    if (!amenityGroups[cat]) amenityGroups[cat] = [];
    amenityGroups[cat].push(a);
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-700 h-72 md:h-96">
        {images[0]?.public_url ? (
          <img src={images[0].public_url} alt={images[0].alt_text || roomType.name} className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BedDouble size={80} className="text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container-custom">
            <Breadcrumb className="mb-2 [&_*]:text-white/70" />
            <h1 className="font-heading text-white text-3xl md:text-4xl font-bold">{roomType.name}</h1>
            {roomType.short_description && (
              <p className="text-white/80 text-sm mt-1 max-w-xl">{roomType.short_description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Image Strip */}
      {images.length > 1 && (
        <div className="container-custom py-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.slice(1, 5).map((img: any) => (
              img.public_url && (
                <img key={img.id} src={img.public_url} alt={img.alt_text || roomType.name}
                  className="h-20 w-32 object-cover rounded-lg flex-shrink-0 border border-outline-variant" />
              )
            ))}
          </div>
        </div>
      )}

      <div className="container-custom py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left — Details */}
          <div className="flex-1 space-y-6">
            {/* Quick Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: BedDouble, label: 'Bed Type', value: roomType.bed_type?.replace(/_/g, ' ') ?? '—' },
                { icon: Users, label: 'Guests', value: `Up to ${roomType.max_occupancy ?? roomType.max_adults}` },
                { icon: Maximize2, label: 'Room Size', value: roomType.size_sqft ? `${roomType.size_sqft} sq ft` : '—' },
                { icon: Star, label: 'View', value: roomType.view_type ? `${roomType.view_type} view` : 'Standard' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-lg border border-outline-variant p-3 text-center">
                  <s.icon size={20} className="mx-auto text-primary mb-1.5" />
                  <p className="text-xs text-on-surface-variant">{s.label}</p>
                  <p className="font-semibold text-sm text-on-surface capitalize mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {roomType.description && (
              <div className="bg-white rounded-lg border border-outline-variant p-5">
                <h2 className="font-heading font-semibold text-lg text-on-surface mb-3">About This Room</h2>
                <p className="text-sm text-on-surface-variant leading-relaxed">{roomType.description}</p>
              </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="bg-white rounded-lg border border-outline-variant p-5">
                <h2 className="font-heading font-semibold text-lg text-on-surface mb-4">Amenities</h2>
                {Object.entries(amenityGroups).map(([category, items]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">{category}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {items.map((a: any) => (
                        <div key={a.id} className="flex items-center gap-2 text-sm text-on-surface">
                          <CheckCircle2 size={14} className="text-primary flex-shrink-0" />
                          {a.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Breakfast */}
            {roomType.breakfast_included && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <Coffee size={20} className="text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-800 text-sm">Complimentary Breakfast Included</p>
                  <p className="text-xs text-green-700">Daily breakfast included for all guests</p>
                </div>
              </div>
            )}

            {/* Availability Badge */}
            <div className={`rounded-lg p-4 border flex items-center gap-3 ${availableCount > 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${availableCount > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
              <p className={`text-sm font-medium ${availableCount > 0 ? 'text-blue-800' : 'text-red-800'}`}>
                {availableCount > 0 ? `${availableCount} room${availableCount > 1 ? 's' : ''} currently available` : 'No rooms available at this time'}
              </p>
            </div>
          </div>

          {/* Right — Booking Widget */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-24">
              <RoomBookingWidget roomType={roomType} rooms={rooms} effectivePrice={effectivePrice} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
