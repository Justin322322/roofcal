"use client";

import { useQueryState } from "nuqs";
import { useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UserRole } from "@/types/user-role";
import { useSessionLoading } from "@/hooks/use-session-loading";
import AccountManagementContent from "./(sections)/account-management";
import SystemMaintenanceContent from "./(sections)/system-maintenance";
import { RoofCalculatorContent } from "./roof-calculator";
import { AssignedProjectsContent } from "./assigned-projects";
import { ProposalsPage } from "./proposals";
import WarehouseManagementSection from "./(sections)/warehouse-management";
import DeliverySettingsPage from "./settings/delivery-settings/page";
import DeliveryTestPage from "./delivery-test/page";

type DashboardSection =
  | "roof-calculator"
  | "assigned-projects"
  | "project-management"
  | "proposals"
  | "account-management"
  | "system-maintenance"
  | "warehouse-management"
  | "delivery-settings"
  | "delivery-test";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="px-4 lg:px-6 flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-9 w-20" />
      </div>

      {/* Stats Cards skeleton */}
      <div className="px-4 lg:px-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-20 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="px-4 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left column skeleton */}
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  {i === 0 && <Skeleton className="h-20 w-full" />}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Right column skeleton */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardClient() {
  const [activeSection, setActiveSection] = useQueryState("tab");
  const { isLoading, session } = useSessionLoading();

  // Check if user has permission to access the requested section
  const hasPermission = (section: string, userRole: string | undefined) => {
    switch (section) {
      case "roof-calculator":
      case "proposals":
        return true; // Both admin and client can access proposals
      case "assigned-projects":
      case "project-management":
      case "delivery-settings":
      case "delivery-test":
      case "account-management":
      case "system-maintenance":
      case "warehouse-management":
        return userRole === UserRole.ADMIN;
      default:
        return false;
    }
  };

  // Set default tab based on user role when no tab is specified
  useEffect(() => {
    if (!isLoading && session?.user?.role && !activeSection) {
      const defaultSection = session.user.role === UserRole.CLIENT ? "roof-calculator" : "project-management";
      setActiveSection(defaultSection);
    }
  }, [isLoading, session?.user?.role, activeSection, setActiveSection]);

  // Handle permission-based section redirection in useEffect to prevent infinite re-renders
  useEffect(() => {
    if (!isLoading && session?.user?.role && activeSection) {
      if (!hasPermission(activeSection, session.user.role)) {
        const defaultSection = session.user.role === UserRole.CLIENT ? "roof-calculator" : "project-management";
        // Only redirect if we're not already on the correct section
        if (activeSection !== defaultSection) {
          setActiveSection(defaultSection);
        }
      }
    }
  }, [isLoading, session?.user?.role, activeSection, setActiveSection]);

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar
          variant="inset"
          activeSection={activeSection || "roof-calculator"}
          onSectionChange={(section) =>
            setActiveSection(section as DashboardSection)
          }
        />
        <SidebarInset>
          <SiteHeader currentSection={activeSection || "roof-calculator"} />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <DashboardSkeleton />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const renderContent = () => {
    const userRole = session?.user?.role;

    switch (activeSection) {
      case "roof-calculator":
        return <RoofCalculatorContent />;
      case "assigned-projects":
      case "project-management":
        return <AssignedProjectsContent />;
      case "proposals":
        return <ProposalsPage />;
      case "account-management":
        return <AccountManagementContent />;
      case "system-maintenance":
        return <SystemMaintenanceContent />;
      case "warehouse-management":
        return <WarehouseManagementSection />;
      case "delivery-settings":
        return <DeliverySettingsPage />;
      case "delivery-test":
        return <DeliveryTestPage />;
      case null: // Default based on user role
      default:
        return userRole === UserRole.CLIENT ? <RoofCalculatorContent /> : <AssignedProjectsContent />;
    }
  };

  const handleSectionChange = (section: string) => {
    const dashboardSection = section as DashboardSection;
    setActiveSection(dashboardSection);
  };

  return (
    <SidebarProvider>
      <AppSidebar
        variant="inset"
        activeSection={activeSection || "roof-calculator"}
        onSectionChange={handleSectionChange}
      />
      <SidebarInset>
        <SiteHeader currentSection={activeSection || "roof-calculator"} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
