"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { useSession } from "next-auth/react";
import type {
  Project,
  ProjectListResponse,
  ProjectStatus,
} from "@/types/project";
import { exportProject } from "@/app/dashboard/roof-calculator/actions";

import { ProjectFilters } from "./project-filters";
import { ProjectManagementTable } from "./project-management-table";
import { ProjectDetailsModal } from "./project-details-modal";
import { RequestQuoteDialog } from "./request-quote-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Simple cache to persist data across component re-mounts
const projectCache = {
  data: [] as Project[],
  totalPages: 1,
  lastFetch: 0,
  cacheKey: "",
};

const CACHE_DURATION = 30000; // 30 seconds cache

// Function to clear cache (can be called from other components)
export const clearProjectCache = () => {
  projectCache.data = [];
  projectCache.totalPages = 1;
  projectCache.lastFetch = 0;
  projectCache.cacheKey = "";
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ProjectManagementContentProps {
  // Add props here if needed in the future
}

export function ProjectManagementContent({}: ProjectManagementContentProps) {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>(projectCache.data);
  const [loading, setLoading] = useState(!projectCache.data.length);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "ALL">(
    "ALL"
  );
  const [sortBy, setSortBy] = useState<
    "created_at" | "updated_at" | "projectName" | "totalCost" | "area"
  >("updated_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(projectCache.totalPages);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{
    id: string;
    name: string;
    isUnarchive?: boolean;
  } | null>(null);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [projectForQuote, setProjectForQuote] = useState<Project | null>(null);
  const limit = 10;

  // Generate cache key for current filters
  const generateCacheKey = () => {
    return `${page}-${sortBy}-${sortOrder}-${search}-${statusFilter}`;
  };

  // Fetch projects with caching
  const fetchProjects = async (showLoading = true, forceRefresh = false) => {
    const currentCacheKey = generateCacheKey();
    const now = Date.now();

    // Check if we can use cached data
    if (
      !forceRefresh &&
      projectCache.data.length > 0 &&
      projectCache.cacheKey === currentCacheKey &&
      now - projectCache.lastFetch < CACHE_DURATION
    ) {
      setProjects(projectCache.data);
      setTotalPages(projectCache.totalPages);
      return;
    }

    if (showLoading) setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...(search && { search }),
        ...(statusFilter !== "ALL" && { status: statusFilter }),
      });

      const response = await fetch(`/api/projects?${params}`);

      if (response.ok) {
        const data: ProjectListResponse = await response.json();

        // Update cache
        projectCache.data = data.projects;
        projectCache.totalPages = data.totalPages;
        projectCache.lastFetch = now;
        projectCache.cacheKey = currentCacheKey;

        setProjects(data.projects);
        setTotalPages(data.totalPages);
      } else {
        const errorData = await response.json();
        toast.error("Failed to fetch projects", {
          description: errorData.error || "An error occurred",
        });
      }
    } catch {
      toast.error("Failed to fetch projects", {
        description: "Network error occurred",
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Initial load and filter changes - only show loading for initial load
  useEffect(() => {
    const isInitialLoad = !projectCache.data.length;
    fetchProjects(isInitialLoad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, sortBy, sortOrder]);

  // Debounced search with subtle loading indicator
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchLoading(true);
      if (search !== "") {
        setPage(1);
        fetchProjects(false).finally(() => setSearchLoading(false));
      } else {
        fetchProjects(false).finally(() => setSearchLoading(false));
      }
    }, 300); // Reduced debounce time for better UX

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleExport = async (projectId: string) => {
    setActionLoading(projectId);
    try {
      const result = await exportProject(projectId);
      if (result.success && result.data) {
        // Create and download JSON file
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `${result.data.projectName.replace(/[^a-z0-9]/gi, "_")}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("Project exported successfully");
      } else {
        toast.error("Failed to export project", {
          description: result.error,
        });
      }
    } catch {
      toast.error("Failed to export project");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteClick = async (projectId: string, projectName: string) => {
    setProjectToDelete({ id: projectId, name: projectName });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;

    // Check if this is an unarchive operation
    if (projectToDelete.isUnarchive) {
      await handleUnarchiveConfirm();
      return;
    }

    setActionLoading(projectToDelete.id);
    
    // Optimistic UI update - immediately update the project status in the local state
    const optimisticUpdate = (newStatus: ProjectStatus) => {
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectToDelete.id 
            ? { ...project, status: newStatus }
            : project
        )
      );
    };

    // Optimistically update to ARCHIVED
    optimisticUpdate("ARCHIVED");

    try {
      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Update cache with the new status instead of clearing it
        projectCache.data = projectCache.data.map(project => 
          project.id === projectToDelete.id 
            ? { ...project, status: "ARCHIVED" }
            : project
        );
        toast.success("Project archived successfully", {
          description: `"${projectToDelete.name}" has been moved to archived status`,
        });
      } else {
        // Revert optimistic update on error
        optimisticUpdate("ACTIVE");
        const errorData = await response.json();
        toast.error("Failed to archive project", {
          description: errorData.error || "An error occurred",
        });
      }
    } catch {
      // Revert optimistic update on error
      optimisticUpdate("ACTIVE");
      toast.error("Failed to archive project", {
        description: "Network error occurred",
      });
    } finally {
      setActionLoading(null);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  const handleUnarchiveClick = async (projectId: string, projectName: string) => {
    setProjectToDelete({ id: projectId, name: projectName, isUnarchive: true });
    setDeleteDialogOpen(true);
  };

  const handleUnarchiveConfirm = async () => {
    if (!projectToDelete) return;

    setActionLoading(projectToDelete.id);
    
    // Optimistic UI update - immediately update the project status in the local state
    const optimisticUpdate = (newStatus: ProjectStatus) => {
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectToDelete.id 
            ? { ...project, status: newStatus }
            : project
        )
      );
    };

    // Optimistically update to ACTIVE
    optimisticUpdate("ACTIVE");

    try {
      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: "PATCH",
      });

      if (response.ok) {
        // Update cache with the new status instead of clearing it
        projectCache.data = projectCache.data.map(project => 
          project.id === projectToDelete.id 
            ? { ...project, status: "ACTIVE" }
            : project
        );
        toast.success("Project unarchived successfully", {
          description: `"${projectToDelete.name}" has been restored to active status`,
        });
      } else {
        // Revert optimistic update on error
        optimisticUpdate("ARCHIVED");
        const errorData = await response.json();
        toast.error("Failed to unarchive project", {
          description: errorData.error || "An error occurred",
        });
      }
    } catch {
      // Revert optimistic update on error
      optimisticUpdate("ARCHIVED");
      toast.error("Failed to unarchive project", {
        description: "Network error occurred",
      });
    } finally {
      setActionLoading(null);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleRequestQuote = (project: Project) => {
    setProjectForQuote(project);
    setQuoteDialogOpen(true);
  };

  const handleQuoteRequested = () => {
    // Refresh projects to show updated status
    fetchProjects(false, true);
  };

  return (
    <>
      {/* Filters */}
      <ProjectFilters
        search={search}
        statusFilter={statusFilter}
        sortBy={sortBy}
        sortOrder={sortOrder}
        searchLoading={searchLoading}
        onSearchChange={setSearch}
        onStatusFilterChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        onSortByChange={(value) => {
          setSortBy(value);
          setPage(1);
        }}
        onSortOrderChange={setSortOrder}
      />

      {/* Projects Table */}
      <div className="mt-6">
        <ProjectManagementTable
          projects={projects}
          loading={loading}
          searchLoading={searchLoading}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onViewDetails={(project) => {
            setSelectedProject(project);
            setDetailsOpen(true);
          }}
          onExport={handleExport}
          onDelete={handleDeleteClick}
          onUnarchive={handleUnarchiveClick}
          onRequestQuote={handleRequestQuote}
          actionLoading={actionLoading}
          userRole={session?.user?.role}
        />
      </div>

      {/* Project Details Modal */}
      <ProjectDetailsModal
        project={selectedProject}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      {/* Request Quote Dialog */}
      <RequestQuoteDialog
        open={quoteDialogOpen}
        onOpenChange={setQuoteDialogOpen}
        project={projectForQuote}
        onQuoteRequested={handleQuoteRequested}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {projectToDelete?.isUnarchive ? "Unarchive Project" : "Archive Project"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {projectToDelete?.isUnarchive ? "unarchive" : "archive"} the project{" "}
              <span className="font-semibold">
                &ldquo;{projectToDelete?.name}&rdquo;
              </span>
              ?
              <br />
              <br />
              {projectToDelete?.isUnarchive 
                ? "This will restore the project to active status and it will appear in your active projects list."
                : "This will move the project to archived status. You can still view it by filtering for archived projects."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className={
                projectToDelete?.isUnarchive
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              }
              disabled={actionLoading === projectToDelete?.id}
            >
              {actionLoading === projectToDelete?.id ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  {projectToDelete?.isUnarchive ? "Unarchiving..." : "Archiving..."}
                </>
              ) : (
                projectToDelete?.isUnarchive ? "Unarchive Project" : "Archive Project"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
