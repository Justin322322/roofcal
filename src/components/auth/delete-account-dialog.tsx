"use client";

import { useState } from "react";
import { TrashIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteAccountDialogProps {
  trigger: React.ReactNode;
  accountName: string;
  accountEmail: string;
  onConfirm: () => Promise<void>;
  disabled?: boolean;
  disableInternalErrorHandling?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function DeleteAccountDialog({
  trigger,
  accountName,
  accountEmail,
  onConfirm,
  disabled = false,
  disableInternalErrorHandling = false,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: DeleteAccountDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use external state if provided, otherwise use internal state
  const isOpen = externalOpen !== undefined ? externalOpen : internalIsOpen;
  const setIsOpen = externalOnOpenChange || setInternalIsOpen;

  const handleDelete = async () => {
    setError(null); // Reset error state before the async call
    setIsDeleting(true);
    try {
      await onConfirm();
      setIsOpen(false);
    } catch (error) {
      console.error("Delete failed:", error);
      if (!disableInternalErrorHandling) {
        setError("Failed to delete account. Please try again.");
      }
      // Re-throw the error so parent can handle it
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setError(null); // Clear error when dialog closes
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild disabled={disabled}>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <TrashIcon className="h-5 w-5 text-destructive" />
            Delete Account
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete this account? This action cannot
              be undone.
            </p>
            <div className="bg-muted p-3 rounded-md">
              <p className="font-medium text-sm">{accountName}</p>
              <p className="text-xs text-muted-foreground">{accountEmail}</p>
            </div>
            <p className="text-sm text-destructive font-medium">
              This will permanently delete the account and all associated data.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div className="px-6 pb-2">
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={async (event) => {
              event.preventDefault();
              event.stopPropagation();
              await handleDelete();
            }}
            disabled={isDeleting}
            aria-busy={isDeleting}
            className="bg-destructive hover:bg-destructive/90 disabled:opacity-50"
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Deleting...
              </span>
            ) : (
              "Delete Account"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
