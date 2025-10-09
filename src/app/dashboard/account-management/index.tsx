"use client";

import { useState } from "react";
import { AccountManagementTable } from "./components/account-management-table";
import { AccountStatsCards } from "./components/stats-cards";
import { AccountFilters } from "./components/account-filters";
import { Button } from "@/components/ui/button";
import { PlusIcon, DownloadIcon, UploadIcon } from "lucide-react";

export function AccountManagementContent() {
  const [accounts] = useState([]);
  const [filters, setFilters] = useState({
    status: "all",
    plan: "all",
    search: "",
  });

  const handleAddAccount = () => {
    // TODO: Implement add account functionality
    console.log("Add new account");
  };

  const handleExportAccounts = () => {
    // TODO: Implement export functionality
    console.log("Export accounts");
  };

  const handleImportAccounts = () => {
    // TODO: Implement import functionality
    console.log("Import accounts");
  };

  return (
    <>
      {/* Action Buttons */}
      <div className="px-4 lg:px-6 flex items-center justify-between mb-4">
        <p className="text-muted-foreground">
          Manage client accounts, subscriptions, and billing information
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleImportAccounts}>
            <UploadIcon className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExportAccounts}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleAddAccount}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 lg:px-6">
        <AccountStatsCards accounts={accounts} />
      </div>

      {/* Filters */}
      <div className="px-4 lg:px-6">
        <AccountFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Accounts Table */}
      <div className="px-4 lg:px-6">
        <AccountManagementTable accounts={accounts} filters={filters} />
      </div>
    </>
  );
}
