import { randomBytes, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * CSRF token configuration
 */
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_COOKIE_NAME = "__Host-csrf-token";
const CSRF_TOKEN_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_BODY_FIELD = "csrfToken";

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Create HMAC signature for CSRF token validation
 */
export function signCSRFToken(token: string): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.CSRF_SECRET;
  if (!secret) {
    throw new Error("CSRF secret not configured");
  }

  return createHmac("sha256", secret).update(token).digest("hex");
}

/**
 * Verify CSRF token signature
 */
export function verifyCSRFToken(token: string, signature: string): boolean {
  try {
    const expectedSignature = signCSRFToken(token);
    // Both signatures are hex-encoded strings
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const providedBuffer = Buffer.from(signature, "hex");

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, providedBuffer);
  } catch {
    return false;
  }
}
/**
 * Set CSRF token in secure cookie
 */
export async function setCSRFTokenCookie(
  token: string,
  signedToken: string
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CSRF_TOKEN_COOKIE_NAME, `${token}.${signedToken}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
}

/**
 * Get CSRF token from cookie
 */
export async function getCSRFTokenFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const csrfCookie = cookieStore.get(CSRF_TOKEN_COOKIE_NAME);

    if (!csrfCookie?.value) {
      return null;
    }

    const [token, signature] = csrfCookie.value.split(".");
    if (!token || !signature) {
      return null;
    }

    // Verify the signature
    if (verifyCSRFToken(token, signature)) {
      return token;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Extract CSRF token from request (header, body, or cookie)
 */
export async function extractCSRFTokenFromRequest(
  request: Request
): Promise<string | null> {
  try {
    // Try header first
    const headerToken = request.headers.get(CSRF_TOKEN_HEADER_NAME);
    if (headerToken) {
      return headerToken;
    }

    // Try body if it's a POST request
    if (request.method === "POST") {
      // Clone request to safely attempt multiple body reads
      const clonedRequest = request.clone();
      try {
        const body = await clonedRequest.json();
        if (body[CSRF_TOKEN_BODY_FIELD]) {
          return body[CSRF_TOKEN_BODY_FIELD];
        }
      } catch {
        // If JSON parsing fails, try form data
        try {
          const formData = await request.formData();
          const formToken = formData.get(CSRF_TOKEN_BODY_FIELD);
          if (formToken && typeof formToken === "string") {
            return formToken;
          }
        } catch {
          // Ignore form data parsing errors
        }
      }
    }

    // No token found in request
    return null;
  } catch {
    return null;
  }
}
/**
 * Validate CSRF token against stored token
 */
export async function validateCSRFToken(request: Request): Promise<boolean> {
  try {
    const requestToken = await extractCSRFTokenFromRequest(request);
    const storedToken = await getCSRFTokenFromCookie();

    if (!requestToken || !storedToken) {
      return false;
    }

    return requestToken === storedToken;
  } catch {
    return false;
  }
}

/**
 * Generate and set a new CSRF token
 */
export async function generateAndSetCSRFToken(): Promise<string> {
  const token = generateCSRFToken();
  const signedToken = signCSRFToken(token);
  await setCSRFTokenCookie(token, signedToken);
  return token;
}

/**
 * Clear CSRF token cookie
 */
export async function clearCSRFTokenCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_TOKEN_COOKIE_NAME);
}
