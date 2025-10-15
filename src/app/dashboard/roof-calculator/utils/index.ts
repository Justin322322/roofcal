/**
 * Utility functions for Roof Calculator
 */

/**
 * Format number as Philippine Peso currency
 */
export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString()}`;
}
