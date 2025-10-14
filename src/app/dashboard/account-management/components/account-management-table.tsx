"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontalIcon,
  BanIcon,
  MailIcon,
  PhoneIcon,
  EyeIcon,
  UserCheckIcon,
} from "lucide-react";
import type { Account } from "../types";
import { getStatusBadgeVariant, formatCurrency } from "../utils";
import DeleteAccountDialog from "@/components/auth/delete-account-dialog";

interface AccountManagementTableProps {
  accounts: Account[];
  loading?: boolean;
  onSort: (field: keyof Account) => void;
  onDelete: (accountId: string) => Promise<void>;
  onView: (accountId: string) => void;
  onCallPhone: (phone: string) => void;
  onEnable?: (accountId: string) => Promise<void>;
}

export function AccountManagementTable({
  accounts,
  loading = false,
  onSort,
  onDelete,
  onView,
  onCallPhone,
  onEnable,
}: AccountManagementTableProps) {
  const [selectedDeleteAccountId, setSelectedDeleteAccountId] = useState<
    string | null
  >(null);

  const handleDeleteConfirm = async () => {
    if (!selectedDeleteAccountId) return;

    try {
      await onDelete(selectedDeleteAccountId);
      setSelectedDeleteAccountId(null);
    } catch (error) {
      console.error("Failed to delete account:", error);
      // Error handling is done by the parent component
      // We don't clear the state here so the dialog stays open to show the error
    }
  };

  const handleDeleteCancel = () => {
    setSelectedDeleteAccountId(null);
  };

  const selectedAccount = accounts.find(
    (account) => account.id === selectedDeleteAccountId
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSort("clientName")}
                >
                  Client Name
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSort("status")}
                >
                  Status
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSort("totalProjects")}
                >
                  Projects
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSort("totalSpend")}
                >
                  Total Spend
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSort("lastActivity")}
                >
                  Last Activity
                </TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? // Loading skeleton rows
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-28" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
                : accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        {account.clientName}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <MailIcon className="h-3 w-3" />
                            <span>{account.email}</span>
                          </div>
                          {account.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <PhoneIcon className="h-3 w-3" />
                              <span>{account.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(account.status)}>
                          {account.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{account.totalProjects}</TableCell>
                      <TableCell>
                        {formatCurrency(account.totalSpend)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {(() => {
                          const date = new Date(account.lastActivity);
                          return isNaN(date.getTime())
                            ? "-"
                            : date.toLocaleDateString();
                        })()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => onView(account.id)}
                            >
                              <EyeIcon className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {account.phone && (
                              <DropdownMenuItem
                                onSelect={() => onCallPhone(account.phone!)}
                              >
                                <PhoneIcon className="h-4 w-4 mr-2" />
                                Call Client
                              </DropdownMenuItem>
                            )}
                            {account.status === "Disabled" && onEnable && (
                              <DropdownMenuItem
                                onSelect={async () => {
                                  try {
                                    await onEnable(account.id);
                                  } catch (error) {
                                    console.error("Failed to enable account:", error);
                                  }
                                }}
                                className="text-green-600"
                              >
                                <UserCheckIcon className="h-4 w-4 mr-2" />
                                Enable Account
                              </DropdownMenuItem>
                            )}
                            {account.status === "Active" && (
                              <DropdownMenuItem
                                onSelect={() =>
                                  setSelectedDeleteAccountId(account.id)
                                }
                                className="text-destructive"
                              >
                                <BanIcon className="h-4 w-4 mr-2" />
                                Restrict Account
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>

        {!loading && accounts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No accounts found matching your filters.
          </div>
        )}
      </CardContent>

      {selectedAccount && (
        <DeleteAccountDialog
          trigger={<div />}
          accountName={selectedAccount.clientName}
          accountEmail={selectedAccount.email}
          onConfirm={handleDeleteConfirm}
          open={true}
          onOpenChange={(open) => !open && handleDeleteCancel()}
        />
      )}
    </Card>
  );
}
