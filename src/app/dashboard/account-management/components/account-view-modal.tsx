"use client";

import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MailIcon,
  PhoneIcon,
  BuildingIcon,
  CalendarIcon,
  TrendingUpIcon,
  DollarSignIcon,
  TrashIcon,
  ActivityIcon,
  UserIcon,
  BarChart3Icon,
  RefreshCwIcon,
  XIcon,
  UserXIcon,
  UserCheckIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { Account } from "../types";
import { getStatusBadgeVariant, formatCurrency } from "../utils";
import {
  getUserActivities,
  getUserByEmail,
  disableAccount,
  enableAccount,
  type ActivityLog,
} from "../actions";
import DeleteAccountDialog from "@/components/auth/delete-account-dialog";

interface AccountViewModalProps {
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (accountId: string) => Promise<void>;
  onDisable?: () => Promise<void>;
  onEnable?: () => Promise<void>;
}

export function AccountViewModal({
  account,
  isOpen,
  onClose,
  onDelete,
  onDisable,
  onEnable,
}: AccountViewModalProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [disablingAccount, setDisablingAccount] = useState(false);
  const [enablingAccount, setEnablingAccount] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [hasMoreActivities, setHasMoreActivities] = useState(false);
  const [totalActivities, setTotalActivities] = useState(0);
  const ACTIVITIES_PER_PAGE = 5;

  // Function to fetch activities
  const fetchActivities = useCallback(
    async (isRefresh = false, page = 1) => {
      if (!account?.email) return;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoadingActivities(true);
      }

      try {
        const user = await getUserByEmail(account.email);
        if (user) {
          const activities = await getUserActivities(user.id, page);
          if (page === 1 || isRefresh) {
            setActivityLog(activities);
            setActivityPage(1);
          } else {
            setActivityLog((prev) => [...prev, ...activities]);
          }
          // Update pagination state based on actual results
          setHasMoreActivities(activities.length === ACTIVITIES_PER_PAGE);
          setTotalActivities(prev => isRefresh ? activities.length : prev + activities.length);
        }
      } catch (error) {
        console.error("Error fetching activities:", error);
        if (page === 1 || isRefresh) {
          setActivityLog([]);
        }
      } finally {
        setLoadingActivities(false);
        setRefreshing(false);
      }
    },
    [account?.email]
  );

  // Fetch real activity data when modal opens or account changes
  React.useEffect(() => {
    if (isOpen && account) {
      fetchActivities();
    }
  }, [account, isOpen, fetchActivities]);

  if (!account) return null;

  const handleDelete = async () => {
    if (!onDelete || !account) return;

    setDeletingAccount(true);

    try {
      await onDelete(account.id);
      toast.success("Account deleted successfully");
      onClose();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleDisable = async () => {
    if (!account) return;

    setDisablingAccount(true);

    try {
      const result = await disableAccount(account.id);
      if (result.success) {
        toast.success("Account disabled successfully");
        onClose();
        // Call the onDisable callback if provided
        if (onDisable) {
          await onDisable();
        }
      } else {
        toast.error(result.errors?.[0] || "Failed to disable account");
      }
    } catch (error) {
      console.error("Error disabling account:", error);
      toast.error("Failed to disable account. Please try again.");
    } finally {
      setDisablingAccount(false);
    }
  };

  const handleEnable = async () => {
    if (!account) return;

    setEnablingAccount(true);

    try {
      const result = await enableAccount(account.id);
      if (result.success) {
        toast.success("Account enabled successfully");
        onClose();
        // Call the onEnable callback if provided
        if (onEnable) {
          await onEnable();
        }
      } else {
        toast.error(result.errors?.[0] || "Failed to enable account");
      }
    } catch (error) {
      console.error("Error enabling account:", error);
      toast.error("Failed to enable account. Please try again.");
    } finally {
      setEnablingAccount(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "N/A";
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "N/A";
    }
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* Fixed Header */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <DialogHeader className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 flex-wrap">
                <DialogTitle className="text-xl font-semibold">
                  {account.clientName}
                </DialogTitle>
                <Badge
                  variant={getStatusBadgeVariant(account.status)}
                  className="shrink-0"
                >
                  {account.status}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-accent"
              >
                <XIcon className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <DialogDescription className="text-sm">
              {account.email}
            </DialogDescription>
          </DialogHeader>

          <Separator />

          {/* Fixed Tabs */}
          <div className="px-6 pt-2 pb-2">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="activity">
                  <ActivityIcon className="h-4 w-4 mr-2" />
                  Activity
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <ScrollArea className="flex-1 px-6 overflow-auto">
            {/* Details Tab */}
            <TabsContent value="details" className="mt-0 py-4 space-y-5">
              {/* Project & Revenue */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Project & Revenue
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-primary/10 p-2.5">
                        <TrendingUpIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Total Projects
                        </p>
                        <p className="text-2xl font-semibold">
                          {account.totalProjects}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-primary/10 p-2.5">
                        <DollarSignIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Total Spend
                        </p>
                        <p className="text-2xl font-semibold">
                          {formatCurrency(account.totalSpend)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {account.totalProjects > 0 && (
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-primary/10 p-2.5">
                          <BarChart3Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Avg per Project
                          </p>
                          <p className="text-xl font-semibold">
                            {formatCurrency(
                              account.totalSpend / account.totalProjects
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <Separator />

              {/* Contact Information */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Contact Information
                </h3>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <MailIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{account.email}</p>
                    </div>
                  </div>

                  {account.phone && (
                    <div className="flex items-center gap-3">
                      <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium">{account.phone}</p>
                      </div>
                    </div>
                  )}

                  {account.company && (
                    <div className="flex items-center gap-3">
                      <BuildingIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Company</p>
                        <p className="text-sm font-medium">{account.company}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <Separator />

              {/* Account Information */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Account Information
                </h3>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Join Date</p>
                      <p className="text-sm font-medium">
                        {formatDate(account.joinDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Last Activity
                      </p>
                      <p className="text-sm font-medium">
                        {formatDate(account.lastActivity)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Account Age
                      </p>
                      <p className="text-sm font-medium">
                        {Math.floor(
                          (new Date().getTime() -
                            new Date(account.joinDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        days
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-0 py-4 space-y-4">
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Recent Activity
                    </h3>
                    {activityLog.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {activityLog.length} activities
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchActivities(true)}
                    disabled={refreshing}
                    className="h-6 px-2 text-xs"
                  >
                    <RefreshCwIcon
                      className={`h-3 w-3 mr-1 ${refreshing ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                </div>
                
                {/* Activity List Container with proper height */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {loadingActivities && activityLog.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-muted-foreground">
                        Loading activities...
                      </div>
                    </div>
                  ) : activityLog.length > 0 ? (
                    <>
                      {activityLog.map((activity, index) => (
                        <div
                          key={activity.id}
                          className={`p-3 rounded-lg border hover:bg-accent/50 transition-colors ${
                            index === activityLog.length - 1 ? 'mb-2' : ''
                          }`}
                        >
                          <p className="text-sm font-medium">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDateTime(activity.date)}
                          </p>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-muted-foreground">
                        No activity recorded yet
                      </div>
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                {activityLog.length > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Showing {activityLog.length} of {totalActivities || activityLog.length} activities
                    </div>
                    {hasMoreActivities && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const nextPage = activityPage + 1;
                          setActivityPage(nextPage);
                          fetchActivities(false, nextPage);
                        }}
                        disabled={loadingActivities}
                        className="text-xs"
                      >
                        {loadingActivities ? (
                          <>
                            <RefreshCwIcon className="h-3 w-3 mr-1 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load More"
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </section>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <Separator />

        <DialogFooter className="px-6 py-4 flex-shrink-0 bg-background">
          <div className="flex gap-2 w-full">
            {account.status === "Active" && (
              <Button
                variant="destructive"
                onClick={handleDisable}
                disabled={disablingAccount}
                className="sm:mr-auto"
              >
                <UserXIcon className="h-4 w-4 mr-2" />
                {disablingAccount ? "Disabling..." : "Disable Account"}
              </Button>
            )}
            
            {account.status === "Disabled" && (
              <Button
                variant="default"
                onClick={handleEnable}
                disabled={enablingAccount}
                className="sm:mr-auto"
              >
                <UserCheckIcon className="h-4 w-4 mr-2" />
                {enablingAccount ? "Enabling..." : "Enable Account"}
              </Button>
            )}

            {onDelete && account.status === "Disabled" && (
              <DeleteAccountDialog
                trigger={
                  <Button
                    variant="destructive"
                    disabled={deletingAccount}
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    {deletingAccount ? "Deleting..." : "Delete Account"}
                  </Button>
                }
                accountName={account.clientName}
                accountEmail={account.email}
                onConfirm={handleDelete}
                disabled={deletingAccount}
                disableInternalErrorHandling={true}
              />
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
