"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTransition } from "react";
import type {
  Account,
  AccountFilters,
  SortConfig,
  AccountFormData,
} from "../types";
import { DEFAULT_FILTERS } from "../constants";
import { filterAccounts, sortAccounts, calculateAccountStats } from "../utils";
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  exportAccounts,
  importAccounts,
  bulkUpdateAccountStatus,
  searchAccounts,
} from "../actions";

// Simple cache to prevent refetching when switching tabs
let accountsCache: { data: Account[]; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to invalidate cache (called after mutations)
export const invalidateAccountsCache = () => {
  accountsCache = null;
};

/**
 * Hook for managing accounts data
 */
export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchAccounts = useCallback(async (forceRefresh = false) => {
    // Check cache first (unless force refresh)
    if (
      !forceRefresh &&
      accountsCache &&
      Date.now() - accountsCache.timestamp < CACHE_DURATION
    ) {
      setAccounts(accountsCache.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getAccounts();

      // Update cache
      accountsCache = { data, timestamp: Date.now() };
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const refreshAccounts = useCallback(() => {
    startTransition(() => {
      fetchAccounts(true); // Force refresh
    });
  }, [fetchAccounts]);

  return {
    accounts,
    loading,
    error,
    isPending,
    refreshAccounts,
  };
}

/**
 * Hook for managing account filters
 */
export function useAccountFilters(
  initialFilters: AccountFilters = DEFAULT_FILTERS
) {
  const [filters, setFilters] = useState<AccountFilters>(initialFilters);
  const initialFiltersRef = useRef<AccountFilters>(initialFilters);

  useEffect(() => {
    initialFiltersRef.current = initialFilters;
  }, [initialFilters]);

  const updateFilters = useCallback((newFilters: Partial<AccountFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFiltersRef.current);
  }, []);

  const clearSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: "" }));
  }, []);

  return {
    filters,
    updateFilters,
    resetFilters,
    clearSearch,
  };
}

/**
 * Hook for managing account sorting
 */
export function useAccountSort() {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: null,
    direction: "asc",
  });

  const handleSort = useCallback((field: keyof Account) => {
    setSortConfig((prev) => {
      if (prev.field === field) {
        return {
          field,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return {
        field,
        direction: "asc",
      };
    });
  }, []);

  const clearSort = useCallback(() => {
    setSortConfig({ field: null, direction: "asc" });
  }, []);

  return {
    sortConfig,
    handleSort,
    clearSort,
  };
}

/**
 * Hook for calculating account statistics
 */
export function useAccountStats(accounts: Account[]) {
  const stats = useMemo(() => {
    return calculateAccountStats(accounts);
  }, [accounts]);

  return stats;
}

/**
 * Hook for managing filtered and sorted accounts
 */
export function useProcessedAccounts(
  accounts: Account[],
  filters: AccountFilters,
  sortConfig: SortConfig
) {
  const processedAccounts = useMemo(() => {
    const filtered = filterAccounts(accounts, filters);
    return sortAccounts(filtered, sortConfig);
  }, [accounts, filters, sortConfig]);

  return processedAccounts;
}

/**
 * Hook for account CRUD operations
 */
export function useAccountActions() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const createAccountAction = useCallback(async (data: AccountFormData) => {
    return new Promise<{
      success: boolean;
      account?: Account;
      errors?: string[];
    }>((resolve) => {
      startTransition(async () => {
        try {
          setError(null);
          const result = await createAccount(data);
          resolve(result);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to create account";
          setError(errorMessage);
          resolve({ success: false, errors: [errorMessage] });
        }
      });
    });
  }, []);

  const updateAccountAction = useCallback(
    async (id: string, data: Partial<AccountFormData>) => {
      return new Promise<{
        success: boolean;
        account?: Account;
        errors?: string[];
      }>((resolve) => {
        startTransition(async () => {
          try {
            setError(null);
            const result = await updateAccount(id, data);
            resolve(result);
          } catch (err) {
            const errorMessage =
              err instanceof Error ? err.message : "Failed to update account";
            setError(errorMessage);
            resolve({ success: false, errors: [errorMessage] });
          }
        });
      });
    },
    []
  );

  const deleteAccountAction = useCallback(async (id: string) => {
    return new Promise<{ success: boolean; errors?: string[] }>((resolve) => {
      startTransition(async () => {
        try {
          setError(null);
          const result = await deleteAccount(id);
          resolve(result);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to delete account";
          setError(errorMessage);
          resolve({ success: false, errors: [errorMessage] });
        }
      });
    });
  }, []);

  const bulkUpdateStatusAction = useCallback(
    async (accountIds: string[], status: Account["status"]) => {
      return new Promise<{
        success: boolean;
        updated: number;
        errors?: string[];
      }>((resolve) => {
        startTransition(async () => {
          try {
            setError(null);
            const result = await bulkUpdateAccountStatus(accountIds, status);
            resolve(result);
          } catch (err) {
            const errorMessage =
              err instanceof Error ? err.message : "Failed to update accounts";
            setError(errorMessage);
            resolve({ success: false, updated: 0, errors: [errorMessage] });
          }
        });
      });
    },
    []
  );

  return {
    isPending,
    error,
    createAccount: createAccountAction,
    updateAccount: updateAccountAction,
    deleteAccount: deleteAccountAction,
    bulkUpdateStatus: bulkUpdateStatusAction,
  };
}

