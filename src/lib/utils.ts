import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a status string by removing underscores and capitalizing words
 * @param status - The status string to format (e.g., "PROPOSAL_SENT")
 * @returns Formatted status string (e.g., "Proposal Sent")
 */
export function formatStatus(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format a number with thousands separators (e.g., 1,000)
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format currency with proper formatting
 */
export function formatCurrency(amount: number, currency: string = ""): string {
  return `${currency}${formatNumber(Math.round(amount))}`;
}

/**
 * Format area with proper unit
 */
export function formatArea(area: number): string {
  const rounded = Math.round(area * 10) / 10;
  return `${formatNumber(rounded)} m²`;
}