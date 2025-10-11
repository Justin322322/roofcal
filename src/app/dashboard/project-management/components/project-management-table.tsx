"use client";

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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontalIcon,
  EyeIcon,
  DownloadIcon,
  Loader2Icon,
  TrashIcon,
  ArchiveIcon,
} from "lucide-react";
import type { Project, ProjectStatus } from "@/types/project";
import { materials } from "@/app/dashboard/roof-calculator/components/material-selection";

// Helper function to get formatted material display name
function getMaterialDisplayName(materialValue: string): string {
  const material = materials.find((m) => m.value === materialValue);
  if (material) {
    return `${material.name} - ₱${material.price.toLocaleString()}/sq.m`;
  }
  return materialValue; // Fallback to raw value if not found
}

interface ProjectManagementTableProps {
  projects: Project[];
  loading?: boolean;
  searchLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onViewDetails: (project: Project) => void;
  onExport: (projectId: string) => Promise<void>;
  onDelete: (projectId: string, projectName: string) => Promise<void>;
  onUnarchive?: (projectId: string, projectName: string) => Promise<void>;
  actionLoading?: string | null;
}

export function ProjectManagementTable({
  projects,
  loading = false,
  searchLoading = false,
  currentPage,
  totalPages,
  onPageChange,
  onViewDetails,
  onExport,
  onDelete,
  onUnarchive,
  actionLoading,
}: ProjectManagementTableProps) {
  const getStatusBadgeVariant = (status: ProjectStatus) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "COMPLETED":
        return "secondary";
      case "DRAFT":
        return "outline";
      case "ARCHIVED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Project Portfolio
          {searchLoading && (
            <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-5 bg-muted animate-pulse rounded w-16"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-muted animate-pulse rounded w-16"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-muted animate-pulse rounded w-28"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : projects.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No projects found. Create your first project to get started.
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      {project.projectName}
                    </TableCell>
                    <TableCell>{project.clientName || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(project.status)}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{project.area.toFixed(1)} m²</TableCell>
                    <TableCell>{formatCurrency(project.totalCost)}</TableCell>
                    <TableCell className="text-sm">
                      {getMaterialDisplayName(project.material)}
                    </TableCell>
                    <TableCell>{formatDate(project.updated_at)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => onViewDetails(project)}
                          >
                            <EyeIcon className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onExport(project.id)}
                            disabled={actionLoading === project.id}
                          >
                            {actionLoading === project.id ? (
                              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <DownloadIcon className="mr-2 h-4 w-4" />
                            )}
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {project.status === "ARCHIVED" ? (
                            <DropdownMenuItem
                              onClick={() =>
                                onUnarchive?.(project.id, project.projectName)
                              }
                              disabled={actionLoading === project.id || !onUnarchive}
                              className="text-green-600 focus:text-green-600"
                            >
                              {actionLoading === project.id ? (
                                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <ArchiveIcon className="mr-2 h-4 w-4" />
                              )}
                              Unarchive Project
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                onDelete(project.id, project.projectName)
                              }
                              disabled={actionLoading === project.id}
                              className="text-destructive focus:text-destructive"
                            >
                              {actionLoading === project.id ? (
                                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <TrashIcon className="mr-2 h-4 w-4" />
                              )}
                              Archive Project
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
