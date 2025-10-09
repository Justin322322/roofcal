import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      emailVerified: Date | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerified: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    emailVerified: Date | null;
  }
}
