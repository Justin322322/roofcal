export type AccountStatus = "Active" | "Restricted" | "Inactive" | "Pending";
export type AccountStatusFilter = AccountStatus | "all";

export interface Account {
  id: string;
  clientName: string;
  email: string;
  phone?: string;
  company?: string;
  status: AccountStatus;
  joinDate: string;
  lastActivity: string;
  totalProjects: number;
  totalSpend: number;
}

export interface AccountFilters {
  status: AccountStatusFilter;
  search: string;
}

export interface AccountStats {
  totalAccounts: number;
  activeAccounts: number;
  totalRevenue: number;
  averageRevenue: number;
  averageProjects: number;
}

export interface SortConfig {
  field: keyof Account | null;
  direction: "asc" | "desc";
}

export interface AccountActionHandlers {
  onEdit: (accountId: string) => void;
  onDelete: (accountId: string) => void;
  onView: (accountId: string) => void;
  onSendEmail: (email: string) => void;
  onCallPhone: (phone?: string) => void;
}

export interface AccountFormData {
  clientName: string;
  email: string;
  phone?: string;
  company?: string;
  status: AccountStatus;
}

export interface ExportOptions {
  format: "csv" | "json";
  filters?: AccountFilters;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
}
