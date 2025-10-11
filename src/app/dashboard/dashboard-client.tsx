"use client";

import { useSession } from "next-auth/react";
import { useQueryState } from "nuqs";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AccountManagementContent from "./(sections)/account-management";
import SystemMaintenanceContent from "./(sections)/system-maintenance";
import { RoofCalculatorContent } from "./roof-calculator";

type DashboardSection =
  | "roof-calculator"
  | "account-management"
  | "system-maintenance";

export default function DashboardClient() {
  const [activeSection, setActiveSection] = useQueryState("tab");
  const { status } = useSession();

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
                {/* Loading state handled by individual components */}
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
      case null: // Default to roof calculator when no tab is specified
        return <RoofCalculatorContent />;
      case "account-management":
        return <AccountManagementContent />;
      case "system-maintenance":
        return <SystemMaintenanceContent />;
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
