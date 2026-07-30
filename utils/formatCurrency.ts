/**
 * Format a number as Indian Rupees
 */
export function formatCurrency(
  amount: number,
  options: { showSymbol?: boolean; compact?: boolean } = {}
): string {
  const { showSymbol = true, compact = false } = options;

  if (compact && amount >= 1000) {
    const k = amount / 1000;
    return `${showSymbol ? '₹' : ''}${k % 1 === 0 ? k : k.toFixed(1)}K`;
  }

  return new Intl.NumberFormat('en-IN', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(original: number, sale: number): number {
  return Math.round(((original - sale) / original) * 100);
}

/**
 * Format price per night display
 */
export function formatPricePerNight(price: number): string {
  return `${formatCurrency(price)} / night`;
}
