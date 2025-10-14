"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2Icon, HelpCircleIcon } from "lucide-react";
import { toast } from "sonner";

interface HelpRequestDialogProps {
  trigger?: React.ReactNode;
}

export function HelpRequestDialog({ trigger }: HelpRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/help-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message.trim() }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Help request sent!", {
          description: `Your request has been sent to ${result.notificationsSent} administrator(s)`,
        });
        setOpen(false);
        setMessage("");
      } else {
        toast.error("Failed to send help request", {
          description: result.error || "Please try again later",
        });
      }
    } catch (error) {
      console.error("Error sending help request:", error);
      toast.error("Failed to send help request", {
        description: "Please check your connection and try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <HelpCircleIcon className="h-4 w-4" />
      Need Help?
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircleIcon className="h-5 w-5 text-primary" />
            Request Contractor Help
          </DialogTitle>
          <DialogDescription>
            If you're having trouble with the calculator or need assistance creating your project, 
            our contractors can help you get started.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="help-message">Optional Message</Label>
            <Textarea
              id="help-message"
              placeholder="Describe what you need help with (optional)..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/500 characters
            </p>
          </div>
          
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">
              <strong>What happens next:</strong>
            </p>
            <ul className="mt-1 text-xs text-muted-foreground list-disc list-inside space-y-1">
              <li>Contractors will be notified of your request</li>
              <li>They can create a project on your behalf</li>
              <li>You'll receive a notification when it's ready</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
