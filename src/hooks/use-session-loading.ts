import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

/**
 * Custom hook to manage loading states based on session status
 * Prevents unnecessary re-mounting of skeleton components
 */
export function useSessionLoading() {
  const { status, data: session } = useSession();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (status !== "loading") {
      setIsInitialized(true);
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
