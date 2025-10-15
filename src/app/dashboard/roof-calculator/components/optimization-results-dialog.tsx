"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, SparklesIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { formatNumberWithCommas } from "../utils/format";

export interface OptimizationChange {
  field: string;
  fieldLabel: string;
  beforeValue: string | number;
  afterValue: string | number;
  reason: string;
  impact: 'cost' | 'performance' | 'efficiency' | 'complexity';
  savings?: number;
}

export interface OptimizationResult {
  hasChanges: boolean;
  changesCount: number;
  changes: OptimizationChange[];
  totalSavings?: number;
  performanceImprovements?: string[];
}

interface OptimizationResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  optimizationResult: OptimizationResult | null;
}

export function OptimizationResultsDialog({
  open,
  onOpenChange,
  optimizationResult,
}: OptimizationResultsDialogProps) {
  if (!optimizationResult) return null;

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'cost':
        return <TrendingDownIcon className="h-4 w-4 text-green-600" />;
      case 'performance':
      case 'efficiency':
        return <TrendingUpIcon className="h-4 w-4 text-blue-600" />;
      case 'complexity':
        return <CheckCircleIcon className="h-4 w-4 text-purple-600" />;
      default:
        return <SparklesIcon className="h-4 w-4 text-primary" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'cost':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800';
      case 'performance':
      case 'efficiency':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800';
      case 'complexity':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-800';
      default:
        return 'bg-primary/5 text-primary border-primary/20';
    }
  };

  const formatValue = (value: string | number, field: string) => {
    if (typeof value === 'number') {
      if (field.includes('cost') || field.includes('price')) {
        return `₱${formatNumberWithCommas(value)}`;
      }
      return value.toFixed(1);
    }
    return String(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-primary" />
            Optimization Results
          </DialogTitle>
          <DialogDescription>
            {optimizationResult.hasChanges 
              ? `${optimizationResult.changesCount} setting${optimizationResult.changesCount > 1 ? 's' : ''} were automatically optimized for better performance and cost efficiency.`
              : 'Your current settings are already optimized for the best performance and cost efficiency.'
            }
          </DialogDescription>
        </DialogHeader>

        {optimizationResult.hasChanges && optimizationResult.changesCount > 0 ? (
          <div className="space-y-6">
            {/* Summary Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  Optimization Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Settings Optimized</span>
                  <Badge variant="secondary" className="text-sm">
                    {optimizationResult.changesCount} change{optimizationResult.changesCount > 1 ? 's' : ''}
                  </Badge>
                </div>
                
                {optimizationResult.totalSavings && optimizationResult.totalSavings > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estimated Savings</span>
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                      ₱{formatNumberWithCommas(optimizationResult.totalSavings)}
                    </Badge>
                  </div>
                )}

                {optimizationResult.performanceImprovements && optimizationResult.performanceImprovements.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Performance Improvements</span>
                    <div className="space-y-1">
                      {optimizationResult.performanceImprovements.map((improvement, index) => (
                        <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                          <CheckCircleIcon className="h-3 w-3 text-green-600 flex-shrink-0" />
                          {improvement}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detailed Changes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Detailed Changes</h3>
              <div className="space-y-3">
                {optimizationResult.changes.map((change, index) => (
                  <Card key={index} className="border-l-4 border-l-primary/50">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {/* Change Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getImpactIcon(change.impact)}
                            <span className="font-medium">{change.fieldLabel}</span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getImpactColor(change.impact)}`}
                          >
                            {change.impact.charAt(0).toUpperCase() + change.impact.slice(1)}
                          </Badge>
                        </div>

                        {/* Before/After Values */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Before</span>
                            <div className="text-sm font-medium text-red-600 dark:text-red-400">
                              {formatValue(change.beforeValue, change.field)}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">After</span>
                            <div className="text-sm font-medium text-green-600 dark:text-green-400">
                              {formatValue(change.afterValue, change.field)}
                            </div>
                          </div>
                        </div>

                        {/* Reason */}
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Reason</span>
                          <p className="text-sm text-muted-foreground">{change.reason}</p>
                        </div>

                        {/* Savings if applicable */}
                        {change.savings && change.savings > 0 && (
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-xs text-muted-foreground">Cost Impact</span>
                            <span className="text-sm font-medium text-green-600">
                              Save ₱{formatNumberWithCommas(change.savings)}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                Got it, thanks!
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Already Optimized</h3>
              <p className="text-sm text-muted-foreground">
                Your current settings are already configured for optimal performance and cost efficiency.
              </p>
            </div>
            <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
