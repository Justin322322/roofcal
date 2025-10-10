/**
 * Utility functions for user-related operations
 */

/**
 * Generate user initials from name
 * @param name - Full name (e.g., "John Doe")
 * @returns Initials (e.g., "JD")
 */
export function getUserInitials(name: string): string {
  if (!name || typeof name !== "string") {
    return "U";
  }

  const words = name.trim().split(/\s+/);

  if (words.length === 1) {
    // If only one word, return first two characters
    const trimmedWord = words[0].trim();
    if (trimmedWord.length > 0) {
      return trimmedWord.substring(0, 2).toUpperCase();
    }
    return "U";
  }

  // If multiple words, return first letter of first and last word
  // Handle case where first word might be empty string
  const firstWord = words[0].trim();
  const lastWord = words[words.length - 1].trim();

  if (firstWord.length === 0 && lastWord.length === 0) {
    return "U";
  }

  const firstInitial =
    firstWord.length > 0
      ? firstWord.charAt(0).toUpperCase()
      : lastWord.charAt(0).toUpperCase();
  const lastInitial =
    lastWord.length > 0
      ? lastWord.charAt(0).toUpperCase()
      : firstWord.charAt(0).toUpperCase();

  return `${firstInitial}${lastInitial}`;
}

/**
 * Generate user initials from first and last name
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Initials (e.g., "JD")
 */
export function getUserInitialsFromNames(
  firstName: string,
  lastName: string
): string {
  const first = firstName?.trim().charAt(0).toUpperCase() || "";
  const last = lastName?.trim().charAt(0).toUpperCase() || "";

  if (!first && !last) {
    return "U";
  }

  return `${first}${last}`;
}
