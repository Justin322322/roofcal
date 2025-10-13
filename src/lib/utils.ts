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