"use client";

import { useEffect } from "react";

export function AssignedProjectsContent() {
  // DEPRECATED: This page has been replaced by the unified Project Management page
  // Redirect to the new page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard/project-management';
    }
  }, []);

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Redirecting...</h1>
        <p className="text-muted-foreground">
          This page has been moved to Project Management. Redirecting now...
        </p>
      </div>
    </div>
  );
}