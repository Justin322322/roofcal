import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProjectManagementContent } from "./components/project-management-content";
import { ProjectStatsCards } from "./components/project-stats-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PlusIcon, FolderIcon } from "lucide-react";
import Link from "next/link";

export default function ProjectManagementPage() {
  return (
    <>
      {/* Header with description and actions */}
      <div className="px-4 lg:px-6 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-muted-foreground">
            Manage your roof calculation projects, track progress, and generate
            detailed reports for your clients.
          </p>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/roof-calculator">
              <Button variant="outline" className="gap-2">
                <PlusIcon className="h-4 w-4" />
                Create New Project
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="gap-2">
              <FolderIcon className="h-4 w-4" />
              Import Projects
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 lg:px-6">
        <Suspense fallback={<ProjectStatsSkeleton />}>
          <ProjectStatsCards />
        </Suspense>
      </div>

      {/* Main Content */}
      <div className="px-4 lg:px-6">
        <ProjectManagementContent />
      </div>
    </>
  );
}

function ProjectStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
