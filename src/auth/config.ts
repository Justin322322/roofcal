import { AuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/user-role";
import bcrypt from "bcrypt";
import crypto from "crypto";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

const isDevelopment = process.env.NODE_ENV !== "production";
const safeLog = (...args: unknown[]) => {
  if (isDevelopment) console.debug(...args);
};

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("EMAIL_NOT_FOUND");
        }

        // Allow login for unverified users - they'll be redirected to verify page

        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!valid) {
          throw new Error("INVALID_PASSWORD");
        }

        // Log login activity
        await prisma.activity.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            type: "LOGIN",
            description: "User logged in successfully",
            metadata: JSON.stringify({
              userId: user.id,
              timestamp: new Date().toISOString(),
            }),
          },
        });

        // Build a safe full name: handle null/undefined, trim, collapse spaces, and fallback to email
        const firstNameSafe = (user.firstName ?? "").toString().trim();
        const lastNameSafe = (user.lastName ?? "").toString().trim();
        const combinedName = `${firstNameSafe} ${lastNameSafe}`
          .trim()
          .replace(/\s+/g, " ");
        const fallbackIdentifier = (user.email ?? "").toString().trim();
        const safeFullName = (combinedName || fallbackIdentifier || "")
          .toString()
          .trim();

        const userData = {
          id: user.id,
          email: user.email,
          name: safeFullName,
          role: user.role as UserRole,
          emailVerified: user.email_verified ? new Date() : null,
        };

        safeLog("Auth - user authentication successful:", {
          userExists: true,
          role: userData.role,
          emailVerified: userData.emailVerified,
        });

        return userData;
      },
    }),
  ],
  callbacks: {
    async jwt({
      token,
      user,
      trigger,
    }: {
      token: JWT;
      user?: User;
      trigger?: string;
    }) {
      safeLog("JWT callback triggered:", {
        trigger: trigger || "initial",
        userExists: !!user,
        tokenPresent: !!token,
        tokenHasId: !!token?.id,
      });

      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.emailVerified = user.emailVerified;
        safeLog("JWT callback - user data processed:", {
          userExists: true,
          role: user.role,
          emailVerified: user.emailVerified,
        });
      }

      // Refresh token data when session is updated
      if (trigger === "update" && token.id) {
        safeLog("JWT callback - token update triggered:", {
          trigger: "update",
          userExists: true,
        });
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { email_verified: true, role: true },
        });
        if (dbUser) {
          token.emailVerified = dbUser.email_verified ? new Date() : null;
          token.role = dbUser.role as UserRole;
          safeLog("JWT callback - token updated:", {
            emailVerified: dbUser.email_verified,
            role: dbUser.role,
          });
        }
      }

      safeLog("JWT callback completed:", {
        tokenHasId: !!token?.id,
        emailVerified: token?.emailVerified,
        role: token?.role,
      });
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        (
          session.user as User & {
            id: string;
            role: UserRole;
            emailVerified: Date | null;
          }
        ).id = token.id as string;
        (
          session.user as User & {
            id: string;
            role: UserRole;
            emailVerified: Date | null;
          }
        ).role = token.role as UserRole;
        (
          session.user as User & {
            id: string;
            role: UserRole;
            emailVerified: Date | null;
          }
        ).emailVerified = token.emailVerified as Date | null;
      }
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
  },
};
