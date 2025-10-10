"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountManagementContent } from "./account-management";
import { RoofCalculatorContent } from "./roof-calculator";

import data from "./data.json";

type DashboardSection = "overview" | "account-management" | "roof-calculator";

export default function Page() {
  const [activeSection, setActiveSection] =
    useState<DashboardSection>("overview");
  const { status } = useSession();

  // Show loading state while session is loading
  if (status === "loading") {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen">
          <div className="w-64 border-r bg-background p-4">
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          </div>
          <div className="flex-1 p-6">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case "roof-calculator":
        return <RoofCalculatorContent />;
      case "account-management":
        return <AccountManagementContent />;
      case "overview":
      default:
        return (
          <>
            {/* Overview Description */}
            <div className="px-4 lg:px-6 mb-4">
              <p className="text-muted-foreground">
                Professional roof calculator for accurate measurements, material
                estimates, and cost calculations
              </p>
            </div>

            <SectionCards />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div>
            <DataTable data={data} />
          </>
        );
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar
        variant="inset"
        activeSection={activeSection}
        onSectionChange={(section) =>
          setActiveSection(section as DashboardSection)
        }
      />
      <SidebarInset>
        <SiteHeader currentSection={activeSection} />
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
