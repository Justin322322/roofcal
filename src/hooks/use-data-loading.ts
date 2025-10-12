import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";

/**
 * Custom hook for data loading that prevents unnecessary re-mounting
 * Only triggers when user ID or role actually changes, not on every session update
 */
export function useDataLoading<T>(
  fetchFunction: () => Promise<T>,
  dependencies: unknown[] = []
) {
  const { data: session } = useSession();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);
  const dependenciesRef = useRef(dependencies);

  // Update dependencies ref when they change
  useEffect(() => {
    dependenciesRef.current = dependencies;
  });

  // Create a stable reference to the fetch function
  const stableFetchFunction = useCallback(() => {
    return fetchFunction();
  }, [fetchFunction]);

  useEffect(() => {
    const userId = session?.user?.id;
    const userRole = session?.user?.role;

    // Only fetch if we have a valid session and haven't initialized yet
    // or if the user ID/role has actually changed
    if (userId && userRole && !hasInitialized.current) {
      hasInitialized.current = true;
      
      const loadData = async () => {
        try {
          setLoading(true);
          setError(null);
          const result = await stableFetchFunction();
          setData(result);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setLoading(false);
        }
      };

      loadData();
    } else if (session === null) {
      // If session is explicitly null (logged out), stop loading
      setLoading(false);
      hasInitialized.current = false;
    }
  }, [session?.user?.id, session?.user?.role, stableFetchFunction, session]);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await stableFetchFunction();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [stableFetchFunction]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}
