"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { LogOut, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoutDialogProps {
  trigger?: React.ReactNode;
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export default function LogoutDialog({
  trigger,
  className,
  variant = "ghost",
  size = "default",
}: LogoutDialogProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      toast.loading("Signing out...", {
        id: "logout",
      });

      // First get CSRF token
      console.log("Attempting to get CSRF token...");
      let csrfToken: string | null = null;
      try {
        const csrfResponse = await fetch("/api/csrf-token", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (csrfResponse.ok) {
          const csrfData = await csrfResponse.json();
          const tokenFromResponse = csrfData?.csrfToken;
          if (
            typeof tokenFromResponse !== "string" ||
            tokenFromResponse.trim().length === 0
          ) {
            console.error(
              "/api/csrf-token returned an invalid or missing csrfToken:",
              tokenFromResponse
            );
            throw new Error("Missing CSRF token from /api/csrf-token");
          }
          csrfToken = tokenFromResponse;
          console.log("CSRF token obtained successfully");
        } else {
          console.error("Failed to get CSRF token:", csrfResponse.status);
          throw new Error("Failed to get CSRF token");
        }
      } catch (csrfError) {
        console.error("Network error while getting CSRF token:", csrfError);
        throw new Error("Failed to get CSRF token");
      }

      // Then call our custom logout API to record the activity with CSRF token
      console.log("Attempting to record logout activity...");
      try {
        if (typeof csrfToken !== "string" || csrfToken.trim().length === 0) {
          console.error(
            "Validated CSRF token is missing; aborting logout request.",
            csrfToken
          );
          throw new Error("CSRF token validation failed");
        }
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          credentials: "include",
        });

        console.log("Logout API response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(
            "Failed to record logout activity:",
            response.status,
            errorData
          );

          if (response.status === 403) {
            throw new Error("CSRF token validation failed");
          }
        } else {
          const responseData = await response.json().catch(() => ({}));
          console.log("Logout activity recorded successfully:", responseData);
        }
      } catch (apiError) {
        console.error(
          "Network error while recording logout activity:",
          apiError
        );
        // Rethrow CSRF errors so they can be handled by the outer catch
        if (
          apiError instanceof Error &&
          apiError.message.includes("CSRF token validation failed")
        ) {
          throw apiError;
        }
        // Continue with logout for other errors
      }

      // Add a brief delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Then use NextAuth's signOut
      await signOut({
        callbackUrl: "/login",
        redirect: false,
      });

      toast.success("Successfully signed out!", {
        id: "logout",
      });

      // Wait a moment for the toast to be visible, then navigate
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to sign out. Redirecting...", {
        id: "logout",
      });
      setIsOpen(false);
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button
            variant={variant}
            size={size}
            className={cn("dark:text-white", className)}
            disabled={isLoggingOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Confirm Sign Out
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to sign out of your RoofCal account? You will
            need to sign in again to access your dashboard and tools.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
