"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, Info } from "lucide-react";
import { toast } from "sonner";
import { UserRole } from "@/types/user-role";
import { RoofCalculatorContent } from "../roof-calculator";

export default function AdminRoofEstimationContent() {
  const { data: session } = useSession();
  const router = useRouter();

  // Check if user is admin
  if (session?.user?.role !== UserRole.ADMIN) {
    router.push("/dashboard");
    return null;
  }

  const handleProjectCreated = () => {
    toast.success("Project estimation saved successfully", {
      description: "Your project estimation has been saved as a DRAFT project. You can manage it from the Assigned Projects section.",
    });
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 px-3 sm:px-4 lg:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
              <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Project Estimation</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Create project estimations for your own projects and calculations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Information Banner */}
      <div className="px-3 sm:px-4 lg:px-6">
        <Alert>
          <Info className="h-4 w-4 flex-shrink-0" />
          <AlertDescription className="text-xs sm:text-sm">
            This tool allows you to create project estimations for your own use. Projects will be saved as DRAFT status 
            with no client assignment.
          </AlertDescription>
        </Alert>
      </div>

      {/* Main Content */}
      <div className="px-3 sm:px-4 lg:px-6">
        <RoofCalculatorContent 
          isAdminSelfMode={true}
          onProjectCreated={handleProjectCreated}
        />
      </div>
    </div>
  );
}
