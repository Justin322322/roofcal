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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  MailIcon,
  PhoneIcon,
  EyeIcon,
} from "lucide-react";

interface Account {
  id: string;
  clientName: string;
  email: string;
  phone: string;
  company: string;
  status: "Active" | "Inactive" | "Pending";
  joinDate: string;
  lastActivity: string;
  totalProjects: number;
  totalSpend: number;
  plan: "Starter" | "Professional" | "Enterprise" | "Trial";
}

interface Filters {
  status: string;
  plan: string;
  search: string;
}

interface AccountManagementTableProps {
  accounts: Account[];
  filters: Filters;
}

export function AccountManagementTable({
  accounts,
  filters,
}: AccountManagementTableProps) {
  const [sortField, setSortField] = useState<keyof Account | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filter accounts based on current filters
  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      filters.search === "" ||
      account.clientName.toLowerCase().includes(filters.search.toLowerCase()) ||
      account.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      account.company.toLowerCase().includes(filters.search.toLowerCase());

    const matchesStatus =
      filters.status === "all" ||
      account.status.toLowerCase() === filters.status.toLowerCase();

    const matchesPlan =
      filters.plan === "all" ||
      account.plan.toLowerCase() === filters.plan.toLowerCase();

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Sort accounts
  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    if (!sortField) return 0;

    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const handleSort = (field: keyof Account) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getStatusBadgeVariant = (status: Account["status"]) => {
    switch (status) {
      case "Active":
        return "default";
      case "Inactive":
        return "secondary";
      case "Pending":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getPlanBadgeVariant = (plan: Account["plan"]) => {
    switch (plan) {
      case "Enterprise":
        return "default";
      case "Professional":
        return "secondary";
      case "Starter":
        return "outline";
      case "Trial":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const handleEditAccount = (accountId: string) => {
    console.log("Edit account:", accountId);
    // TODO: Implement edit functionality
  };

  const handleDeleteAccount = (accountId: string) => {
    console.log("Delete account:", accountId);
    // TODO: Implement delete functionality
  };

  const handleViewAccount = (accountId: string) => {
    console.log("View account:", accountId);
    // TODO: Implement view functionality
  };

  const handleSendEmail = (email: string) => {
    console.log("Send email to:", email);
    // TODO: Implement email functionality
  };

  const handleCallPhone = (phone: string) => {
    console.log("Call phone:", phone);
    // TODO: Implement phone functionality
  };

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
                  onClick={() => handleSort("clientName")}
                >
                  Client Name
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("company")}
                >
                  Company
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("status")}
                >
                  Status
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("plan")}
                >
                  Plan
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("totalProjects")}
                >
                  Projects
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("totalSpend")}
                >
                  Total Spend
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("lastActivity")}
                >
                  Last Activity
                </TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">
                    {account.clientName}
                  </TableCell>
                  <TableCell>{account.company}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <MailIcon className="h-3 w-3" />
                        <span>{account.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <PhoneIcon className="h-3 w-3" />
                        <span>{account.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(account.status)}>
                      {account.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPlanBadgeVariant(account.plan)}>
                      {account.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>{account.totalProjects}</TableCell>
                  <TableCell>
                    {account.totalSpend > 0
                      ? `₱${account.totalSpend.toLocaleString()}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(account.lastActivity).toLocaleDateString()}
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
                          onClick={() => handleViewAccount(account.id)}
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEditAccount(account.id)}
                        >
                          <EditIcon className="h-4 w-4 mr-2" />
                          Edit Account
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleSendEmail(account.email)}
                        >
                          <MailIcon className="h-4 w-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCallPhone(account.phone)}
                        >
                          <PhoneIcon className="h-4 w-4 mr-2" />
                          Call Client
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteAccount(account.id)}
                          className="text-destructive"
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {sortedAccounts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No accounts found matching your filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
