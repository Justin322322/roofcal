"use client";

import * as React from "react";
import {
  FileTextIcon,
  UsersIcon,
  CalculatorIcon,
  WrenchIcon,
  WarehouseIcon,
  DatabaseIcon,
  SettingsIcon,
  ArchiveIcon,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { UserRole } from "@/types/user-role";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import RoofCalcLogo from "@/components/RoofCalcLogo";

const adminTools = {
  documents: [
    {
      name: "Account Management",
      url: "account-management",
      icon: UsersIcon,
    },
    {
      name: "Pricing Maintenance",
      url: "system-maintenance",
      icon: WrenchIcon,
    },
    {
      name: "Warehouse Management",
      url: "warehouse-management",
      icon: WarehouseIcon,
    },
  ],
};

const developerTools = {
  documents: [
    {
      name: "Database Management",
      url: "database-management",
      icon: DatabaseIcon,
    },
    {
      name: "System Control",
      url: "system-control",
      icon: SettingsIcon,
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

export function AppSidebar({
  activeSection,
  onSectionChange,
  ...props
}: AppSidebarProps) {
  const { data: session } = useSession();
  const { isMobile, setOpenMobile } = useSidebar();

  const getNavigationData = () => {
    const userRole = session?.user?.role;
    
    // Client (Homeowner) navigation items
    const clientNavItems = [
      {
        title: "Project Request",
        url: "roof-calculator",
        icon: CalculatorIcon,
        roles: [UserRole.CLIENT],
      },
      {
        title: "My Projects",
        url: "my-projects",
        icon: FileTextIcon,
        roles: [UserRole.CLIENT],
      },
      {
        title: "Archived Projects",
        url: "archived-projects",
        icon: ArchiveIcon,
        roles: [UserRole.CLIENT],
      },
    ];

    // Admin (Contractor) navigation items
    const adminNavItems = [
      {
        title: "Contractor Projects",
        url: "contractor-projects",
        icon: UsersIcon,
        roles: [UserRole.ADMIN],
      },
    ];

    // Combine navigation items
    const allNavItems = [...clientNavItems, ...adminNavItems];

    // Filter navigation items based on user role
    const filteredNavItems = allNavItems.filter(item => 
      item.roles.includes(userRole as UserRole)
    );

    return {
      navMain: filteredNavItems,
      navSecondary: [],
    };
  };

  const navigationData = getNavigationData();

  const userData = {
    name: session?.user?.name || "User",
    email: session?.user?.email || "",
    avatar: "/avatars/user.jpg",
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <button
              onClick={() => {
                onSectionChange?.("overview");
                // Close sidebar on mobile after clicking
                if (isMobile) {
                  setOpenMobile(false);
                }
              }}
              className="flex w-full items-center gap-2 px-3 py-2 hover:bg-accent rounded-md transition-colors cursor-pointer"
            >
              <RoofCalcLogo className="h-5 w-5 text-primary" size={20} />
              <span className="text-base font-semibold">RoofCal</span>
            </button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={navigationData.navMain}
          activeSection={activeSection}
          onSectionChange={onSectionChange}
        />
        {/* Show Professional Tools for ADMIN users */}
        {session?.user?.role === UserRole.ADMIN && (
          <NavDocuments
            items={adminTools.documents}
            activeSection={activeSection}
            onSectionChange={onSectionChange}
          />
        )}
        {/* Show Developer Tools for DEVELOPER users */}
        {session?.user?.role === UserRole.DEVELOPER && (
          <NavDocuments
            items={developerTools.documents}
            activeSection={activeSection}
            onSectionChange={onSectionChange}
          />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
