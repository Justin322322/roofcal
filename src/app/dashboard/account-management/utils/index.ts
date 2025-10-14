import type {
  Account,
  AccountFilters,
  SortConfig,
  AccountStats,
} from "../types";
import { STATUS_BADGE_VARIANTS, CURRENCY_SYMBOL } from "../constants";
import Papa from "papaparse";

/**
 * Filter accounts based on provided filters
 */
export function filterAccounts(
  accounts: Account[],
  filters: AccountFilters
): Account[] {
  return accounts.filter((account) => {
    const matchesSearch =
      filters.search === "" ||
      account.clientName.toLowerCase().includes(filters.search.toLowerCase()) ||
      account.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      (account.company &&
        account.company.toLowerCase().includes(filters.search.toLowerCase()));

    const matchesStatus =
      filters.status === "all" ||
      account.status.toLowerCase() === filters.status.toLowerCase();

    return matchesSearch && matchesStatus;
  });
}

/**
 * Sort accounts based on sort configuration
 */
export function sortAccounts(
  accounts: Account[],
  sortConfig: SortConfig
): Account[] {
  if (!sortConfig.field) return accounts;

  return [...accounts].sort((a, b) => {
    const aValue = a[sortConfig.field!];
    const bValue = b[sortConfig.field!];

    // Handle null/undefined values - treat them as "less than" non-null values
    const aIsNull = aValue === null || aValue === undefined;
    const bIsNull = bValue === null || bValue === undefined;

    if (aIsNull && bIsNull) {
      return 0;
    }
    if (aIsNull) {
      return 1; // a is null/undefined, place it last
    }
    if (bIsNull) {
      return -1; // b is null/undefined, place it last
    }

    // Both values are non-null, proceed with type-specific comparisons
    const aType = typeof aValue;
    const bType = typeof bValue;

    // Handle string comparisons
    if (aType === "string" && bType === "string") {
      const aStr = aValue as string;
      const bStr = bValue as string;
      return sortConfig.direction === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    }

    // Handle number comparisons with proper coercion and NaN handling
    if (aType === "number" && bType === "number") {
      const aNum = aValue as number;
      const bNum = bValue as number;

      // Handle NaN values - treat them as minimal (place first)
      const aIsNaN = Number.isNaN(aNum);
      const bIsNaN = Number.isNaN(bNum);

      if (aIsNaN && bIsNaN) return 0;
      if (aIsNaN) return -1; // NaN comes first
      if (bIsNaN) return 1; // NaN comes first

      // Both are valid numbers
      return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
    }

    // Handle mixed types by coercing to string for comparison
    const aString = String(aValue);
    const bString = String(bValue);

    return sortConfig.direction === "asc"
      ? aString.localeCompare(bString)
      : bString.localeCompare(aString);
  });
}

/**
 * Calculate account statistics
 */
export function calculateAccountStats(accounts: Account[]): AccountStats {
  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter(
    (account) => account.status.toLowerCase().trim() === "active"
  ).length;
  const totalRevenue = accounts.reduce(
    (sum, account) => sum + account.totalSpend,
    0
  );
  const averageRevenue = totalAccounts > 0 ? totalRevenue / totalAccounts : 0;
  const totalProjects = accounts.reduce(
    (sum, account) => sum + account.totalProjects,
    0
  );
  const averageProjects = totalAccounts > 0 ? totalProjects / totalAccounts : 0;

  return {
    totalAccounts,
    activeAccounts,
    totalRevenue,
    averageRevenue,
    averageProjects,
  };
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  if (amount === 0) return "-";
  if (amount < 0)
    return `-${CURRENCY_SYMBOL}${Math.abs(amount).toLocaleString()}`;
  return `${CURRENCY_SYMBOL}${amount.toLocaleString()}`;
}

/**
 * Format currency for display in stats (with k suffix for thousands)
 */
