"use server";

import { revalidatePath } from "next/cache";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type {
  Account,
  AccountFormData,
  ExportOptions,
  ImportResult,
} from "../types";
import {
  exportToCSV,
  exportToJSON,
  parseCSV,
  parseJSON,
  validateAccount,
} from "../utils";
import { createVerificationCode } from "@/lib/verification-code";
import { sendVerificationEmail } from "@/lib/email";

export interface ActivityLog {
  id: string;
  type: string;
  description: string;
  date: string;
}

/**
 * Safely parse a full name into firstName and lastName
 * Handles edge cases like single names, extra whitespace, etc.
 */
function parseFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const trimmed = fullName.trim();

  if (!trimmed) {
    return { firstName: "User", lastName: "" };
  }

  const parts = trimmed.split(/\s+/); // Split on any whitespace

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");

  return { firstName, lastName };
}

/**
 * Get all client accounts (exclude admin accounts)
 */
export async function getAccounts(): Promise<Account[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: "CLIENT", // Only fetch client accounts, exclude admin accounts
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Get project-related activity counts for all users (avoid N+1)
    const userIds = users.map((u) => u.id);
    const groupedActivityCounts =
      userIds.length > 0
        ? await prisma.activity.groupBy({
            by: ["userId"],
            where: {
              userId: { in: userIds },
              type: "PROJECT_CREATED",
            },
            _count: { _all: true },
          })
        : [];

    // Map userId -> count
    const projectCountByUserId = new Map<string, number>(
      groupedActivityCounts.map((g) => [g.userId as string, g._count._all])
    );

    // Transform User data to Account format
    return users.map((user) => {
      const totalProjects = projectCountByUserId.get(user.id) ?? 0;
      const totalSpend = totalProjects * 1500;

      return {
        id: user.id, // Use actual user ID from Prisma
        clientName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: undefined, // Will be added when user completes profile
        company: undefined, // Will be added when user completes profile
        status: "Active" as const,
        joinDate: user.created_at.toISOString(),
        lastActivity: user.updated_at.toISOString(),
        totalProjects,
        totalSpend,
      };
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return [];
  }
}

/**
 * Get user activities by user ID
 */
export async function getUserActivities(
  userId: string
): Promise<ActivityLog[]> {
  try {
    const activities = await prisma.activity.findMany({
      where: { userId },
      select: { id: true, type: true, description: true, created_at: true },
      orderBy: { created_at: "desc" },
      take: 10,
    });

    return activities.map(
      (activity: {
        id: string;
        type: string;
        description: string;
        created_at: Date;
      }) => ({
        id: activity.id,
        type: activity.type,
        description: activity.description,
        date: activity.created_at.toISOString(),
      })
    );
  } catch (error) {
    console.error("Error fetching user activities:", error);
    return [];
  }
}

/**
 * Get user by email (for finding user ID from account email)
 */
export async function getUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
    return user;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
}

/**
 * Get account by ID
 */
export async function getAccountById(id: string): Promise<Account | null> {
  try {
    // Direct database lookup by user ID
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      return null;
    }

    // Transform to Account format
    return {
      id: user.id,
      clientName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: undefined,
      company: undefined,
      status: "Active" as const,
      joinDate: user.created_at.toISOString(),
      lastActivity: user.updated_at.toISOString(),
      totalProjects: 0,
      totalSpend: 0,
    };
  } catch (error) {
    console.error("Error fetching account by ID:", error);
    return null;
  }
}

/**
 * Create a new account (user registration)
 */
