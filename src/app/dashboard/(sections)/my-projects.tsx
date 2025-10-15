"use client";

import { ProjectList } from "../roof-calculator/components/project-list";

export default function MyProjectsContent() {
  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Record Management</h1>
        <p className="text-muted-foreground">
          View and manage your roofing projects
        </p>
      </div>
      <ProjectList />
    </div>
  );
}

