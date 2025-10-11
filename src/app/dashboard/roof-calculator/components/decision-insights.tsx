"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  LightbulbIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  SparklesIcon,
} from "lucide-react";
import type { DecisionTreeResult } from "../types";
import { ComplexityMeter } from "./complexity-meter";
import { materials } from "./material-selection";

interface DecisionInsightsProps {
  decisionTree: DecisionTreeResult;
  currentMaterial: string;
  area: number;
}

export function DecisionInsights({
  decisionTree,
  currentMaterial,
  area,
}: DecisionInsightsProps) {
  const { materialRecommendation, complexity, optimizationTips } = decisionTree;

  // Get material names and prices for display
  const currentMaterialData = materials.find(
    (m) => m.value === currentMaterial
  );
  const recommendedMaterialData = materials.find(
    (m) => m.value === materialRecommendation.recommendedMaterial
  );

  const currentMaterialName = currentMaterialData?.name || currentMaterial;
  const recommendedMaterialName =
    recommendedMaterialData?.name || materialRecommendation.recommendedMaterial;

  // Calculate potential savings
  const currentMaterialPrice = currentMaterialData?.price || 0;
  const recommendedMaterialPrice = recommendedMaterialData?.price || 0;
  const priceDifference = currentMaterialPrice - recommendedMaterialPrice;
  const potentialSavings = priceDifference * area;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-primary" />
            Project Analysis
          </div>
          {!materialRecommendation.isOptimal && potentialSavings > 0 && (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 hover:bg-green-200"
            >
              Save ₱{potentialSavings.toLocaleString()}
            </Badge>
          )}
          {!materialRecommendation.isOptimal && potentialSavings < 0 && (
            <Badge
              variant="secondary"
              className="bg-red-100 text-red-800 hover:bg-red-200"
            >
              +₱{Math.abs(potentialSavings).toLocaleString()} more
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Intelligent recommendations based on decision tree algorithm
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Material Recommendation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Material Recommendation</h4>
            {materialRecommendation.isOptimal ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2Icon className="h-3 w-3" />
                Optimal Choice
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <AlertTriangleIcon className="h-3 w-3" />
                Alternative Available
              </Badge>
            )}
          </div>

          {materialRecommendation.isOptimal ? (
            <Alert>
              <CheckCircle2Icon className="h-4 w-4" />
              <AlertTitle>Current Selection: {currentMaterialName}</AlertTitle>
              <AlertDescription>
                {materialRecommendation.reason}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertTitle>Consider: {recommendedMaterialName}</AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  <p>{materialRecommendation.reason}</p>
                  {potentialSavings > 0 && (
                    <p className="text-sm font-medium text-green-700">
                      💰 You could save ₱{potentialSavings.toLocaleString()} on
                      materials alone
                    </p>
                  )}
                  {potentialSavings < 0 && (
                    <p className="text-sm font-medium text-red-700">
                      💰 This option would cost ₱
                      {Math.abs(potentialSavings).toLocaleString()} more for
                      materials
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Separator />

        {/* Complexity Meter */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Project Complexity</h4>
          <ComplexityMeter complexity={complexity} />
        </div>

        <Separator />

        {/* Optimization Tips */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <LightbulbIcon className="h-4 w-4 text-yellow-500" />
            Cost Optimization Tips
          </h4>
          <ul className="space-y-2">
            {optimizationTips.map((tip, index) => (
              <li
                key={index}
                className="text-sm text-muted-foreground flex gap-2"
              >
                <span className="text-primary mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Additional Info */}
        <div className="pt-4 text-xs text-muted-foreground border-t">
          <p>
            * These recommendations are generated using a decision tree
            algorithm based on industry best practices. Consult with a
            professional contractor for project-specific advice.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
