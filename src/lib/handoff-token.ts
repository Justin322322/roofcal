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
  return jwt.sign(payload, JWT_SECRET!, { expiresIn });
}

export function verifyHandoffToken(token: string): HandoffTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as HandoffTokenPayload;
    if (decoded.type !== "handoff") return null;
    return decoded;
  } catch {
    return null;
  }
}

