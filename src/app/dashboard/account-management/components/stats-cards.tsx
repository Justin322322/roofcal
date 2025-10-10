"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UsersIcon, TrendingUpIcon, ClockIcon } from "lucide-react";
import type { Account } from "../types";
import { formatCurrencyForStats } from "../utils";

interface AccountStatsCardsProps {
  accounts: Account[];
  loading?: boolean;
}

export function AccountStatsCards({
  accounts,
  loading = false,
}: AccountStatsCardsProps) {
  const stats = useMemo(() => {
    const totalAccounts = accounts.length;
    const activeAccounts = accounts.filter(
      (account) => account.status === "Active"
    ).length;
    const totalRevenue = accounts.reduce(
      (sum, account) => sum + account.totalSpend,
      0
    );
    const averageRevenue = totalRevenue / totalAccounts || 0;
    const totalProjects = accounts.reduce(
      (sum, account) => sum + account.totalProjects,
      0
    );
    const averageProjectsPerActive =
      activeAccounts > 0 ? totalProjects / activeAccounts : 0;

    // Guard against division by zero for percentage calculation
    const percent =
      totalAccounts === 0
        ? 0
        : Math.round((activeAccounts / totalAccounts) * 100);

    return [
      {
        title: "Total Accounts",
        value: totalAccounts.toString(),
        icon: UsersIcon,
        description: `${activeAccounts} active`,
      },
      {
        title: "Active Accounts",
        value: activeAccounts.toString(),
        icon: TrendingUpIcon,
        description: `${percent}% of total`,
      },
      {
        title: "Total Revenue",
        value: formatCurrencyForStats(totalRevenue),
        icon: TrendingUpIcon,
        description: `${formatCurrencyForStats(averageRevenue)} avg per account`,
      },
      {
        title: "Avg. Projects",
        value: activeAccounts > 0 ? averageProjectsPerActive.toFixed(1) : "—",
        icon: ClockIcon,
        description: "per active account",
      },
    ];
  }, [accounts]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32 mb-2" />
              <Skeleton className="h-5 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
