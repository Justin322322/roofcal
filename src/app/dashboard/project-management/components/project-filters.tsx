"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SearchIcon, FilterIcon, Loader2Icon } from "lucide-react";
import type { ProjectStatus } from "@/types/project";

interface ProjectFiltersProps {
  search: string;
  statusFilter: ProjectStatus | "ALL";
  sortBy: "created_at" | "updated_at" | "projectName" | "totalCost" | "area";
  sortOrder: "asc" | "desc";
  searchLoading?: boolean;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: ProjectStatus | "ALL") => void;
  onSortByChange: (
    value: "created_at" | "updated_at" | "projectName" | "totalCost" | "area"
  ) => void;
  onSortOrderChange: (value: "asc" | "desc") => void;
}

export function ProjectFilters({
  search,
  statusFilter,
  sortBy,
  sortOrder,
  searchLoading = false,
  onSearchChange,
  onStatusFilterChange,
  onSortByChange,
  onSortOrderChange,
}: ProjectFiltersProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <FilterIcon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Filters</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search projects</Label>
          <div className="relative">
            {searchLoading ? (
              <Loader2Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
            ) : (
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            )}
            <Input
              id="search"
              placeholder="Search by name, client..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              onStatusFilterChange(value as ProjectStatus | "ALL")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <Label htmlFor="sortBy">Sort by</Label>
          <Select
            value={sortBy}
            onValueChange={(value) => onSortByChange(value as typeof sortBy)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at">Last Updated</SelectItem>
              <SelectItem value="created_at">Created Date</SelectItem>
              <SelectItem value="projectName">Project Name</SelectItem>
              <SelectItem value="totalCost">Total Cost</SelectItem>
              <SelectItem value="area">Area</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order */}
        <div className="space-y-2">
          <Label htmlFor="sortOrder">Order</Label>
          <Select
            value={sortOrder}
            onValueChange={(value) =>
              onSortOrderChange(value as "asc" | "desc")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descending</SelectItem>
              <SelectItem value="asc">Ascending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
