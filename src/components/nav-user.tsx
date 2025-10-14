"use client";

import { useState, useEffect } from "react";
import { LogOutIcon, MoreVerticalIcon } from "lucide-react";
import { useSession } from "next-auth/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import LogoutDialog from "@/components/auth/logout-dialog";
import { getUserInitials } from "@/lib/user-utils";
import { NotificationCenter } from "@/components/notification-center";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const { data: session } = useSession();
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const userInitials = getUserInitials(user.name);

  // Check for unread notifications
  useEffect(() => {
    const checkUnreadNotifications = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch("/api/notifications?unreadOnly=true&limit=1");
        if (response.ok) {
          const data = await response.json();
          setHasUnreadNotifications(data.unreadCount > 0);
          
          // Auto-open dropdown if there are unread notifications and it's not already open
          if (data.unreadCount > 0 && !dropdownOpen) {
            setDropdownOpen(true);
          }
        }
      } catch (error) {
        console.error("Failed to check unread notifications:", error);
      }
    };

    checkUnreadNotifications();
    
    // Check periodically for new notifications
    const interval = setInterval(checkUnreadNotifications, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [session?.user?.id, dropdownOpen]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground relative"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasUnreadNotifications && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
                <MoreVerticalIcon className="size-4" />
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="text-popover-foreground hover:text-popover-foreground focus:text-accent-foreground">
                <NotificationCenter 
                  onNotificationRead={() => setHasUnreadNotifications(false)}
                  onNotificationUpdate={() => {
                    // Re-check notifications when they're updated
                    const checkUnread = async () => {
                      try {
                        const response = await fetch("/api/notifications?unreadOnly=true&limit=1");
                        if (response.ok) {
                          const data = await response.json();
                          setHasUnreadNotifications(data.unreadCount > 0);
                        }
                      } catch (error) {
                        console.error("Failed to check unread notifications:", error);
                      }
                    };
                    checkUnread();
                  }}
                />
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <LogoutDialog
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-popover-foreground hover:text-popover-foreground focus:text-accent-foreground">
                  <LogOutIcon />
                  Log out
                </DropdownMenuItem>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
