"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle2, Calendar } from "lucide-react";

interface MaintenanceSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  maintenanceScheduledEnd: string | null;
  maintenanceStartedBy: string | null;
  maintenanceStartedAt: string | null;
}

export default function SystemControlContent() {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/system/maintenance");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      setSettings(data);
      setMessage(data.maintenanceMessage || "");
      setScheduledEnd(
        data.maintenanceScheduledEnd
          ? new Date(data.maintenanceScheduledEnd).toISOString().slice(0, 16)
          : ""
      );
    } catch {
      setError("Failed to load maintenance settings");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const action = settings?.maintenanceMode ? "disable" : "enable";
      const response = await fetch("/api/system/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          message,
          scheduledEnd: scheduledEnd || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update maintenance mode");

      const data = await response.json();
      setSettings(data);
      setSuccess(
        `Maintenance mode ${action === "enable" ? "enabled" : "disabled"} successfully`
      );
    } catch {
      setError("Failed to update maintenance mode");
    } finally {
      setSaving(false);
    }
  };

  const handleManualLift = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/system/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "disable",
        }),
      });

      if (!response.ok) throw new Error("Failed to lift maintenance");

      const data = await response.json();
      setSettings(data);
      setSuccess("Maintenance mode lifted successfully");
    } catch {
      setError("Failed to lift maintenance mode");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Control</h2>
        <p className="text-muted-foreground">
          Manage system-wide maintenance mode and scheduled downtime
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-900/10">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Mode</CardTitle>
          <CardDescription>
            Enable or disable system-wide maintenance mode. When enabled, only
            DEVELOPER users can access the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Maintenance Status */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">Current Status</p>
                <Badge
                  variant={settings?.maintenanceMode ? "destructive" : "default"}
                >
                  {settings?.maintenanceMode ? "ACTIVE" : "INACTIVE"}
                </Badge>
              </div>
              {settings?.maintenanceMode && settings?.maintenanceStartedAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Started:{" "}
                    {new Date(settings.maintenanceStartedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            <Switch
              checked={settings?.maintenanceMode || false}
              onCheckedChange={handleToggleMaintenance}
              disabled={saving}
            />
          </div>

          {/* Maintenance Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Maintenance Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Enter a custom message to display to users during maintenance..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              disabled={saving}
            />
            <p className="text-sm text-muted-foreground">
              This message will be displayed on the maintenance page
            </p>
          </div>

          {/* Scheduled End Time */}
          <div className="space-y-2">
            <Label htmlFor="scheduledEnd">Scheduled End Time (Optional)</Label>
            <Input
              id="scheduledEnd"
              type="datetime-local"
              value={scheduledEnd}
              onChange={(e) => setScheduledEnd(e.target.value)}
              disabled={saving}
            />
            <p className="text-sm text-muted-foreground">
              Display when maintenance is expected to complete
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleToggleMaintenance}
              disabled={saving}
              variant={settings?.maintenanceMode ? "outline" : "default"}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {settings?.maintenanceMode ? "Disable Maintenance" : "Enable Maintenance"}
            </Button>
            {settings?.maintenanceMode && (
              <Button
                onClick={handleManualLift}
                disabled={saving}
                variant="secondary"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Manual Lift
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Settings Display */}
      {settings?.maintenanceMode && (
        <Card>
          <CardHeader>
            <CardTitle>Current Maintenance Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Message</p>
                <p className="text-sm">
                  {settings.maintenanceMessage || "No custom message set"}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Scheduled End
                </p>
                <p className="text-sm">
                  {settings.maintenanceScheduledEnd
                    ? new Date(settings.maintenanceScheduledEnd).toLocaleString()
                    : "No scheduled end time"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

