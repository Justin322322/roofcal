"use client";

import * as React from "react";
import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import {
  X,
  BookOpenIcon,
  HomeIcon,
  LayersIcon,
  CalculatorIcon,
  ClipboardListIcon,
  SparklesIcon,
  ArchiveIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import tutorialContent from "@/data/tutorial-content.json";
import type { TutorialContent, RoofTypeDetails } from "@/data/tutorial-types";

const content = tutorialContent as unknown as TutorialContent;

export function TutorialGuideDialog() {
  const [selectedRoofType, setSelectedRoofType] = useState<string | null>(null);

  const getRoofTypeDetails = (type: string): RoofTypeDetails => {
    return content.roofTypes[type as keyof typeof content.roofTypes] || content.roofTypes.gable;
  };

  // Use same blob base for all tutorial media
  const BLOB_BASE = "https://unex0yvstmuqs1jv.public.blob.vercel-storage.com/roof/" as const;
  const roofTypeImages: { [key: string]: string } = {
    gable: `${BLOB_BASE}gable.jpg`,
    shed: `${BLOB_BASE}shed-roof.jpg`,
  };

  return (
    <TooltipProvider>
      <DialogPrimitive.Root>
        <DialogPrimitive.Trigger asChild>
        <button
          className={cn(
            "w-full bg-primary text-primary-foreground duration-200 ease-linear",
            "hover:bg-primary/90 hover:text-primary-foreground",
            "active:bg-primary/90 active:text-primary-foreground",
            "inline-flex items-center gap-2 h-9 px-3 rounded-md text-sm font-medium justify-start"
          )}
          type="button"
        >
          <BookOpenIcon className="h-4 w-4" />
          <span>Tutorial Guide</span>
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl translate-x-[-50%] translate-y-[-50%]",
            "border bg-background h-[90vh] sm:h-[85vh] flex flex-col p-0 gap-0 shadow-lg duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg"
          )}
        >
          {/* Header */}
          <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b">
            <DialogTitle className="text-lg sm:text-xl font-semibold leading-none tracking-tight">
              RoofCalc Tutorial Guide
            </DialogTitle>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Complete guide to using RoofCal for accurate roof cost estimation
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-3 sm:p-6">
            <Tabs defaultValue="overview" className="w-full">
              <div className="mb-3 sm:mb-4 md:mb-6">
                <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 w-full h-auto p-1 bg-muted/50 rounded-lg gap-1">
                  <TabsTrigger
                    className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                    value="overview"
                  >
                    <HomeIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline whitespace-nowrap">Overview</span>
                    <span className="sm:hidden">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger
                    className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                    value="roof-types"
                  >
                    <LayersIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline whitespace-nowrap">Roof Types</span>
                    <span className="sm:hidden">Types</span>
                  </TabsTrigger>
                  <TabsTrigger
                    className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                    value="materials"
                  >
                    <LayersIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline whitespace-nowrap">Materials</span>
                    <span className="sm:hidden">Materials</span>
                  </TabsTrigger>
                  <TabsTrigger
                    className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                    value="calculator"
                  >
                    <CalculatorIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline whitespace-nowrap">Calculator</span>
                    <span className="sm:hidden">Calc</span>
                  </TabsTrigger>
                  <TabsTrigger
                    className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                    value="how-to-use"
                  >
                    <ClipboardListIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline whitespace-nowrap">How to use</span>
                    <span className="sm:hidden">Guide</span>
                  </TabsTrigger>
                  <TabsTrigger
                    className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                    value="ai-system"
                  >
                    <SparklesIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline whitespace-nowrap">AI System</span>
                    <span className="sm:hidden">AI</span>
                  </TabsTrigger>
                  <TabsTrigger
                    className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                    value="archive"
                  >
                    <ArchiveIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline whitespace-nowrap">Archive</span>
                    <span className="sm:hidden">Archive</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="overview"
                className="mt-0 p-3 sm:p-4 bg-muted/20 rounded-lg"
              >
                <h3 className="text-base sm:text-lg font-semibold mb-3">
                  {content.tabs.overview.title}
                </h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>{content.tabs.overview.description}</p>

                  <div className="space-y-3">
                    <h4 className="text-sm sm:text-base font-medium text-foreground">
                      Key Features:
                    </h4>
                    <ul className="space-y-2 ml-4">
                      {content.tabs.overview.keyFeatures?.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>
                            <strong>{feature.title}:</strong> {feature.description}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 sm:p-4">
                    <h4 className="text-sm sm:text-base font-medium text-foreground mb-2">
                      Getting Started:
                    </h4>
                    <p className="text-xs sm:text-sm">{content.tabs.overview.gettingStarted}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="roof-types"
                className="mt-0 p-3 sm:p-4 bg-muted/20 rounded-lg"
              >
                <h3 className="text-base sm:text-lg font-semibold mb-3">{content.tabs["roof-types"].title}</h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>{content.tabs["roof-types"].description}</p>

                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <div className="space-y-3">
                      <h4 className="text-sm sm:text-base font-medium text-foreground">
                        Common Residential Roofs:
                      </h4>
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                        {content.tabs["roof-types"].commonRoofs?.map((roof, index) => (
                          <div
                            key={index}
                            className="border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow group"
                            onClick={() => setSelectedRoofType(roof.type)}
                          >
                            <div className="aspect-square bg-muted/30 rounded-lg mb-2 overflow-hidden group-hover:bg-muted/50 transition-colors">
                              <Image
                                src={roofTypeImages[roof.type]}
                                alt={roof.name}
                                width={200}
                                height={200}
                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-300"
                              />
                            </div>
                            <h5 className="font-medium text-foreground text-sm">
                              {roof.name}
                            </h5>
                            <p className="text-xs text-muted-foreground">
                              {roof.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                        {content.tabs["roof-types"].complexRoofs?.map((roof, index) => (
                          <div
                            key={index}
                            className="border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow group"
                            onClick={() => setSelectedRoofType(roof.type)}
                          >
                            <div className="aspect-square bg-muted/30 rounded-lg mb-2 overflow-hidden group-hover:bg-muted/50 transition-colors">
                              <Image
                                src={roofTypeImages[roof.type]}
                                alt={roof.name}
                                width={200}
                                height={200}
                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-300"
                              />
                            </div>
                            <h5 className="font-medium text-foreground text-sm">
                              {roof.name}
                            </h5>
                            <p className="text-xs text-muted-foreground">
                              {roof.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Roof Type Information */}
                  {selectedRoofType && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-4">
                      <h4 className="text-base font-medium text-foreground mb-3">
                        {getRoofTypeDetails(selectedRoofType).name} - Detailed Information
                      </h4>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <strong>Description:</strong> {getRoofTypeDetails(selectedRoofType).description}
                        </p>
                        <p className="text-sm">
                          <strong>Best For:</strong> {getRoofTypeDetails(selectedRoofType).bestFor}
                        </p>
                        <p className="text-sm">
                          <strong>Cost Range:</strong> {getRoofTypeDetails(selectedRoofType).costRange}
                        </p>
                        <p className="text-sm">
                          <strong>Complexity:</strong> {getRoofTypeDetails(selectedRoofType).complexity}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-base font-medium text-foreground mb-2">
                      Selection Tips:
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {content.tabs["roof-types"].selectionTips?.map((tip, index) => (
                        <li key={index}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="materials"
                className="mt-0 p-3 sm:p-4 bg-muted/20 rounded-lg"
              >
                <h3 className="text-base sm:text-lg font-semibold mb-3">{content.tabs.materials.title}</h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>{content.tabs.materials.description}</p>

                  {/* Group variants to avoid repeated images */}
                  {(() => {
                    const mats = content.tabs.materials.materialList || [];
                    type Group = { key: string; image: string; items: typeof mats };
                    const groups: Group[] = [];
                    const byKey: Record<string, Group> = {};
                    mats.forEach((m) => {
                      const base = m.name.toLowerCase().includes("long span") ? "Long Span" : "Corrugated";
                      if (!byKey[base]) {
                        const defaultImg = base === "Long Span" ? `${BLOB_BASE}long-span.jpg` : `${BLOB_BASE}corrugated.jpg`;
                        byKey[base] = { key: base, image: (m.image?.startsWith("/roof/") ? `${BLOB_BASE}${m.image.replace("/roof/", "")}` : m.image) || defaultImg, items: [] };
                        groups.push(byKey[base]);
                      }
                      byKey[base].items.push(m);
                    });

                    return (
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                        {groups.map((group) => (
                          <div key={group.key} className="border rounded-lg p-4 group">
                            <div className="text-center mb-4">
                              <div className="aspect-video bg-muted/30 rounded-lg overflow-hidden group-hover:bg-muted/50 transition-colors mb-3">
                                <Image
                                  src={group.image}
                                  alt={group.key}
                                  width={200}
                                  height={120}
                                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-300"
                                />
                              </div>
                              <h4 className="text-lg font-semibold text-foreground">{group.key}</h4>
                            </div>
                            <Separator className="my-4" />
                            <div className="space-y-3">
                              {group.items.map((material, idx) => (
                                <Tooltip key={idx}>
                                  <TooltipTrigger asChild>
                                    <div className="rounded-md border p-3 cursor-help hover:bg-muted/50 transition-colors">
                                      <div className="font-medium text-sm">{material.name}</div>
                                      {material.description && (
                                        <p className="text-xs text-muted-foreground mt-0.5">{material.description}</p>
                                      )}
                                      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm mt-2">
                                        <p><strong>Cost:</strong> {material.cost}</p>
                                        <p><strong>Lifespan:</strong> {material.lifespan}</p>
                                        <p className="sm:col-span-2"><strong>Pros:</strong> {material.pros}</p>
                                        <p className="sm:col-span-2"><strong>Cons:</strong> {material.cons}</p>
                                        <p className="sm:col-span-2"><strong>Best for:</strong> {material.bestFor}</p>
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs bg-popover text-popover-foreground border">
                                    <p className="text-sm text-popover-foreground">{material.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-base font-medium text-foreground mb-2">
                      Material Selection Guide:
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {content.tabs.materials.selectionGuide?.map((guide, index) => (
                        <li key={index}>
                          • <strong>{guide.factor}:</strong> {guide.description}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Extended Materials from /roof */}
                  <div className="space-y-6 mt-4">
                    {[
                      { key: "ridgeCaps", title: "Ridge Caps" },
                      { key: "gutters", title: "Gutters" },
                      { key: "screws", title: "Screws" },
                      { key: "insulation", title: "Insulation" },
                      { key: "ventilation", title: "Ventilation" },
                    ].map((section) => (
                      ((content.tabs.materials as unknown as { [k: string]: { name: string; image: string }[] })[section.key])?.length ? (
                        <div key={section.key}>
                          <h4 className="text-base font-medium text-foreground mb-2">{section.title}</h4>
                          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                            {(() => {
                              const raw = (content.tabs.materials as unknown as { [k: string]: { name: string; image: string; description?: string }[] })[section.key];
                              const items = raw.filter((itm, idx, arr) => arr.findIndex((x) => x.name === itm.name) === idx);
                              return items.map((item: { name: string; image: string; description?: string }, idx: number) => (
                                <Tooltip key={`${section.key}-${idx}-${item.name}`}>
                                  <TooltipTrigger asChild>
                                    <div className="group border rounded-lg p-3 cursor-help hover:bg-muted/50 transition-colors">
                                      <div className="aspect-square bg-muted/30 rounded-lg mb-2 overflow-hidden group-hover:bg-muted/50 transition-colors">
                                        <Image
                                          src={item.image?.startsWith("/roof/") ? `${BLOB_BASE}${item.image.replace("/roof/", "")}` : item.image}
                                          alt={item.name}
                                          width={200}
                                          height={200}
                                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-300"
                                        />
                                      </div>
                                      <div className="text-sm font-medium text-foreground text-center">{item.name}</div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs bg-popover text-popover-foreground border">
                                    <p className="text-sm font-medium text-popover-foreground">{item.name}</p>
                                    {item.description && (
                                      <p className="text-xs text-popover-foreground/80 mt-1">
                                        {item.description}
                                      </p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              ));
                            })()}
                          </div>
                        </div>
                      ) : null
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="calculator"
                className="mt-0 p-3 sm:p-4 bg-muted/20 rounded-lg"
              >
                <h3 className="text-base sm:text-lg font-semibold mb-3">{content.tabs.calculator.title}</h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>{content.tabs.calculator.description}</p>

                  <div className="space-y-4">
                    <h4 className="text-sm sm:text-base font-medium text-foreground">
                      Step-by-Step Workflow:
                    </h4>

                    <div className="space-y-4">
                      {content.tabs.calculator.workflow?.map((step, index) => (
                        <div key={index} className="border-l-4 border-primary pl-4">
                          <h5 className="font-medium text-foreground">
                            {step.step}
                          </h5>
                          <p className="text-sm mt-1">{step.description}</p>
                          {step.details && (
                            <ul className="text-sm ml-4 mt-2 space-y-1">
                              {step.details.map((detail, detailIndex) => (
                                <li key={detailIndex}>
                                  • <strong>{detail.split(':')[0]}:</strong> {detail.split(':')[1]}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-base font-medium text-foreground mb-2">
                      Pro Tips for Accurate Calculations:
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {content.tabs.calculator.proTips?.map((tip, index) => (
                        <li key={index}>
                          • <strong>{typeof tip === 'string' ? tip : tip.tip}:</strong> {typeof tip === 'string' ? '' : tip.description}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {content.tabs.calculator.advancedFeatures?.map((feature, index) => (
                        <li key={index}>
                          • <strong>{feature.feature}:</strong> {feature.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>

              {/* Additional tabs content would follow the same pattern... */}
              {/* For brevity, I'll include one more complete example and indicate where others would go */}

              <TabsContent
                value="how-to-use"
                className="mt-0 p-3 sm:p-4 bg-muted/20 rounded-lg"
              >
                <h3 className="text-base sm:text-lg font-semibold mb-3">{content.tabs["how-to-use"].title}</h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>{content.tabs["how-to-use"].description}</p>

                  <div className="space-y-3">
                    <h4 className="text-sm sm:text-base font-medium text-foreground">
                      Getting Started:
                    </h4>
                    <ul className="space-y-1 ml-4">
                      {Array.isArray(content.tabs["how-to-use"].gettingStarted) && 
                        content.tabs["how-to-use"].gettingStarted.map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{item}</span>
                          </li>
                        ))
                      }
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm sm:text-base font-medium text-foreground">
                      {content.tabs["how-to-use"].projectEstimation?.title}:
                    </h4>
                    <div className="space-y-3">
                      {content.tabs["how-to-use"].projectEstimation?.steps?.map((step, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <h5 className="font-medium text-foreground">
                            {step.step}
                          </h5>
                          <p className="text-sm">{step.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-base font-medium text-foreground mb-2">
                      Best Practices:
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {content.tabs["how-to-use"].bestPractices?.map((practice, index) => (
                        <li key={index}>• {practice}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>



              <TabsContent
                value="ai-system"
                className="mt-0 p-3 sm:p-4 bg-muted/20 rounded-lg"
              >
                <h3 className="text-base sm:text-lg font-semibold mb-3">{content.tabs["ai-system"].title}</h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>{content.tabs["ai-system"].description}</p>

                  <div className="space-y-4">
                    <h4 className="text-sm sm:text-base font-medium text-foreground">
                      AI-Powered Features:
                    </h4>

                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Smart Recommendations
                          </h5>
                          <ul className="text-sm space-y-1">
                            {(content.tabs["ai-system"].features as Record<string, string[]>)?.smartRecommendations?.map((feature: string, index: number) => (
                              <li key={index}>• {feature}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Predictive Analytics
                          </h5>
                          <ul className="text-sm space-y-1">
                            {(content.tabs["ai-system"].features as Record<string, string[]>)?.predictiveAnalytics?.map((feature: string, index: number) => (
                              <li key={index}>• {feature}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Intelligent Calculations
                          </h5>
                          <ul className="text-sm space-y-1">
                            {(content.tabs["ai-system"].features as Record<string, string[]>)?.intelligentCalculations?.map((feature: string, index: number) => (
                              <li key={index}>• {feature}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Quality Assurance
                          </h5>
                          <ul className="text-sm space-y-1">
                            {(content.tabs["ai-system"].features as Record<string, string[]>)?.qualityAssurance?.map((feature: string, index: number) => (
                              <li key={index}>• {feature}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-base font-medium text-foreground mb-2">
                      AI Learning & Improvement:
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {content.tabs["ai-system"].learning?.description}
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {content.tabs["ai-system"].learning?.dataSources?.map((source, index) => (
                        <li key={index}>
                          • <strong>{source.split(':')[0]}:</strong> {source.split(':')[1]}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-base font-medium text-foreground mb-2">
                      Getting the Most from AI:
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {content.tabs["ai-system"].gettingMostFromAI?.map((tip, index) => (
                        <li key={index}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="archive"
                className="mt-0 p-3 sm:p-4 bg-muted/20 rounded-lg"
              >
                <h3 className="text-base sm:text-lg font-semibold mb-3">{content.tabs.archive.title}</h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>{content.tabs.archive.description}</p>

                  <div className="space-y-4">
                    <h4 className="text-sm sm:text-base font-medium text-foreground">
                      Archive Features:
                    </h4>

                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Project Storage
                          </h5>
                          <ul className="text-sm space-y-1">
                            {(content.tabs.archive.features as Record<string, string[]>)?.projectStorage?.map((feature: string, index: number) => (
                              <li key={index}>• {feature}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Search & Retrieval
                          </h5>
                          <ul className="text-sm space-y-1">
                            {(content.tabs.archive.features as Record<string, string[]>)?.searchRetrieval?.map((feature: string, index: number) => (
                              <li key={index}>• {feature}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Data Management
                          </h5>
                          <ul className="text-sm space-y-1">
                            {(content.tabs.archive.features as Record<string, string[]>)?.dataManagement?.map((feature: string, index: number) => (
                              <li key={index}>• {feature}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Restoration & Reference
                          </h5>
                          <ul className="text-sm space-y-1">
                            {(content.tabs.archive.features as Record<string, string[]>)?.restorationReference?.map((feature: string, index: number) => (
                              <li key={index}>• {feature}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-base font-medium text-foreground mb-2">
                      Archive Workflow:
                    </h4>
                    <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
                      {content.tabs.archive.workflow?.map((step, index) => (
                        <div key={index} className="text-center">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-medium">
                            {index + 1}
                          </div>
                          <h5 className="font-medium text-foreground">
                            {step.step}
                          </h5>
                          <p className="text-sm text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-base font-medium text-foreground mb-2">
                      Best Practices:
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {content.tabs.archive.bestPractices?.map((practice, index) => (
                        <li key={index}>• {practice}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>

            </Tabs>
          </div>
          <DialogPrimitive.Close className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
    </TooltipProvider>
  );
}

export default TutorialGuideDialog;