"use client";

import { type LucideIcon } from "lucide-react";
import { TutorialGuideDialog } from "@/components/tutorial-guide-dialog";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
                  if (
                    (item.url === "account-management" ||
                      item.url === "roof-calculator") &&
                    onSectionChange
                  ) {
                    onSectionChange(item.url);
                  } else if (
                    item.url !== "#" &&
                    item.url !== "account-management" &&
                    item.url !== "roof-calculator"
                  ) {
                    // Handle other navigation
                    console.log("Navigate to:", item.url);
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