/**
 * Hook for export/import operations
 */
export function useAccountImportExport() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const exportAccountsAction = useCallback(async (format: "csv" | "json") => {
    return new Promise<{
      success: boolean;
      data?: string;
      filename?: string;
      errors?: string[];
    }>((resolve) => {
      startTransition(async () => {
        try {
          setError(null);
          const result = await exportAccounts({ format });
          resolve(result);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to export accounts";
          setError(errorMessage);
          resolve({ success: false, errors: [errorMessage] });
        }
      });
    });
  }, []);

  const importAccountsAction = useCallback(
    async (fileContent: string, format: "csv" | "json") => {
      return new Promise<{
        success: boolean;
        imported: number;
        errors: string[];
      }>((resolve) => {
        startTransition(async () => {
          try {
            setError(null);
            const result = await importAccounts(fileContent, format);
            resolve(result);
          } catch (err) {
            const errorMessage =
              err instanceof Error ? err.message : "Failed to import accounts";
            setError(errorMessage);
            resolve({ success: false, imported: 0, errors: [errorMessage] });
          }
        });
      });
    },
    []
  );

  return {
    isPending,
    error,
    exportAccounts: exportAccountsAction,
    importAccounts: importAccountsAction,
  };
}

/**
 * Hook for account search
 */
export function useAccountSearch() {
  const [searchResults, setSearchResults] = useState<Account[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const requestIdRef = useRef<number>(0);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Increment request ID and capture it for this search
    const currentRequestId = ++requestIdRef.current;

    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await searchAccounts(query);

      // Only update state if this is still the latest request
      if (currentRequestId === requestIdRef.current) {
        setSearchResults(results);
      }
    } catch (err) {
      // Only update error state if this is still the latest request
      if (currentRequestId === requestIdRef.current) {
        setSearchError(err instanceof Error ? err.message : "Search failed");
      }
    } finally {
      // Only update loading state if this is still the latest request
      if (currentRequestId === requestIdRef.current) {
        setIsSearching(false);
      }
    }
  }, []);

  const clearSearch = useCallback(() => {
    // Reset request ID to invalidate any pending requests
    requestIdRef.current = 0;
    setSearchResults([]);
    setSearchError(null);
    setIsSearching(false);
  }, []);

  return {
    searchResults,
    isSearching,
    searchError,
    search,
    clearSearch,
  };
}

/**
 * Hook for managing modal state
 */
export function useAccountModal() {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const openViewModal = useCallback((account: Account) => {
    setSelectedAccount(account);
    setIsViewModalOpen(true);
  }, []);

  const openEditModal = useCallback((account: Account) => {
    setSelectedAccount(account);
    setIsEditModalOpen(true);
  }, []);

  const closeModals = useCallback(() => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedAccount(null);
  }, []);

  return {
    selectedAccount,
    isViewModalOpen,
    isEditModalOpen,
    openViewModal,
    openEditModal,
    closeModals,
  };
}

/**
 * Combined hook that provides all account management functionality
 */
export function useAccountManagement() {
  const accountsData = useAccounts();
  const filters = useAccountFilters();
  const sorting = useAccountSort();
  const stats = useAccountStats(accountsData.accounts);
  const processedAccounts = useProcessedAccounts(
    accountsData.accounts,
    filters.filters,
    sorting.sortConfig
  );
  const actions = useAccountActions();
  const importExport = useAccountImportExport();
  const search = useAccountSearch();
  const modal = useAccountModal();

  return {
    // Data
    accounts: accountsData.accounts,
    processedAccounts,
    loading: accountsData.loading,
    error: accountsData.error || actions.error || importExport.error,
    isPending:
      accountsData.isPending || actions.isPending || importExport.isPending,

    // Filters
    filters: filters.filters,
    updateFilters: filters.updateFilters,
    resetFilters: filters.resetFilters,
    clearSearch: filters.clearSearch,

    // Sorting
    sortConfig: sorting.sortConfig,
    handleSort: sorting.handleSort,
    clearSort: sorting.clearSort,

    // Statistics
    stats,

    // Actions
    createAccount: actions.createAccount,
    updateAccount: actions.updateAccount,
    deleteAccount: actions.deleteAccount,
    bulkUpdateStatus: actions.bulkUpdateStatus,

    // Import/Export
    exportAccounts: importExport.exportAccounts,
    importAccounts: importExport.importAccounts,

    // Search
    searchResults: search.searchResults,
    isSearching: search.isSearching,
    searchError: search.searchError,
    search: search.search,
    clearSearchResults: search.clearSearch,

    // Modal
    selectedAccount: modal.selectedAccount,
    isViewModalOpen: modal.isViewModalOpen,
    isEditModalOpen: modal.isEditModalOpen,
    openViewModal: modal.openViewModal,
    openEditModal: modal.openEditModal,
    closeModals: modal.closeModals,

    // Refresh
    refreshAccounts: accountsData.refreshAccounts,
  };
}
