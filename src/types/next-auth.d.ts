import "next-auth";
import "next-auth/jwt";
import { UserRole } from "./user-role";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      emailVerified: Date | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    emailVerified: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    emailVerified: Date | null;
    isDisabled?: boolean;
  }
}
