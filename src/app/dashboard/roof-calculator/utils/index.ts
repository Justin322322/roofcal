/**
 * Utility functions for Roof Calculator
 */

import type { ComplexityScore } from "@/lib/decision-tree";

/**
 * Format number as Philippine Peso currency
 */
export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString()}`;
}

/**
 * Get color class for complexity score (1-10)
 */
export function getComplexityColor(score: number): string {
  if (score <= 3) {
    return "text-green-600 dark:text-green-500";
  } else if (score <= 6) {
    return "text-yellow-600 dark:text-yellow-500";
  } else {
    return "text-red-600 dark:text-red-500";
  }
}

/**
 * Get badge variant for complexity level
 */
export function getComplexityBadgeVariant(
  level: ComplexityScore["level"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (level) {
    case "low":
      return "secondary";
    case "medium":
      return "default";
    case "high":
      return "destructive";
    default:
      return "outline";
  }
}

/**
 * Get complexity level label
 */
export function getComplexityLabel(level: ComplexityScore["level"]): string {
  switch (level) {
    case "low":
      return "Low Complexity";
    case "medium":
      return "Medium Complexity";
    case "high":
      return "High Complexity";
    default:
      return "Unknown";
  }
}

/**
 * Get progress bar color class for complexity
 */
export function getComplexityProgressColor(score: number): string {
  if (score <= 3) {
    return "bg-green-500";
  } else if (score <= 6) {
    return "bg-yellow-500";
  } else {
    return "bg-red-500";
  }
}
