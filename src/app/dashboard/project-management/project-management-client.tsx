"use client";

import { ProjectManagementContent } from "./components/project-management-content";
import { ProjectStatsClient } from "./components/project-stats-client";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

export function ProjectManagementClient() {
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
            <Link href="/dashboard?tab=roof-calculator">
              <Button variant="outline" className="gap-2">
                <PlusIcon className="h-4 w-4" />
                Create New Project
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 lg:px-6">
        <ProjectStatsClient />
      </div>

      {/* Main Content */}
      <div className="px-4 lg:px-6">
        <ProjectManagementContent />
      </div>
    </>
  );
}
