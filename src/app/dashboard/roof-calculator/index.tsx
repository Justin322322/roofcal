"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRoofCalculator } from "./hooks";
import { WizardCalculator } from "./components/wizard-calculator";

interface RoofCalculatorContentProps {
  isAdminMode?: boolean;
  isAdminSelfMode?: boolean;
  selectedClientId?: string;
  selectedClientName?: string;
  onProjectCreated?: () => void;
}

export function RoofCalculatorContent({
  isAdminMode = false,
  isAdminSelfMode = false,
  selectedClientId,
  selectedClientName,
  onProjectCreated,
}: RoofCalculatorContentProps = {}) {
  const {
    measurements,
    setMeasurements,
    material,
    setMaterial,
    results,
    decisionTree,
    handleReset,
    handleAutoOptimize,
    isPricingLoaded,
    pricingError,
  } = useRoofCalculator();

  return (
    <div className="px-2 sm:px-3 lg:px-6">
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        {pricingError && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-sm text-destructive">Pricing failed to load</CardTitle>
              <CardDescription className="text-xs text-destructive/80">Please try again or contact support.</CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Wizard Mode */}
        <WizardCalculator
          measurements={measurements}
          setMeasurements={setMeasurements}
          material={material}
          setMaterial={setMaterial}
          results={results}
          decisionTree={decisionTree}
          onReset={handleReset}
          onAutoOptimize={handleAutoOptimize}
          isPricingLoaded={isPricingLoaded}
          isAdminMode={isAdminMode}
          isAdminSelfMode={isAdminSelfMode}
          selectedClientId={selectedClientId}
          selectedClientName={selectedClientName}
          onProjectCreated={onProjectCreated}
        />
      </div>
    </div>
  );
}
