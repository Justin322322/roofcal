"use client";

import { useSession } from "next-auth/react";
import { useQueryState } from "nuqs";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UserRole } from "@/types/user-role";
import AccountManagementContent from "./(sections)/account-management";
import SystemMaintenanceContent from "./(sections)/system-maintenance";
import { RoofCalculatorContent } from "./roof-calculator";
import { ProjectManagementClient } from "./project-management/project-management-client";
import { AssignedProjectsContent } from "./assigned-projects";
import { ProposalsPage } from "./proposals";
import { ClientManagementPage } from "./client-management";
import { ClientProposalsPage } from "./client-proposals";
import DeliverySettingsPage from "./settings/delivery-settings/page";
import DeliveryTestPage from "./delivery-test/page";

type DashboardSection =
  | "roof-calculator"
  | "project-management"
  | "assigned-projects"
  | "proposals"
  | "client-management"
  | "client-proposals"
  | "account-management"
  | "system-maintenance"
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
  const { status, data: session } = useSession();

  if (status === "loading") {
    return (
      <SidebarProvider>
        <AppSidebar
          variant="inset"
          activeSection="roof-calculator"
          onSectionChange={(section) =>
            setActiveSection(section as DashboardSection)
          }
        />
        <SidebarInset>
          <SiteHeader currentSection="roof-calculator" />
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

    // Check if user has permission to access the requested section
    const hasPermission = (section: string) => {
      switch (section) {
        case "roof-calculator":
        case "project-management":
        case "assigned-projects":
          return true; // Available to all users
        case "proposals":
        case "client-management":
        case "delivery-settings":
        case "delivery-test":
        case "account-management":
        case "system-maintenance":
          return userRole === UserRole.ADMIN;
        case "client-proposals":
          return userRole === UserRole.CLIENT;
        default:
          return false;
      }
    };

    // If user doesn't have permission for the active section, redirect to roof calculator
    if (activeSection && !hasPermission(activeSection)) {
      setActiveSection("roof-calculator");
      return <RoofCalculatorContent />;
    }

    switch (activeSection) {
      case "roof-calculator":
      case null: // Default to roof calculator when no tab is specified
        return <RoofCalculatorContent />;
      case "project-management":
        return <ProjectManagementClient />;
      case "assigned-projects":
        return <AssignedProjectsContent />;
      case "proposals":
        return userRole === UserRole.ADMIN ? <ProposalsPage /> : <RoofCalculatorContent />;
      case "client-management":
        return userRole === UserRole.ADMIN ? <ClientManagementPage /> : <RoofCalculatorContent />;
      case "client-proposals":
        return userRole === UserRole.CLIENT ? <ClientProposalsPage /> : <RoofCalculatorContent />;
      case "account-management":
        return userRole === UserRole.ADMIN ? <AccountManagementContent /> : <RoofCalculatorContent />;
      case "system-maintenance":
        return userRole === UserRole.ADMIN ? <SystemMaintenanceContent /> : <RoofCalculatorContent />;
      case "delivery-settings":
        return userRole === UserRole.ADMIN ? <DeliverySettingsPage /> : <RoofCalculatorContent />;
      case "delivery-test":
        return userRole === UserRole.ADMIN ? <DeliveryTestPage /> : <RoofCalculatorContent />;
      default:
        return <RoofCalculatorContent />;
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
