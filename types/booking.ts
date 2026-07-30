/** Booking entity types */
export interface Booking {
  id: string;
  bookingNumber: string;
  roomId: string;
  roomTitle: string;
  roomThumbnail?: string;
  guestId: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  totalAmount: number;
  paidAmount: number;
  currency: 'INR';
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
  specialRequests?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked-in'
  | 'checked-out'
  | 'cancelled'
  | 'no-show';

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded' | 'failed';

export interface BookingFormData {
  checkIn: Date;
  checkOut: Date;
  guests: number;
  roomId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string;
}
