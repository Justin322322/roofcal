/**
 * Utility functions for number formatting with thousand separators
 */

/**
 * Formats a number with thousand separators (commas)
 * @param value - The numeric value to format
 * @returns Formatted string with thousand separators
 */
export function formatNumberWithCommas(value: number | string): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue) || numValue === 0) {
    return "";
  }

  return numValue.toLocaleString("en-US");
}

/**
 * Removes commas and other formatting from a formatted number string
 * @param formattedValue - The formatted string (e.g., "1,000.50")
 * @returns Clean numeric string (e.g., "1000.50")
 */
export function parseFormattedNumber(formattedValue: string): string {
  // Remove commas and any non-numeric characters except decimal point
  return formattedValue.replace(/[^\d.-]/g, "");
}

/**
 * Formats a number for input display with thousand separators
 * Handles edge cases like empty strings, zeros, and decimal numbers
 * @param value - The value to format
 * @returns Formatted string suitable for input display
 */
export function formatInputValue(value: string | number): string {
  if (!value || value === "") {
    return "";
  }

  const cleanValue =
    typeof value === "string" ? parseFormattedNumber(value) : value.toString();
  const numValue = parseFloat(cleanValue);

  if (isNaN(numValue)) {
    return "";
  }

  // Handle decimal numbers
  if (cleanValue.includes(".")) {
    const [integerPart, decimalPart] = cleanValue.split(".");
    const formattedInteger = parseFloat(integerPart).toLocaleString("en-US");
    return `${formattedInteger}.${decimalPart}`;
  }

  return numValue.toLocaleString("en-US");
}
