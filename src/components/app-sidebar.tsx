"use client";

import * as React from "react";
import {
  CameraIcon,
  KanbanSquareIcon,
  FileCodeIcon,
  FileTextIcon,
  MessageSquareIcon,
  UsersIcon,
  CalculatorIcon,
  ClipboardCheckIcon,
  WrenchIcon,
  SettingsIcon,
  WarehouseIcon,
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
} from "@/components/ui/sidebar";
import RoofCalcLogo from "@/components/RoofCalcLogo";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Roof Estimator",
      url: "/dashboard/roof-calculator",
      icon: CalculatorIcon,
    },
    {
      title: "Project Management",
      url: "/dashboard/project-management",
      icon: KanbanSquareIcon,
    },
    {
      title: "Assigned Projects",
      url: "/dashboard/assigned-projects",
      icon: ClipboardCheckIcon,
    },
    {
      title: "Proposals",
      url: "/dashboard/proposals",
      icon: FileTextIcon,
    },
    {
      title: "Client Management",
      url: "/dashboard/client-management",
      icon: UsersIcon,
    },
    {
      title: "My Proposals",
      url: "/dashboard/client-proposals",
      icon: MessageSquareIcon,
    },
    {
      title: "Delivery Settings",
      url: "/dashboard/settings/delivery-settings",
      icon: SettingsIcon,
    },
    {
      title: "Delivery Test",
      url: "/dashboard/delivery-test",
      icon: WrenchIcon,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: CameraIcon,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: FileTextIcon,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: FileCodeIcon,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [],
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
        title: "My Proposals",
        url: "client-proposals",
        icon: MessageSquareIcon,
        roles: [UserRole.CLIENT],
      },
    ];

    // Admin (Contractor) navigation items
    const adminNavItems = [
      {
        title: "Assigned Projects",
        url: "assigned-projects",
        icon: ClipboardCheckIcon,
        roles: [UserRole.ADMIN],
      },
      {
        title: "Client Management",
        url: "client-management",
        icon: UsersIcon,
        roles: [UserRole.ADMIN],
      },
      {
        title: "Proposals",
        url: "proposals",
        icon: FileTextIcon,
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
              onClick={() => onSectionChange?.("overview")}
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
        {/* Only show Professional Tools for ADMIN users */}
        {session?.user?.role === UserRole.ADMIN && (
          <NavDocuments
            items={data.documents}
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
