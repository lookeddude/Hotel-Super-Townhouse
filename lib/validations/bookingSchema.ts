import { z } from 'zod';

/** Booking form schema — ready for React Hook Form */
export const bookingFormSchema = z
  .object({
    checkIn: z.date(),
    checkOut: z.date(),
    guests: z.number().min(1).max(6),
    roomId: z.string().min(1, 'Please select a room'),
    guestName: z.string().min(2, 'Name must be at least 2 characters'),
    guestEmail: z.string().email('Please enter a valid email'),
    guestPhone: z.string().min(10, 'Please enter a valid phone number'),
    specialRequests: z.string().optional(),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    message: 'Check-out must be after check-in',
    path: ['checkOut'],
  });

export type BookingFormValues = z.infer<typeof bookingFormSchema>;
