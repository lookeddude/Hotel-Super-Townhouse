/** Room types */
export interface Room {
  id: string;
  title: string;
  slug: string;
  type: RoomType;
  description: string;
  shortDescription: string;
  price: number;
  originalPrice?: number;
  currency: 'INR';
  images: string[];
  thumbnailImage: string;
  maxGuests: number;
  bedType: BedType;
  size: number; // in sq ft
  floor: number;
  amenities: string[];
  features: RoomFeature[];
  isAvailable: boolean;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
}

export type RoomType = 'standard' | 'deluxe' | 'super-deluxe' | 'suite' | 'executive';

export type BedType = 'single' | 'double' | 'queen' | 'king' | 'twin';

export interface RoomFeature {
  icon: string;
  label: string;
}

export interface RoomFilters {
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  roomType?: RoomType;
  priceMin?: number;
  priceMax?: number;
  amenities?: string[];
}
