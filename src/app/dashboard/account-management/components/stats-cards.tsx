"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UsersIcon, TrendingUpIcon, ClockIcon } from "lucide-react"

interface Account {
  id: number
  clientName: string
  email: string
  phone: string
  company: string
  status: "Active" | "Inactive" | "Pending"
  joinDate: string
  lastActivity: string
  totalProjects: number
  totalSpend: number
  plan: "Starter" | "Professional" | "Enterprise" | "Trial"
}

interface AccountStatsCardsProps {
  accounts: Account[]
}

export function AccountStatsCards({ accounts }: AccountStatsCardsProps) {
  const totalAccounts = accounts.length
  const activeAccounts = accounts.filter(account => account.status === "Active").length
  const totalRevenue = accounts.reduce((sum, account) => sum + account.totalSpend, 0)
  const averageRevenue = totalRevenue / totalAccounts || 0

  const stats = [
    {
      title: "Total Accounts",
      value: totalAccounts.toString(),
      icon: UsersIcon,
      description: `${activeAccounts} active`,
      trend: "+12% from last month"
    },
    {
      title: "Active Accounts",
      value: activeAccounts.toString(),
      icon: TrendingUpIcon,
      description: `${Math.round((activeAccounts / totalAccounts) * 100)}% of total`,
      trend: "+8% from last month"
    },
    {
      title: "Total Revenue",
      value: `₱${(totalRevenue / 1000).toFixed(0)}k`,
      icon: TrendingUpIcon,
      description: `₱${averageRevenue.toLocaleString()} avg per account`,
      trend: "+15% from last month"
    },
    {
      title: "Avg. Projects",
      value: (accounts.reduce((sum, account) => sum + account.totalProjects, 0) / totalAccounts).toFixed(1),
      icon: ClockIcon,
      description: "per active account",
      trend: "+3% from last month"
    }
  ]

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
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                {stat.trend}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