export async function createAccount(
  data: AccountFormData
): Promise<{ success: boolean; account?: Account; errors?: string[] }> {
  try {
    // Validate the account data
    const errors = validateAccount(data);
    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return { success: false, errors: ["Email already exists"] };
    }

    // Parse the full name defensively
    const { firstName, lastName } = parseFullName(data.clientName);

    // Generate a secure random password that the user won't know
    // This forces them to use the password reset flow to set their password
    const randomPassword = crypto.randomBytes(32).toString("hex");
    const passwordHash = await bcrypt.hash(randomPassword, 12);

    // Create new user with a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const userData: Prisma.userCreateInput = {
        email: data.email,
        firstName,
        lastName,
        passwordHash,
        role: "CLIENT",
      };

      const user = await tx.user.create({
        data: userData,
      });

      // Create an activity log for the account creation
      const activityData: Prisma.activityCreateInput = {
        user: { connect: { id: user.id } },
        type: "ACCOUNT_CREATED",
        description: "Account created by administrator",
        metadata: JSON.stringify({
          email: user.email,
          firstName,
          lastName,
          createdAt: new Date().toISOString(),
        }),
      };

      await tx.activity.create({
        data: activityData,
      });

      return user;
    });

    // Create a password reset verification code for the new account
    try {
      const { code } = await createVerificationCode(
        newUser.email,
        "password_reset"
      );

      // Optionally send a welcome email with password setup instructions
      await sendVerificationEmail(newUser.email, code).catch((emailError) => {
        console.warn(
          `Failed to send welcome email to ${newUser.email}:`,
          emailError
        );
      });
    } catch (codeError) {
      console.warn(
        `Failed to create verification code for ${newUser.email}:`,
        codeError
      );
    }

    // Create account representation
    const newAccount: Account = {
      id: newUser.id, // Use actual user ID from Prisma
      clientName: data.clientName,
      email: data.email,
      phone: data.phone,
      company: data.company,
      status: data.status,
      joinDate: newUser.created_at.toISOString(),
      lastActivity: newUser.updated_at.toISOString(),
      totalProjects: 0,
      totalSpend: 0,
    };

    // Revalidate the dashboard page
    revalidatePath("/dashboard");

    return { success: true, account: newAccount };
  } catch (error) {
    console.error("Error creating account:", error);
    return { success: false, errors: ["Failed to create account"] };
  }
}

/**
 * Update an existing account
 */
export async function updateAccount(
  id: string,
  data: Partial<AccountFormData>
): Promise<{ success: boolean; account?: Account; errors?: string[] }> {
  try {
    // Get current user by ID
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!currentUser) {
      return { success: false, errors: ["Account not found"] };
    }

    const currentAccount: Account = {
      id: currentUser.id,
      clientName: `${currentUser.firstName} ${currentUser.lastName}`,
      email: currentUser.email,
      phone: undefined,
      company: undefined,
      status: "Active" as const,
      joinDate: currentUser.created_at.toISOString(),
      lastActivity: currentUser.updated_at.toISOString(),
      totalProjects: 0,
      totalSpend: 0,
    };

    // Validate the account data
    const errors = validateAccount(data);
    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Check if email already exists (excluding current account)
    if (data.email && data.email !== currentAccount.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        return { success: false, errors: ["Email already exists"] };
      }
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        email: data.email || currentAccount.email,
        firstName:
          data.clientName?.split(" ")[0] ||
          currentAccount.clientName.split(" ")[0],
        lastName:
          data.clientName?.split(" ").slice(1).join(" ") ||
          currentAccount.clientName.split(" ").slice(1).join(" ") ||
          "",
      },
    });

    // Create updated account representation
    const updatedAccount: Account = {
      id: updatedUser.id,
      clientName: data.clientName || currentAccount.clientName,
      email: data.email || currentAccount.email,
      phone: data.phone,
      company: data.company,
      status: data.status || currentAccount.status,
      joinDate: currentAccount.joinDate,
      lastActivity: updatedUser.updated_at.toISOString(),
      totalProjects: currentAccount.totalProjects,
      totalSpend: currentAccount.totalSpend,
    };

    // Revalidate the dashboard page
    revalidatePath("/dashboard");

    return { success: true, account: updatedAccount };
  } catch (error) {
    console.error("Error updating account:", error);
    return { success: false, errors: ["Failed to update account"] };
  }
}

/**
 * Delete an account
 */
export async function deleteAccount(
  id: string
): Promise<{ success: boolean; errors?: string[] }> {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      return { success: false, errors: ["Account not found"] };
    }

    // Delete user from database
    await prisma.user.delete({
      where: { id },
    });

    // Revalidate the dashboard page
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { success: false, errors: ["Failed to delete account"] };
  }
}

/**
 * Export accounts to file
 */
export async function exportAccounts(
  options: ExportOptions
): Promise<{
  success: boolean;
  data?: string;
  filename?: string;
  errors?: string[];
}> {
  try {
    const accounts = await getAccounts();

    let exportData: string;
    let filename: string;

    if (options.format === "csv") {
      exportData = exportToCSV(accounts);
      filename = `accounts-${new Date().toISOString().split("T")[0]}.csv`;
    } else {
      exportData = exportToJSON(accounts);
      filename = `accounts-${new Date().toISOString().split("T")[0]}.json`;
    }

    return { success: true, data: exportData, filename };
  } catch (error) {
    console.error("Error exporting accounts:", error);
    return { success: false, errors: ["Failed to export accounts"] };
  }
}

