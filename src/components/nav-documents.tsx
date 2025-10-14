"use client";

import { type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavDocuments({
  items,
  activeSection,
  onSectionChange,
}: {
  items: {
    name: string;
    url: string;
    icon: LucideIcon;
  }[];
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Professional Tools</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              tooltip={item.name}
              onClick={() => {
                if (onSectionChange && item.url !== "#") {
                  onSectionChange(item.url);
                  // Close sidebar on mobile after clicking
                  if (isMobile) {
                    setOpenMobile(false);
                  }
                }
              }}
              isActive={activeSection === item.url}
            >
              <item.icon />
              <span>{item.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
