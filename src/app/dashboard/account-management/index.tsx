"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AccountManagementTable } from "./components/account-management-table";
import { AccountStatsCards } from "./components/stats-cards";
import { AccountFilters } from "./components/account-filters";
import { AccountViewModal } from "./components/account-view-modal";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";
import { useAccountManagement } from "./hooks";
import { toast } from "sonner";

export function AccountManagementContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const {
    accounts,
    processedAccounts,
    loading,
    filters,
    updateFilters,
    handleSort,
    deleteAccount,
    exportAccounts,
    refreshAccounts,
    selectedAccount,
    isViewModalOpen,
    openViewModal,
    closeModals,
  } = useAccountManagement();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleExportAccounts = async () => {
    let objectUrl: string | null = null;

    try {
      const result = await exportAccounts("csv");

      if (result.success && result.data && result.filename) {
        // Create and download file
        const blob = new Blob([result.data], { type: "text/csv" });
        objectUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Show success toast
        toast.success("Export completed", {
          description: `Accounts exported to ${result.filename}`,
          duration: 3000,
        });
      } else {
        // Handle export failure
        const errorMessage = result.errors?.[0] || "Failed to export accounts";
        toast.error("Export failed", {
          description: errorMessage,
          duration: 5000,
        });
      }
    } catch (error) {
      // Handle unexpected errors
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during export";
      console.error("Export failed:", error);
      toast.error("Export failed", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      // Always clean up the object URL if it was created
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    }
  };

  const handleDeleteAccount = async (accountId: string): Promise<void> => {
    try {
      const result = await deleteAccount(accountId);

      if (result.success) {
        // Show success message and refresh accounts
        toast.success("Account restricted successfully", {
          description: "The account has been restricted and access disabled.",
          duration: 3000,
        });
        refreshAccounts();
      } else {
        // Handle deletion failure without throwing
        const errorMessage = result.errors?.[0] || "Failed to restrict account";
        console.error("Restrict account failed:", errorMessage);
        toast.error("Failed to restrict account", {
          description: errorMessage,
          duration: 5000,
        });
      }
    } catch (error) {
      // Handle unexpected errors without throwing
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      console.error("Delete account error:", error);
      toast.error("Failed to restrict account", {
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  const handleDisableAccount = async (): Promise<void> => {
    try {
      // The disableAccount function is called directly from the modal
      // This handler is just for refreshing the accounts list
      refreshAccounts();
    } catch (error) {
      console.error("Error refreshing accounts after disable:", error);
    }
  };

  const handleEnableAccount = async (): Promise<void> => {
    try {
      // The enableAccount function is called directly from the modal
      // This handler is just for refreshing the accounts list
      refreshAccounts();
    } catch (error) {
      console.error("Error refreshing accounts after enable:", error);
    }
  };

  const handleViewAccount = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId);
    if (!account) {
      // Log the missing account ID for debugging
      console.warn(`Account not found with ID: ${accountId}`);

      // Show user-friendly error message
      toast.error("Account not found", {
        description:
          "The requested account could not be found. It may have been deleted or the ID is invalid.",
        duration: 5000,
      });

      // Return early to prevent further actions
      return;
    }

    // Proceed to open the view modal for the found account
    openViewModal(account);
  };

  const handleCallPhone = (phone: string) => {
    console.log("Call phone:", phone);
  };

  return (
    <>
      {/* Action Buttons */}
      <div className="px-4 lg:px-6 flex items-center justify-between mb-4">
        <p className="text-muted-foreground">
          Manage your account information and project details
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportAccounts}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 lg:px-6">
        <AccountStatsCards accounts={accounts} loading={loading} />
      </div>

      {/* Filters */}
      <div className="px-4 lg:px-6">
        <AccountFilters filters={filters} onFiltersChange={updateFilters} />
      </div>

      {/* Accounts Table */}
      <div className="px-4 lg:px-6">
        <AccountManagementTable
          accounts={processedAccounts}
          loading={loading}
          onSort={handleSort}
          onDelete={handleDeleteAccount}
          onView={handleViewAccount}
          onCallPhone={handleCallPhone}
          onEnable={handleEnableAccount}
        />
      </div>

      {/* Account View Modal */}
      <AccountViewModal
        account={selectedAccount}
        isOpen={isViewModalOpen}
        onClose={closeModals}
        onDelete={handleDeleteAccount}
        onDisable={handleDisableAccount}
        onEnable={handleEnableAccount}
      />
    </>
  );
}