/**
 * Import accounts from file
 */
export async function importAccounts(
  fileContent: string,
  format: "csv" | "json"
): Promise<ImportResult> {
  try {
    let importedAccounts: Account[];

    if (format === "csv") {
      importedAccounts = parseCSV(fileContent);
    } else {
      importedAccounts = parseJSON(fileContent);
    }

    const errors: string[] = [];
    let importedCount = 0;

    // Validate and import each account
    for (let i = 0; i < importedAccounts.length; i++) {
      const account = importedAccounts[i];
      const validationErrors = validateAccount(account);

      if (validationErrors.length > 0) {
        errors.push(`Row ${i + 1}: ${validationErrors.join(", ")}`);
        continue;
      }

      // Check for duplicate email in database
      const existingUser = await prisma.user.findUnique({
        where: { email: account.email },
      });

      if (existingUser) {
        errors.push(`Row ${i + 1}: Email ${account.email} already exists`);
        continue;
      }

      // Create user in database
      try {
        // Parse the full name defensively
        const { firstName, lastName } = parseFullName(account.clientName);

        // Generate a secure random password that the user won't know
        // This forces them to use the password reset flow to set their password
        const randomPassword = crypto.randomBytes(32).toString("hex");
        const passwordHash = await bcrypt.hash(randomPassword, 12);

        // Create the user with a transaction to ensure consistency
        const user = await prisma.$transaction(async (tx) => {
          const userData: Prisma.userCreateInput = {
            email: account.email,
            firstName,
            lastName,
            passwordHash,
            role: "CLIENT",
          };

          const newUser = await tx.user.create({
            data: userData,
          });

          // Create an activity log for the account creation
          const activityData: Prisma.activityCreateInput = {
            user: { connect: { id: newUser.id } },
            type: "ACCOUNT_CREATED",
            description: "Account imported by administrator",
            metadata: JSON.stringify({
              email: newUser.email,
              firstName,
              lastName,
              importedAt: new Date().toISOString(),
            }),
          };

          await tx.activity.create({
            data: activityData,
          });

          return newUser;
        });

        // Create a password reset verification code for the imported account
        // This allows the user to set their password on first login
        try {
          const { code } = await createVerificationCode(
            user.email,
            "password_reset"
          );

          // Optionally send a welcome email with password setup instructions
          // Note: This is wrapped in try-catch so email failures don't block the import
          await sendVerificationEmail(user.email, code).catch((emailError) => {
            console.warn(
              `Failed to send welcome email to ${user.email}:`,
              emailError
            );
          });
        } catch (codeError) {
          console.warn(
            `Failed to create verification code for ${user.email}:`,
            codeError
          );
        }

        importedCount++;
      } catch (dbError) {
        errors.push(`Row ${i + 1}: Failed to create user - ${dbError}`);
      }
    }

    // Revalidate the dashboard page
    revalidatePath("/dashboard");

    return {
      success: true,
      imported: importedCount,
      errors,
    };
  } catch (error) {
    console.error("Error importing accounts:", error);
    return {
      success: false,
      imported: 0,
      errors: ["Failed to parse import file"],
    };
  }
}

/**
 * Bulk update account status (currently not applicable since status is derived from user state)
 */
export async function bulkUpdateAccountStatus(
  accountIds: string[],
  status: Account["status"]
): Promise<{ success: boolean; updated: number; errors?: string[] }> {
  try {
    // Since we're using User model and status is derived, this function is not applicable
    // In a real implementation, you might want to add a status field to the User model
    // or create a separate Account model with status information

    console.log(
      "Bulk status update requested for accounts:",
      accountIds,
      "to status:",
      status
    );

    // For now, return success but no actual updates
    return { success: true, updated: 0 };
  } catch (error) {
    console.error("Error bulk updating accounts:", error);
    return {
      success: false,
      updated: 0,
      errors: ["Failed to update accounts"],
    };
  }
}

/**
 * Search accounts
 */
export async function searchAccounts(query: string): Promise<Account[]> {
  try {
    if (!query.trim()) {
      return [];
    }

    const accounts = await getAccounts();
    const lowercaseQuery = query.toLowerCase();

    return accounts.filter(
      (account) =>
        account.clientName.toLowerCase().includes(lowercaseQuery) ||
        account.email.toLowerCase().includes(lowercaseQuery) ||
        (account.company &&
          account.company.toLowerCase().includes(lowercaseQuery))
    );
  } catch (error) {
    console.error("Error searching accounts:", error);
    return [];
  }
}
