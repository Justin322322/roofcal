"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangleIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react";
import * as CONSTANTS from "../constants";
import {
  formatInputValue,
  parseFormattedNumber,
  formatNumberWithCommas,
} from "../utils/format";

interface BudgetValidatorProps {
  budgetAmount: string;
  onChange: (value: string) => void;
  roofArea: number;
  selectedMaterial: string;
  totalCost: number;
}

export function BudgetValidator({
  budgetAmount,
  onChange,
  roofArea,
  selectedMaterial,
  totalCost,
}: BudgetValidatorProps) {
  const budget = parseFloat(budgetAmount) || 0;
  const minCostPerSqm =
    CONSTANTS.MIN_COST_PER_SQM[
      selectedMaterial as keyof typeof CONSTANTS.MIN_COST_PER_SQM
    ] || CONSTANTS.MIN_COST_PER_SQM.corrugated;
  const minimumBudget = Math.round(roofArea * minCostPerSqm);

  const isBudgetSufficient = budget >= minimumBudget;
  const budgetStatus =
    budget === 0 ? "none" : isBudgetSufficient ? "sufficient" : "insufficient";

  return (
    <div className="space-y-3 min-w-0">
      <div className="space-y-2">
        <Label htmlFor="budgetAmount">Budget Amount (₱)</Label>
        <Input
          id="budgetAmount"
          type="text"
          placeholder="Enter your budget"
          value={formatInputValue(budgetAmount)}
          onChange={(e) => {
            const cleanValue = parseFormattedNumber(e.target.value);
            onChange(cleanValue);
          }}
          inputMode="numeric"
        />
      </div>

      {roofArea > 0 && budget > 0 && (
        <>
          {budgetStatus === "insufficient" && (
            <Alert variant="destructive">
              <XCircleIcon className="h-4 w-4" />
              <AlertTitle>Budget Insufficient</AlertTitle>
              <AlertDescription>
                Your budget of ₱{formatNumberWithCommas(budget)} is below the
                minimum required budget of ₱
                {formatNumberWithCommas(minimumBudget)} for{" "}
                {roofArea.toFixed(2)} sq.m with {selectedMaterial} roofing.
                <br />
                <strong>Cannot proceed with this configuration.</strong>
                <br />
                Please increase budget or reduce area/material quality.
              </AlertDescription>
            </Alert>
          )}

          {budgetStatus === "sufficient" && budget < totalCost && (
            <Alert>
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertTitle>Budget Warning</AlertTitle>
              <AlertDescription>
                Your budget (₱{formatNumberWithCommas(budget)}) meets minimum
                requirements but is less than the estimated total cost (₱
                {formatNumberWithCommas(totalCost)}).
                <br />
                Consider adjusting specifications or adding ₱
                {formatNumberWithCommas(totalCost - budget)} to your budget.
              </AlertDescription>
            </Alert>
          )}

          {budgetStatus === "sufficient" && budget >= totalCost && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
              <CheckCircle2Icon className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">
                Budget Sufficient
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                Your budget of ₱{formatNumberWithCommas(budget)} is adequate for
                this project.
                {budget > totalCost && (
                  <>
                    <br />
                    Remaining: ₱{formatNumberWithCommas(budget - totalCost)} for
                    contingencies.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {roofArea > 0 && budget === 0 && (
        <p className="text-xs text-muted-foreground">
          Minimum budget for {roofArea.toFixed(2)} sq.m: ₱
          {formatNumberWithCommas(minimumBudget)}
        </p>
      )}
    </div>
  );
}
