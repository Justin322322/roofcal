import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";

/**
 * Custom hook to manage loading states based on session status
 * Prevents unnecessary re-mounting of skeleton components
 */
export function useSessionLoading() {
  const { status, data: session } = useSession();
  const [isInitialized, setIsInitialized] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only set initialized once to prevent re-renders
    if (status !== "loading" && !hasInitialized.current) {
      setIsInitialized(true);
      hasInitialized.current = true;
    }
  }, [status]);

  // Reset initialization when session becomes loading again (logout/login)
  useEffect(() => {
    if (status === "loading" && hasInitialized.current) {
      setIsInitialized(false);
      hasInitialized.current = false;
    }
  }, [status]);

  return {
    isLoading: status === "loading" || !isInitialized,
    session,
    isAuthenticated: !!session,
    isAdmin: session?.user?.role === "ADMIN",
    isClient: session?.user?.role === "CLIENT",
  };
}
