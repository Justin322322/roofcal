import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export interface ResetTokenPayload {
  email: string;
  type: "password_reset";
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token for password reset
 * @param email - User's email address
 * @returns JWT token string
 */
export function generateResetToken(email: string): string {
  const payload: ResetTokenPayload = {
    email,
    type: "password_reset",
  };

  // Token expires in 1 hour
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: "1h" });
}

/**
 * Verify and decode a reset token
 * @param token - JWT token string
 * @returns Decoded token payload or null if invalid
 */
export function verifyResetToken(token: string): ResetTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as ResetTokenPayload;

    // Validate token type
    if (decoded.type !== "password_reset") {
      return null;
    }

    return decoded;
  } catch {
    // Token is invalid, expired, or malformed
    return null;
  }
}

/**
 * Check if a token is valid (not expired and correct type)
 * @param token - JWT token string
 * @returns boolean indicating if token is valid
 */
export function isTokenValid(token: string): boolean {
  return verifyResetToken(token) !== null;
}