export function formatCurrencyForStats(amount: number): string {
  if (amount === 0) return `${CURRENCY_SYMBOL}0`;
  if (amount >= 1000) {
    const thousands = amount / 1000;
    const isExactThousand = amount % 1000 === 0;
    const formatted = isExactThousand
      ? thousands.toFixed(0)
      : thousands.toFixed(1);
    return `${CURRENCY_SYMBOL}${formatted}k`;
  }
  return `${CURRENCY_SYMBOL}${amount.toLocaleString()}`;
}

/**
 * Get badge variant for account status
 */
export function getStatusBadgeVariant(status: Account["status"]) {
  return STATUS_BADGE_VARIANTS[status];
}

/**
 * Escape a field value for CSV export according to RFC 4180
 */
function escapeCSVField(field: unknown): string {
  // Convert to string, handling null/undefined as empty string
  const str = field == null ? "" : String(field);

  // Check if field contains comma, double-quote, or newline
  const needsQuoting =
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r");

  if (needsQuoting) {
    // Double any existing double-quotes and wrap in quotes
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Export accounts to CSV format
 */
export function exportToCSV(accounts: Account[]): string {
  const headers = [
    "Client Name",
    "Email",
    "Phone",
    "Company",
    "Status",
    "Join Date",
    "Last Activity",
    "Total Projects",
    "Total Spend",
  ];

  const rows = accounts.map((account) => [
    account.clientName,
    account.email,
    account.phone || "",
    account.company || "",
    account.status,
    account.joinDate,
    account.lastActivity,
    account.totalProjects.toString(),
    account.totalSpend.toString(),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((field) => escapeCSVField(field)).join(","))
    .join("\n");

  return csvContent;
}

/**
 * Export accounts to JSON format
 */
export function exportToJSON(accounts: Account[]): string {
  return JSON.stringify(accounts, null, 2);
}

/**
 * Parse CSV content to accounts array using papaparse for robust parsing
 */
export function parseCSV(csvContent: string): Account[] {
  const parseResult = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => {
      // Normalize headers to match our expected format
      return header.toLowerCase().replace(/\s+/g, "");
    },
  });

  if (parseResult.errors.length > 0) {
    console.warn("CSV parsing errors:", parseResult.errors);
  }

  const accounts: Account[] = [];

  for (const row of parseResult.data) {
    try {
      const account = parseAccountRow(row as Record<string, unknown>);
      if (account) {
        accounts.push(account);
      }
    } catch (error) {
      console.warn("Error parsing account row:", error, row);
    }
  }

  return accounts;
}

/**
 * Parse a single CSV row into an Account object with proper validation and type coercion
 */
function parseAccountRow(row: Record<string, unknown>): Account | null {
  // Helper function to safely parse integers with default
  const parseIntSafe = (value: unknown, defaultValue: number = 0): number => {
    const str = String(value || "");
    if (!str || str.trim() === "") return defaultValue;
    const parsed = parseInt(str.trim(), 10);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  // Helper function to safely parse floats with default
  const parseFloatSafe = (value: unknown, defaultValue: number = 0): number => {
    const str = String(value || "");
    if (!str || str.trim() === "") return defaultValue;
    const parsed = parseFloat(str.trim());
    return isNaN(parsed) ? defaultValue : parsed;
  };

  // Helper function to safely parse dates with default
  const parseDateSafe = (
    value: unknown,
    defaultValue: Date = new Date()
  ): string => {
    const str = String(value || "");
    if (!str || str.trim() === "") return defaultValue.toISOString();
    const parsed = new Date(str.trim());
    return isNaN(parsed.getTime())
      ? defaultValue.toISOString()
      : parsed.toISOString();
  };

  // Helper function to validate and coerce status
  const validateStatus = (value: unknown): Account["status"] => {
    const str = String(value || "");
    if (!str || str.trim() === "") return "Pending";

    // Normalize input: trim and convert to lowercase
    const normalizedInput = str.trim().toLowerCase();

    // Map lowercase values to canonical Account["status"] strings
    const statusMap: Record<string, Account["status"]> = {
      active: "Active",
      disabled: "Disabled",
      inactive: "Inactive",
      pending: "Pending",
    };

    // Return mapped canonical value if found, otherwise return "Pending"
    return statusMap[normalizedInput] || "Pending";
  };

  // Safe UUID generator that works across different environments
  const generateUUID = (): string => {
    // Check for modern crypto.randomUUID() support
    if (
      typeof globalThis !== "undefined" &&
      typeof globalThis.crypto !== "undefined" &&
      typeof globalThis.crypto.randomUUID === "function"
    ) {
      try {
        return globalThis.crypto.randomUUID();
      } catch {
        // Fall through to alternative implementations
      }
    }

    // Check for crypto.getRandomValues() support (Node.js 16+ and modern browsers)
    if (
      typeof globalThis !== "undefined" &&
      typeof globalThis.crypto !== "undefined" &&
      typeof globalThis.crypto.getRandomValues === "function"
    ) {
      try {
        // RFC 4122 version 4 UUID using crypto.getRandomValues()
        const array = new Uint8Array(16);
        globalThis.crypto.getRandomValues(array);

        // Set version (4) and variant bits
        array[6] = (array[6] & 0x0f) | 0x40;
        array[8] = (array[8] & 0x3f) | 0x80;

        const hex = Array.from(array)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        return [
          hex.slice(0, 8),
          hex.slice(8, 12),
          hex.slice(12, 16),
          hex.slice(16, 20),
          hex.slice(20, 32),
        ].join("-");
      } catch {
        // Fall through to Math.random fallback
      }
    }

    // Fallback to Math.random-based UUID (not cryptographically secure but functional)
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  // Helper function to generate unique ID
  const generateUniqueId = (providedId: unknown): string => {
    const str = String(providedId || "");
    if (str && str.trim() !== "") {
      return str.trim();
    }
    // Generate a UUID using safe implementation
    return generateUUID();
  };

  // Validate required fields
  const clientName = String(row.clientname || row["client name"] || "");
  const email = String(row.email || "");

  if (!clientName.trim() || !email.trim()) {
    return null; // Skip rows without required fields
  }

  return {
    id: generateUniqueId(row.id),
    clientName: clientName.trim(),
    email: email.trim(),
    phone: row.phone ? String(row.phone).trim() || undefined : undefined,
    company: row.company ? String(row.company).trim() || undefined : undefined,
    status: validateStatus(row.status),
    joinDate: parseDateSafe(row.joindate || row["join date"]),
    lastActivity: parseDateSafe(row.lastactivity || row["last activity"]),
    totalProjects: parseIntSafe(row.totalprojects || row["total projects"]),
    totalSpend: parseFloatSafe(row.totalspend || row["total spend"]),
  };
}

/**
 * Parse JSON content to accounts array
 */
export function parseJSON(jsonContent: string): Account[] {
  try {
    const data = JSON.parse(jsonContent);
    if (!Array.isArray(data)) return [];

    // Filter out invalid accounts using a narrow structural check
    return data.filter((item): item is Account => {
      if (typeof item !== "object" || item === null) return false;
      const obj = item as Record<string, unknown>;
      return (
        typeof obj.clientName === "string" &&
        typeof obj.email === "string" &&
        typeof obj.status === "string"
      );
    });
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return [];
  }
}

/**
 * Validate account data
 */
export function validateAccount(account: Partial<Account>): string[] {
  const errors: string[] = [];

  if (!account.clientName?.trim()) {
    errors.push("Client name is required");
  }

  if (!account.email?.trim()) {
    errors.push("Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email)) {
    errors.push("Invalid email format");
  }

  if (!account.company?.trim()) {
    errors.push("Company is required");
  }

  if (account.totalProjects && account.totalProjects < 0) {
    errors.push("Total projects cannot be negative");
  }

  if (account.totalSpend && account.totalSpend < 0) {
    errors.push("Total spend cannot be negative");
  }

  return errors;
}
