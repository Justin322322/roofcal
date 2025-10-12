"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
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

interface Notification {
  id: string;
  type: "proposal_sent" | "proposal_accepted" | "proposal_rejected" | "status_change";
  title: string;
  message: string;
  projectId: string;
  projectName: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export function NotificationCenter() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from an API
      // For now, we'll simulate with local storage
      const savedNotifications = localStorage.getItem(`notifications_${session?.user?.id}`);
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications).map((n: Notification) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        }));
        setNotifications(parsed);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();
    }
  }, [session?.user?.id, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    
    // Save to local storage
    if (session?.user?.id) {
      localStorage.setItem(`notifications_${session.user.id}`, JSON.stringify(updated));
    }
  };

  const markAllAsRead = async () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    
    if (session?.user?.id) {
      localStorage.setItem(`notifications_${session.user.id}`, JSON.stringify(updated));
    }
  };

  const deleteNotification = async (notificationId: string) => {
    const updated = notifications.filter(n => n.id !== notificationId);
    setNotifications(updated);
    
    if (session?.user?.id) {
      localStorage.setItem(`notifications_${session.user.id}`, JSON.stringify(updated));
    }
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
                  className={`p-3 border-b hover:bg-muted/50 transition-colors ${
                    !notification.read ? "bg-blue-50/50" : ""
                  }`}
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
                            onClick={() => deleteNotification(notification.id)}
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
                          onClick={() => markAsRead(notification.id)}
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

// Helper function to create notifications (called from API endpoints)
export function createNotification(
  userId: string,
  notification: Omit<Notification, "id" | "read" | "createdAt">
) {
  try {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date(),
    };

    // Get existing notifications
    const existing = localStorage.getItem(`notifications_${userId}`);
    const notifications = existing ? JSON.parse(existing) : [];
    
    // Add new notification at the beginning
    notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    const limited = notifications.slice(0, 50);
    
    // Save back to localStorage
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(limited));
    
    return newNotification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}
