"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { useQueryState } from "nuqs";
import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AccountManagementContent } from "./account-management";
import { RoofCalculatorContent } from "./roof-calculator";

import data from "./data.json";

type DashboardSection = "overview" | "account-management" | "roof-calculator";

export default function DashboardClient() {
  const [activeSection, setActiveSection] = useQueryState("tab");
  const { status } = useSession();

  if (status === "loading") {
    return (
      <SidebarProvider>
        <AppSidebar
          variant="inset"
          activeSection="overview"
          onSectionChange={(section) =>
            setActiveSection(section as DashboardSection)
          }
        />
        <SidebarInset>
          <SiteHeader currentSection="overview" />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6 mb-4">
                  <p className="text-muted-foreground">
                    Loading your dashboard...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
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
      case null:
      default:
        return (
          <>
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

  const handleSectionChange = (section: string) => {
    const dashboardSection = section as DashboardSection;
    if (dashboardSection === "overview") {
      setActiveSection(null);
    } else {
      setActiveSection(dashboardSection);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar
        variant="inset"
        activeSection={activeSection || "overview"}
        onSectionChange={handleSectionChange}
      />
      <SidebarInset>
        <SiteHeader currentSection={activeSection || "overview"} />
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
