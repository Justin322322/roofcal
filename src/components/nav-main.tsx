"use client";

import { type LucideIcon } from "lucide-react";
import { TutorialGuideDialog } from "@/components/tutorial-guide-dialog";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
  activeSection,
  onSectionChange,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <TutorialGuideDialog />
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
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
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
