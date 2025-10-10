import crypto from "crypto";

/**
 * Secure logging utility that prevents PII leakage
 * All user identifiers are hashed irreversibly using SHA-256
 */
class SecureLogger {
  /**
   * Creates a consistent, irreversible hash of user identifiers
   * Uses SHA-256 with a salt to ensure the hash cannot be reversed
   *
   * @param identifier - The user identifier to hash (email, ID, etc.)
   * @returns A truncated hash (first 8 characters) for logging purposes
   */
  private hashIdentifier(identifier: string | undefined | null): string {
    if (!identifier) return "null";

    // Use a consistent salt to ensure the same identifier always produces the same hash
    // This allows for correlation in logs while maintaining privacy
    const salt = "roofcalc_logger_salt_2024";
    const hash = crypto
      .createHash("sha256")
      .update(identifier + salt)
      .digest("hex");

    // Return only first 8 characters for brevity in logs
    return hash.substring(0, 8);
  }

  /**
   * Logs authentication-related events without exposing PII
   *
   * @param event - The event type (e.g., "login", "logout", "session_found")
   * @param context - Additional context without PII
   * @param userId - Optional user ID that will be hashed
   * @param userEmail - Optional user email that will be hashed
   */
  auth(
    event: string,
    context: string = "",
    userId?: string,
    userEmail?: string
  ): void {
    const hashedId = this.hashIdentifier(userId);
    const hashedEmail = this.hashIdentifier(userEmail);

    const logMessage = [
      `AUTH:${event}`,
      context && `[${context}]`,
      userId && `user_id:${hashedId}`,
      userEmail && `email_hash:${hashedEmail}`,
    ]
      .filter(Boolean)
      .join(" ");

    console.log(logMessage);
  }

  /**
   * Logs general application events
   *
   * @param level - Log level (info, warn, error)
   * @param message - The log message
   * @param context - Additional context
   */
  log(
    level: "info" | "warn" | "error",
    message: string,
    context?: string
  ): void {
    const timestamp = new Date().toISOString();
    const logMessage = [
      `[${timestamp}]`,
      level.toUpperCase(),
      context && `[${context}]`,
      message,
    ]
      .filter(Boolean)
      .join(" ");

    switch (level) {
      case "error":
        console.error(logMessage);
        break;
      case "warn":
        console.warn(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }

  /**
   * Logs API events with optional user context
   *
   * @param api - The API endpoint name
   * @param event - The event type
   * @param userId - Optional user ID that will be hashed
   */
  api(api: string, event: string, userId?: string): void {
    const hashedId = this.hashIdentifier(userId);
    const timestamp = new Date().toISOString();

    const logMessage = [
      `[${timestamp}]`,
      `API:${api}`,
      event,
      userId && `user:${hashedId}`,
    ]
      .filter(Boolean)
      .join(" ");

    console.log(logMessage);
  }
}

// Export singleton instance
export const logger = new SecureLogger();

// Export the class for testing purposes
export { SecureLogger };
