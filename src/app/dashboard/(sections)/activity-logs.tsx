"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HorizontalScrollTable } from "@/components/ui/horizontal-scroll-table";
import { Separator } from "@/components/ui/separator";
import {
  ActivityIcon,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  TrendingUp,
  Users,
  Clock,
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface ActivityLog {
  id: string;
  type: string;
  description: string;
  metadata: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ActivityStats {
  totalActivitiesToday: number;
  uniqueUsersToday: number;
  totalActivities: number;
  mostCommonActivityType: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Filters {
  userId: string;
  type: string;
  search: string;
  dateFrom: string;
  dateTo: string;
}

const ACTIVITY_TYPES = [
  { value: "LOGIN", label: "Login", color: "bg-blue-100 text-blue-800" },
  { value: "LOGOUT", label: "Logout", color: "bg-blue-100 text-blue-800" },
  { value: "PROFILE_UPDATE", label: "Profile Update", color: "bg-orange-100 text-orange-800" },
  { value: "PASSWORD_CHANGE", label: "Password Change", color: "bg-orange-100 text-orange-800" },
  { value: "ACCOUNT_CREATED", label: "Account Created", color: "bg-green-100 text-green-800" },
  { value: "PROJECT_CREATED", label: "Project Created", color: "bg-purple-100 text-purple-800" },
  { value: "PROJECT_UPDATED", label: "Project Updated", color: "bg-purple-100 text-purple-800" },
  { value: "EMAIL_VERIFIED", label: "Email Verified", color: "bg-teal-100 text-teal-800" },
  { value: "PAYMENT_RECEIVED", label: "Payment Received", color: "bg-emerald-100 text-emerald-800" },
];

export default function ActivityLogsContent() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [filters, setFilters] = useState<Filters>({
    userId: "",
    type: "",
    search: "",
    dateFrom: "",
    dateTo: "",
  });

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());

      if (filters.userId) params.append("userId", filters.userId);
      if (filters.type) params.append("type", filters.type);
      if (filters.search) params.append("search", filters.search);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);

      const response = await fetch(`/api/activity?${params}`);
      if (!response.ok) throw new Error("Failed to fetch activities");
      
      const data = await response.json();
      if (data.success) {
        setActivities(data.data.activities);
        setPagination(prev => ({
          ...prev,
          ...data.data.pagination,
        }));
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      setError("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/activity/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/activity/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      userId: "",
      type: "",
      search: "",
      dateFrom: "",
      dateTo: "",
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getActivityTypeBadge = (type: string) => {
    const activityType = ACTIVITY_TYPES.find(t => t.value === type);
    if (!activityType) {
      return <Badge variant="secondary">{type}</Badge>;
    }
    return (
      <Badge variant="outline" className={activityType.color}>
        {activityType.label}
      </Badge>
    );
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Timestamp", "User", "Email", "Activity Type", "Description"],
      ...activities.map(activity => [
        format(parseISO(activity.createdAt), "yyyy-MM-dd HH:mm:ss"),
        activity.user.name,
        activity.user.email,
        activity.type,
        activity.description,
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-${format(new Date(), "yyyy-MM-dd-HH-mm-ss")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ActivityIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
            <p className="text-sm text-muted-foreground">
              Monitor all user activities across the system
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="px-4 lg:px-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today&apos;s Activities</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalActivitiesToday}</div>
                <p className="text-xs text-muted-foreground">
                  Activities today
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.uniqueUsersToday}</div>
                <p className="text-xs text-muted-foreground">
                  Users active today
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalActivities.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  All time activities
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Most Common</CardTitle>
                <ActivityIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{getActivityTypeBadge(stats.mostCommonActivityType)}</div>
                <p className="text-xs text-muted-foreground">
                  Activity type
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter activity logs by user, type, date range, or search terms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {/* User Filter */}
              <div className="space-y-2">
                <Label htmlFor="user">User</Label>
                <Select value={filters.userId || "all"} onValueChange={(value) => handleFilterChange("userId", value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          <span>{user.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {user.role}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Activity Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="type">Activity Type</Label>
                <Select value={filters.type || "all"} onValueChange={(value) => handleFilterChange("type", value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {ACTIVITY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <Label htmlFor="dateFrom">From Date</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                />
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label htmlFor="dateTo">To Date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                />
              </div>

              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search descriptions..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={clearFilters} variant="outline" size="sm">
                Clear Filters
              </Button>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="px-4 lg:px-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Activity Logs Table */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Activity Logs</CardTitle>
                <CardDescription>
                  {pagination.total} total activities
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <HorizontalScrollTable className="w-full" showScrollControls={true} scrollStep={300}>
              <div className="min-w-full rounded-md border">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap min-w-[180px] bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Timestamp</span>
                        </div>
                      </TableHead>
                      <TableHead className="whitespace-nowrap min-w-[200px] bg-muted/50">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>User</span>
                        </div>
                      </TableHead>
                      <TableHead className="whitespace-nowrap min-w-[150px] bg-muted/50">
                        Activity Type
                      </TableHead>
                      <TableHead className="min-w-[300px] bg-muted/50">
                        Description
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      // Loading skeleton rows
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell className="whitespace-nowrap min-w-[180px]">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16 mt-1" />
                          </TableCell>
                          <TableCell className="whitespace-nowrap min-w-[200px]">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-36 mt-1" />
                          </TableCell>
                          <TableCell className="whitespace-nowrap min-w-[150px]">
                            <Skeleton className="h-6 w-24" />
                          </TableCell>
                          <TableCell className="min-w-[300px]">
                            <Skeleton className="h-4 w-64" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : activities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No activity logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      activities.map((activity) => (
                          <TableRow key={activity.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="whitespace-nowrap min-w-[180px]">
                              <div className="text-sm">
                                {format(parseISO(activity.createdAt), "MMM dd, yyyy")}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(parseISO(activity.createdAt), "HH:mm:ss")}
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap min-w-[200px]">
                              <div className="flex flex-col">
                                <span className="font-medium">{activity.user.name}</span>
                                <span className="text-xs text-muted-foreground">{activity.user.email}</span>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap min-w-[150px]">
                              {getActivityTypeBadge(activity.type)}
                            </TableCell>
                            <TableCell className="min-w-[300px]">
                              <div className="max-w-[400px]">
                                <div className="truncate text-sm" title={activity.description}>
                                  {activity.description}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </HorizontalScrollTable>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <>
                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} activities
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={!pagination.hasPrev}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={!pagination.hasNext}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
