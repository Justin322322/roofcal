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
import { SearchIcon, FilterIcon } from "lucide-react";

interface Filters {
  status: string;
  plan: string;
  search: string;
}

interface AccountFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function AccountFilters({
  filters,
  onFiltersChange,
}: AccountFiltersProps) {
  const handleFilterChange = (key: keyof Filters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <FilterIcon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Filters</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search accounts</Label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by name, email, or company..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Plan Filter */}
        <div className="space-y-2">
          <Label htmlFor="plan">Plan</Label>
          <Select
            value={filters.plan}
            onValueChange={(value) => handleFilterChange("plan", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All plans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
