"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderIcon,
  CheckCircleIcon,
  ClockIcon,
  DollarSignIcon,
} from "lucide-react";

interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalValue: number;
  averageValue: number;
}

// Simple cache to prevent refetching when switching tabs
let statsCache: { data: ProjectStats; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to invalidate cache (called after mutations)
export const invalidateProjectStatsCache = () => {
  statsCache = null;
};

interface ProjectStatsClientProps {
  loading?: boolean;
}

export function ProjectStatsClient({
  loading = false,
}: ProjectStatsClientProps) {
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (forceRefresh = false) => {
    // Check cache first (unless force refresh)
    if (
      !forceRefresh &&
      statsCache &&
      Date.now() - statsCache.timestamp < CACHE_DURATION
    ) {
      setStats(statsCache.data);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/projects/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      const data = await response.json();

      // Update cache
      statsCache = { data, timestamp: Date.now() };
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Show skeleton if explicitly loading or still fetching
  if (loading || isLoading) {
    return <ProjectStatsSkeleton />;
  }

  if (error || !stats) {
    return <ProjectStatsError />;
  }

  const statsData = [
    {
      title: "Total Projects",
      value: stats.totalProjects.toString(),
      description: "All projects created",
      icon: FolderIcon,
    },
    {
      title: "Active Projects",
      value: stats.activeProjects.toString(),
      description: "Projects in progress",
      icon: ClockIcon,
    },
    {
      title: "Completed",
      value: stats.completedProjects.toString(),
      description: "Finished projects",
      icon: CheckCircleIcon,
    },
    {
      title: "Total Value",
      value: `₱${stats.totalValue.toLocaleString()}`,
      description: `Average: ₱${stats.averageValue.toLocaleString()}`,
      icon: DollarSignIcon,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {statsData.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ProjectStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
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

function ProjectStatsError() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Failed to load stats
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
