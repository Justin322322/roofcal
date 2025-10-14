import type { AccountStatus, AccountFilters } from "../types";

export const ACCOUNT_STATUSES: readonly AccountStatus[] = [
  "Active",
  "Disabled",
  "Inactive",
  "Pending",
] as const;

export const DEFAULT_FILTERS: AccountFilters = {
  status: "all",
  search: "",
};

export const SORT_FIELDS = [
  { key: "clientName", label: "Client Name" },
  { key: "company", label: "Company" },
  { key: "status", label: "Status" },
  { key: "totalProjects", label: "Projects" },
  { key: "totalSpend", label: "Total Spend" },
  { key: "lastActivity", label: "Last Activity" },
] as const;

export const STATUS_BADGE_VARIANTS: Record<
  AccountStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  Active: "default",
  Disabled: "destructive",
  Inactive: "secondary",
  Pending: "outline",
} as const;

export const CURRENCY_SYMBOL = "₱";

export const EXPORT_FORMATS = ["csv", "json"] as const;

export const IMPORT_FILE_TYPES = [".csv", ".json"] as const;

export const MAX_IMPORT_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ACCOUNT_TABLE_COLUMNS = [
  { key: "clientName", label: "Client Name", sortable: true },
  { key: "company", label: "Company", sortable: true },
  { key: "contact", label: "Contact", sortable: false },
  { key: "status", label: "Status", sortable: true },
  { key: "totalProjects", label: "Projects", sortable: true },
  { key: "totalSpend", label: "Total Spend", sortable: true },
  { key: "lastActivity", label: "Last Activity", sortable: true },
  { key: "actions", label: "Actions", sortable: false },
] as const;
