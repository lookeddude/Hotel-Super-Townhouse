import { format, differenceInDays, addDays, isAfter, isBefore, parseISO } from 'date-fns';

/**
 * Format a date to display string
 */
export function formatDate(date: Date | string, pattern = 'dd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern);
}

/**
 * Calculate number of nights between check-in and check-out
 */
export function calculateNights(checkIn: Date, checkOut: Date): number {
  return differenceInDays(checkOut, checkIn);
}

/**
 * Get minimum check-out date (at least 1 night after check-in)
 */
export function getMinCheckOut(checkIn: Date): Date {
  return addDays(checkIn, 1);
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: Date): boolean {
  return isBefore(date, new Date());
}

/**
 * Check if check-out is after check-in
 */
export function isValidDateRange(checkIn: Date, checkOut: Date): boolean {
  return isAfter(checkOut, checkIn);
}

/**
 * Format a date range as "15 Jan — 18 Jan 2025"
 */
export function formatDateRange(checkIn: Date, checkOut: Date): string {
  const sameYear = checkIn.getFullYear() === checkOut.getFullYear();
  const sameMonth = checkIn.getMonth() === checkOut.getMonth() && sameYear;

  if (sameMonth) {
    return `${format(checkIn, 'dd')} — ${format(checkOut, 'dd MMM yyyy')}`;
  }
  if (sameYear) {
    return `${format(checkIn, 'dd MMM')} — ${format(checkOut, 'dd MMM yyyy')}`;
  }
  return `${format(checkIn, 'dd MMM yyyy')} — ${format(checkOut, 'dd MMM yyyy')}`;
}
