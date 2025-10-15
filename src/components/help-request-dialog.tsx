"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2Icon, HelpCircleIcon, SendIcon, CheckIcon } from "lucide-react";
import { toast } from "sonner";

interface HelpRequestDialogProps {
  trigger?: React.ReactNode;
}

interface Contractor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  completedProjects: number;
}

export function HelpRequestDialog({ trigger }: HelpRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedContractorId, setSelectedContractorId] = useState("");
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [isLoadingContractors, setIsLoadingContractors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch contractors when dialog opens
  useEffect(() => {
    if (open) {
      fetchContractors();
      // Reset states when dialog opens
      setIsSuccess(false);
      setMessage("");
      setSelectedContractorId("");
    }
  }, [open]);

  const fetchContractors = async () => {
    setIsLoadingContractors(true);
    try {
      const response = await fetch('/api/contractors');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.contractors) {
          setContractors(result.contractors);
        } else {
          toast.error("Failed to load contractors");
        }
      } else {
        toast.error("Failed to load contractors");
      }
    } catch (error) {
      console.error("Failed to fetch contractors:", error);
      toast.error("Failed to load contractors");
    } finally {
      setIsLoadingContractors(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!selectedContractorId) {
      toast.error("Please select a contractor");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/help-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: message.trim(),
          contractorId: selectedContractorId 
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsSuccess(true);
        toast.success("Help request sent!", {
          description: `Your request has been sent to ${result.contractorName}`,
        });
        
        // Delay closing the dialog to show success state
        setTimeout(() => {
          setOpen(false);
          setMessage("");
          setSelectedContractorId("");
          setIsSuccess(false);
        }, 1500);
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
            If you&apos;re having trouble with the calculator or need assistance creating your project, 
            our contractors can create a project proposal for you to review and approve.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center animate-pulse">
                <CheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">
                  Request Sent Successfully!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your help request has been sent to the contractor. They will be notified and can assist you shortly.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="contractor">Select Contractor *</Label>
                <Select
                  value={selectedContractorId}
                  onValueChange={setSelectedContractorId}
                  disabled={isLoadingContractors || isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={
                      isLoadingContractors ? "Loading contractors..." : "Choose a contractor"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {contractors.map((contractor) => (
                      <SelectItem key={contractor.id} value={contractor.id}>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-sm">{contractor.companyName}</span>
                          <span className="text-xs text-muted-foreground">
                            {contractor.completedProjects} completed project{contractor.completedProjects !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="help-message">Optional Message</Label>
                <Textarea
                  id="help-message"
                  placeholder="Describe what you need help with (optional)..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[100px] resize-none transition-all duration-200"
                  maxLength={500}
                  disabled={isSubmitting}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    {message.length}/500 characters
                  </p>
                  {message.length > 400 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      {500 - message.length} characters remaining
                    </p>
                  )}
                </div>
              </div>
              
              <div className="rounded-lg bg-muted/50 p-3 transition-all duration-200">
                <p className="text-sm text-muted-foreground">
                  <strong>What happens next:</strong>
                </p>
                <ul className="mt-1 text-xs text-muted-foreground list-disc list-inside space-y-1">
                  <li>The selected contractor will be notified of your request</li>
                  <li>They will create a project proposal for you to review</li>
                  <li>You&apos;ll receive a notification to review and approve the proposal</li>
                </ul>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting || isSuccess}
            className="transition-all duration-200"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || isSuccess || !selectedContractorId}
            className="transition-all duration-200 min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : isSuccess ? (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Sent!
              </>
            ) : (
              <>
                <SendIcon className="h-4 w-4 mr-2" />
                Send Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
