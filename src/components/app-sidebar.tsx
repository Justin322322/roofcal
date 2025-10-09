"use client";

import * as React from "react";
import {
  CameraIcon,
  ClipboardListIcon,
  CalculatorIcon,
  HardHatIcon,
  SparklesIcon,
  ArchiveIcon,
  KanbanSquareIcon,
  CreditCardIcon,
  FileCodeIcon,
  FileTextIcon,
  HelpCircleIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
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
      title: "Roof Calculator",
      url: "roof-calculator",
      icon: CalculatorIcon,
    },
    {
      title: "Manual Calculator",
      url: "#",
      icon: ClipboardListIcon,
    },
    {
      title: "Contractor Calculator",
      url: "#",
      icon: HardHatIcon,
    },
    {
      title: "AI Recommendations",
      url: "#",
      icon: SparklesIcon,
    },
    {
      title: "Archive",
      url: "#",
      icon: ArchiveIcon,
    },
    {
      title: "Project Management",
      url: "#",
      icon: KanbanSquareIcon,
    },
    {
      title: "Cost Customization",
      url: "#",
      icon: CreditCardIcon,
    },
    {
      title: "Account Management",
      url: "account-management",
      icon: UsersIcon,
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
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: SettingsIcon,
    },
    {
      title: "Get Help",
      url: "#",
      icon: HelpCircleIcon,
    },
    {
      title: "Search",
      url: "#",
      icon: SearchIcon,
    },
  ],
  documents: [
    {
      name: "Reports",
      url: "#",
      icon: ClipboardListIcon,
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
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-3 py-2">
              <RoofCalcLogo className="h-5 w-5 text-primary" size={20} />
              <span className="text-base font-semibold">RoofCal</span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={data.navMain}
          activeSection={activeSection}
          onSectionChange={onSectionChange}
        />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
