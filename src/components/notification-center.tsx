"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  BellIcon,
  CheckIcon,
  XIcon,
  MessageSquareIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
} from "lucide-react";
import { getNotificationUrl } from "@/lib/notification-utils";

interface Notification {
  id: string;
  type: "proposal_sent" | "proposal_accepted" | "proposal_rejected" | "status_change" | "project_assigned";
  title: string;
  message: string;
  projectId: string;
  projectName: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

interface NotificationCenterProps {
  onNotificationRead?: () => void;
  onNotificationUpdate?: () => void;
}


export function NotificationCenter({ 
  onNotificationRead, 
  onNotificationUpdate 
}: NotificationCenterProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications?limit=50");
      
      if (response.ok) {
        const data = await response.json();
        const fetchedNotifications = data.notifications || [];
        
        // Transform the data to match our interface
        const transformedNotifications = fetchedNotifications.map((n: {
          id: string;
          type: string;
          title: string;
          message: string;
          projectId: string | null;
          projectName: string | null;
          read: boolean;
          created_at: string;
          actionUrl: string | null;
        }) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          projectId: n.projectId,
          projectName: n.projectName,
          read: n.read,
          createdAt: new Date(n.created_at),
          actionUrl: n.actionUrl,
        }));
        
        setNotifications(transformedNotifications);
      } else {
        console.error("Failed to fetch notifications:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();
    }
  }, [session?.user?.id, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationIds: [notificationId],
        }),
      });

      if (response.ok) {
        // Update local state
        const updated = notifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        );
        setNotifications(updated);
        
        // Call callback to update parent component
        onNotificationRead?.();
        onNotificationUpdate?.();
      } else {
        console.error("Failed to mark notification as read");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markAllAsRead: true,
        }),
      });

      if (response.ok) {
        // Update local state
        const updated = notifications.map(n => ({ ...n, read: true }));
        setNotifications(updated);
        
        // Call callback to update parent component
        onNotificationRead?.();
        onNotificationUpdate?.();
      } else {
        console.error("Failed to mark all notifications as read");
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Update local state
        const updated = notifications.filter(n => n.id !== notificationId);
        setNotifications(updated);
        
        // Call callback to update parent component
        onNotificationUpdate?.();
      } else {
        console.error("Failed to delete notification");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate to the appropriate page
    const url = getNotificationUrl(notification);
    router.push(url);
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "proposal_sent":
        return <MessageSquareIcon className="h-4 w-4 text-blue-600" />;
      case "proposal_accepted":
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case "proposal_rejected":
        return <AlertCircleIcon className="h-4 w-4 text-red-600" />;
      case "status_change":
        return <ClockIcon className="h-4 w-4 text-orange-600" />;
      case "project_assigned":
        return <CheckIcon className="h-4 w-4 text-purple-600" />;
      default:
        return <BellIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex w-full items-center justify-start gap-2 px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer">
          <BellIcon className="h-4 w-4" />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-64">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b hover:bg-muted/50 transition-colors cursor-pointer ${
                    !notification.read ? "bg-blue-50/50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-2">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${!notification.read ? "font-semibold" : ""}`}>
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <XIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.projectName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.createdAt.toLocaleDateString()} at{" "}
                        {notification.createdAt.toLocaleTimeString()}
                      </p>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="mt-2 h-6 text-xs"
                        >
                          <CheckIcon className="h-3 w-3 mr-1" />
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Button variant="ghost" size="sm" className="w-full justify-center">
                View all notifications
              </Button>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

