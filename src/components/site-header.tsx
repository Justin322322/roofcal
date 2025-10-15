import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

interface SiteHeaderProps {
  currentSection?: string;
}

export function SiteHeader({ currentSection }: SiteHeaderProps) {
  const getSectionTitle = (section?: string) => {
    switch (section) {
      case "activity-logs":
        return "";
      case "admin-roof-estimation":
        return "";
      case "roof-calculator":
        return "Project Estimation";
      case "my-projects":
        return "Record Management";
      case "contractor-projects":
        return "Assigned Projects";
      case "account-management":
        return "Account Management";
      case "pricing-maintenance":
        return "Pricing Maintenance";
      case "system-maintenance":
        return "System Maintenance";
      case "warehouse-management":
        return "Warehouse Management";
      case "database-management":
        return "Database Management";
      case "system-control":
        return "System Control";
      case "delivery-settings":
        return "Delivery Settings";
      case "delivery-test":
        return "Delivery Test";
      default:
        return "Project Estimation";
    }
  };

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 sticky top-0 z-50 flex h-12 shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">
          {getSectionTitle(currentSection)}
        </h1>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
