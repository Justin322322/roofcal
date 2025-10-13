import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export interface HandoffTokenPayload {
  type: "handoff";
  projectId: string;
  contractorId: string;
  iat?: number;
  exp?: number;
}

export function generateHandoffToken(projectId: string, contractorId: string, expiresIn: string = "7d"): string {
  const payload: HandoffTokenPayload = {
    type: "handoff",
    projectId,
    contractorId,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (jwt as any).sign(payload, JWT_SECRET!, { expiresIn });
}

export function verifyHandoffToken(token: string): HandoffTokenPayload | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded = (jwt as any).verify(token, JWT_SECRET!) as HandoffTokenPayload;
    if (decoded.type !== "handoff") return null;
    return decoded;
  } catch {
    return null;
  }
}

