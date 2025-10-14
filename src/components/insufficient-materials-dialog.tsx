"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Package, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface InsufficientMaterial {
  materialId: string;
  materialName: string;
  required: number;
  available: number;
  shortage: number;
}

interface InsufficientMaterialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insufficientMaterials: InsufficientMaterial[];
  warehouseId?: string;
}

export function InsufficientMaterialsDialog({
  open,
  onOpenChange,
  insufficientMaterials,
  warehouseId,
}: InsufficientMaterialsDialogProps) {
  const router = useRouter();

  const handleGoToWarehouse = () => {
    onOpenChange(false);
    if (warehouseId) {
      // Pass warehouse ID and material IDs as URL parameters
      const materialIds = insufficientMaterials.map(m => m.materialId).join(',');
      router.push(`/dashboard/warehouse-management?warehouse=${warehouseId}&materials=${materialIds}&highlight=true`);
    } else {
      router.push("/dashboard/warehouse-management");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Insufficient Materials</DialogTitle>
              <DialogDescription>
                The warehouse doesn&apos;t have enough materials to accept this project.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex items-start gap-3 mb-3">
              <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">
                  Missing Materials
                </h4>
                <p className="text-xs text-muted-foreground">
                  Add these materials to your warehouse to proceed
                </p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {insufficientMaterials.map((material) => (
                <div
                  key={material.materialId}
                  className="flex items-center justify-between rounded-md border border-border bg-background p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{material.materialName}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="font-medium text-foreground">
                          Need:
                        </span>
                        {material.required}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium text-foreground">
                          Have:
                        </span>
                        {material.available}
                      </span>
                      <span className="flex items-center gap-1 text-destructive">
                        <span className="font-medium">Short:</span>
                        {material.shortage}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>Tip:</strong> Go to Warehouse Management to add the missing
                materials. Once added, you can accept this project.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGoToWarehouse} className="gap-2">
            <Package className="h-4 w-4" />
            Go to Warehouse
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

