"use client";

import * as React from "react";
import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import Image from "next/image";
import {
  X,
  BookOpenIcon,
  HomeIcon,
  LayersIcon,
  CalculatorIcon,
  ClipboardListIcon,
  HardHatIcon,
  SparklesIcon,
  KanbanSquareIcon,
  ArchiveIcon,
  CreditCardIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function TutorialGuideDialog() {
  const [selectedRoofType, setSelectedRoofType] = useState<string | null>(null);

  const getRoofTypeDetails = (type: string) => {
    const details = {
      gable: {
        name: "Gable Roof",
        description:
          "Simple triangular shape formed by two sloping sides meeting at a ridge. Most cost-effective and suitable for most climates.",
        bestFor:
          "Most residential applications, budget-conscious projects, areas with moderate weather",
        costRange: "₱4,500-6,700 per square meter",
        complexity: "Low - Simple construction and installation",
      },
      hip: {
        name: "Hip Roof",
        description:
          "Four sloping sides that meet at the top, providing excellent wind resistance and a more complex but elegant appearance.",
        bestFor: "High-wind areas, modern homes, architectural variety",
        costRange: "₱6,700-10,000 per square meter",
        complexity: "Medium - More complex framing and material requirements",
      },
      mansard: {
        name: "Mansard Roof",
        description:
          "French architectural style with steep lower slopes and flatter upper slopes, maximizing living space and providing distinctive character.",
        bestFor:
          "French colonial homes, maximizing attic space, historic renovations",
        costRange: "₱11,200-19,600 per square meter",
        complexity: "High - Complex framing and specialized installation",
      },
      shed: {
        name: "Shed Roof",
        description:
          "Single sloping plane that provides modern aesthetics and excellent water runoff. Simple construction with contemporary appeal.",
        bestFor: "Modern homes, additions, excellent water drainage needs",
        costRange: "₱5,000-7,800 per square meter",
        complexity: "Low - Simple single-slope construction",
      },
      gambrel: {
        name: "Gambrel Roof",
        description:
          "Two slopes per side, creating a barn-like appearance. Provides more space than a simple gable while maintaining structural simplicity.",
        bestFor:
          "Barn conversions, Dutch colonial homes, maximizing attic space",
        costRange: "₱8,400-14,000 per square meter",
        complexity: "Medium - More complex framing than simple gable",
      },
      "cross-gabled": {
        name: "Cross-Gabled Roof",
        description:
          "Multiple gables intersecting at different angles, creating complex valleys and architectural interest with varied rooflines.",
        bestFor:
          "Complex architectural designs, multi-wing homes, Victorian styles",
        costRange: "₱10,000-16,800 per square meter",
        complexity: "High - Complex valley installation and water management",
      },
      saltbox: {
        name: "Saltbox Roof",
        description:
          "Asymmetrical gable with one long sloping side and one short side, creating a distinctive colonial American appearance.",
        bestFor:
          "Colonial homes, historic renovations, unique architectural character",
        costRange: "₱6,700-11,200 per square meter",
        complexity: "Medium - Asymmetrical framing requirements",
      },
      butterfly: {
        name: "Butterfly Roof",
        description:
          "Inverted gable that creates a V-shape, allowing for unique drainage patterns and modern architectural expression.",
        bestFor: "Modern homes, rainwater collection, contemporary design",
        costRange: "₱11,200-22,400 per square meter",
        complexity: "High - Specialized drainage and structural requirements",
      },
    };
    return details[type as keyof typeof details] || details.gable;
  };

  return (
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
            "fixed left-[50%] top-[50%] z-50 w-full max-w-[98vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl translate-x-[-50%] translate-y-[-50%]",
            "border bg-background h-[85vh] flex flex-col p-0 gap-0 shadow-lg duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
          )}
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b">
            <DialogTitle className="text-xl font-semibold leading-none tracking-tight">
              RoofCal Tutorial Guide
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Complete guide to using RoofCal for accurate roof cost estimation
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            <Tabs defaultValue="overview" className="w-full">
              <div className="mb-6">
                <TabsList className="w-max min-w-full inline-flex h-auto p-1 bg-muted/50 rounded-lg gap-1">
                  <TabsTrigger
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                    value="overview"
                  >
                    <HomeIcon className="h-4 w-4" />
                    <span className="whitespace-nowrap">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                    value="roof-types"
                  >
                    <LayersIcon className="h-4 w-4" />
                    <span className="whitespace-nowrap">Roof Types</span>
                  </TabsTrigger>
                  <TabsTrigger
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                    value="materials"
                  >
                    <LayersIcon className="h-4 w-4" />
                    <span className="whitespace-nowrap">Materials</span>
                  </TabsTrigger>
                  <TabsTrigger
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                    value="calculator"
                  >
                    <CalculatorIcon className="h-4 w-4" />
                    <span className="whitespace-nowrap">Calculator</span>
                  </TabsTrigger>
                  <TabsTrigger
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                    value="manual-calc"
                  >
                    <ClipboardListIcon className="h-4 w-4" />
                    <span className="whitespace-nowrap">Manual Calc</span>
                  </TabsTrigger>
                  <TabsTrigger
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                    value="contractor"
                  >
                    <HardHatIcon className="h-4 w-4" />
                    <span className="whitespace-nowrap">Contractor</span>
                  </TabsTrigger>
                  <TabsTrigger
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                    value="ai-system"
                  >
                    <SparklesIcon className="h-4 w-4" />
                    <span className="whitespace-nowrap">AI System</span>
                  </TabsTrigger>
                  <TabsTrigger
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                    value="projects"
                  >
                    <KanbanSquareIcon className="h-4 w-4" />
                    <span className="whitespace-nowrap">Projects</span>
                  </TabsTrigger>
                  <TabsTrigger
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                    value="archive"
                  >
                    <ArchiveIcon className="h-4 w-4" />
                    <span className="whitespace-nowrap">Archive</span>
                  </TabsTrigger>
                  <TabsTrigger
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                    value="costs"
                  >
                    <CreditCardIcon className="h-4 w-4" />
                    <span className="whitespace-nowrap">Costs</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="overview"
                className="mt-0 p-4 bg-muted/20 rounded-lg"
              >
                <h3 className="text-lg font-semibold mb-3">
                  Welcome to RoofCal
                </h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    RoofCal is your comprehensive roofing cost estimation tool
                    designed for contractors, homeowners, and roofing
                    professionals. Our platform provides accurate calculations,
                    material recommendations, and project management features to
                    streamline your roofing projects.
                  </p>

                  <div className="space-y-3">
                    <h4 className="text-base font-medium text-foreground">
                      Key Features:
                    </h4>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>
                          <strong>Smart Calculator:</strong> AI-powered
                          calculations with multiple roof types and materials
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>
                          <strong>Project Management:</strong> Track and
                          organize all your roofing projects in one place
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>
                          <strong>Material Database:</strong> Comprehensive
                          material options with real-time pricing
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>
                          <strong>Export & Reports:</strong> Generate detailed
                          reports for clients and documentation
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>
                          <strong>Contractor Tools:</strong> Professional-grade
                          features for roofing businesses
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-base font-medium text-foreground mb-2">
                      Getting Started:
                    </h4>
                    <p className="text-sm">
                      Navigate through the tabs above to learn about specific
                      features. We recommend starting with the
                      &ldquo;Calculator&rdquo; tab to understand the core
                      estimation workflow, then exploring &ldquo;Projects&rdquo;
                      for management features.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="roof-types"
                className="mt-0 p-4 bg-muted/20 rounded-lg"
              >
                <h3 className="text-lg font-semibold mb-3">Roof Types</h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Understanding different roof types is crucial for accurate
                    cost estimation. Each roof type has unique characteristics,
                    material requirements, and installation complexity that
                    affect pricing.
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <h4 className="text-base font-medium text-foreground">
                        Common Residential Roofs:
                      </h4>
                      <div className="grid gap-3 grid-cols-2">
                        <div
                          className="border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow group"
                          onClick={() => setSelectedRoofType("gable")}
                        >
                          <div className="aspect-square bg-muted/30 rounded-lg mb-2 overflow-hidden group-hover:bg-muted/50 transition-colors">
                            <Image
                              src="/roof/gable.jpg"
                              alt="Gable Roof"
                              width={200}
                              height={200}
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-300"
                            />
                          </div>
                          <h5 className="font-medium text-foreground text-sm">
                            Gable Roof
                          </h5>
                          <p className="text-xs text-muted-foreground">
                            Simple triangular shape
                          </p>
                        </div>
                        <div
                          className="border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow group"
                          onClick={() => setSelectedRoofType("hip")}
                        >
                          <div className="aspect-square bg-muted/30 rounded-lg mb-2 overflow-hidden group-hover:bg-muted/50 transition-colors">
                            <Image
                              src="/roof/hip-roof.avif"
                              alt="Hip Roof"
                              width={200}
                              height={200}
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-300"
                            />
                          </div>
                          <h5 className="font-medium text-foreground text-sm">
                            Hip Roof
                          </h5>
                          <p className="text-xs text-muted-foreground">
                            Four sloping sides
                          </p>
                        </div>
                        <div
                          className="border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow group"
                          onClick={() => setSelectedRoofType("mansard")}
                        >
                          <div className="aspect-square bg-muted/30 rounded-lg mb-2 overflow-hidden group-hover:bg-muted/50 transition-colors">
                            <Image
                              src="/roof/mansard-roof.webp"
                              alt="Mansard Roof"
                              width={200}
                              height={200}
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-300"
                            />
                          </div>
                          <h5 className="font-medium text-foreground text-sm">
                            Mansard Roof
                          </h5>
                          <p className="text-xs text-muted-foreground">
                            French style design
                          </p>
                        </div>
                        <div
                          className="border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow group"
                          onClick={() => setSelectedRoofType("shed")}
                        >
                          <div className="aspect-square bg-muted/30 rounded-lg mb-2 overflow-hidden group-hover:bg-muted/50 transition-colors">
                            <Image
                              src="/roof/shed-roof.jpg"
                              alt="Shed Roof"
                              width={200}
                              height={200}
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-300"
                            />
                          </div>
                          <h5 className="font-medium text-foreground text-sm">
                            Shed Roof
                          </h5>
                          <p className="text-xs text-muted-foreground">
                            Single sloping plane
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-base font-medium text-foreground">
                        Complex Roofs:
                      </h4>
                      <div className="grid gap-3 grid-cols-2">
                        <div
                          className="border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow group"
                          onClick={() => setSelectedRoofType("gambrel")}
                        >
                          <div className="aspect-square bg-muted/30 rounded-lg mb-2 overflow-hidden group-hover:bg-muted/50 transition-colors">
                            <Image
                              src="/roof/gabrel-roof.png"
                              alt="Gambrel Roof"
                              width={200}
                              height={200}
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-300"
                            />
                          </div>
                          <h5 className="font-medium text-foreground text-sm">
                            Gambrel Roof
                          </h5>
                          <p className="text-xs text-muted-foreground">
                            Barn-style design
                          </p>
                        </div>
                        <div
                          className="border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow group"
                          onClick={() => setSelectedRoofType("cross-gabled")}
                        >
                          <div className="aspect-square bg-muted/30 rounded-lg mb-2 overflow-hidden group-hover:bg-muted/50 transition-colors">
                            <Image
                              src="/roof/cross-gabled.jpeg"
                              alt="Cross-Gabled Roof"
                              width={200}
                              height={200}
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-300"
                            />
                          </div>
                          <h5 className="font-medium text-foreground text-sm">
                            Cross-Gabled
                          </h5>
                          <p className="text-xs text-muted-foreground">
                            Multiple gables
                          </p>
                        </div>
                        <div
                          className="border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow group"
                          onClick={() => setSelectedRoofType("saltbox")}
                        >
                          <div className="aspect-square bg-muted/30 rounded-lg mb-2 overflow-hidden group-hover:bg-muted/50 transition-colors">
                            <Image
                              src="/roof/salt-box.webp"
                              alt="Saltbox Roof"
                              width={200}
                              height={200}
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-300"
                            />
                          </div>
                          <h5 className="font-medium text-foreground text-sm">
                            Saltbox Roof
                          </h5>
                          <p className="text-xs text-muted-foreground">
                            Asymmetrical gable
                          </p>
                        </div>
                        <div
                          className="border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow group"
                          onClick={() => setSelectedRoofType("butterfly")}
                        >
                          <div className="aspect-square bg-muted/30 rounded-lg mb-2 overflow-hidden group-hover:bg-muted/50 transition-colors">
                            <Image
                              src="/roof/buttlefly-roof.avif"
                              alt="Butterfly Roof"
                              width={200}
                              height={200}
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-300"
                            />
                          </div>
                          <h5 className="font-medium text-foreground text-sm">
                            Butterfly Roof
                          </h5>
                          <p className="text-xs text-muted-foreground">
                            Inverted gable
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Roof Type Information */}
                  {selectedRoofType && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-4">
                      <h4 className="text-base font-medium text-foreground mb-3">
                        {getRoofTypeDetails(selectedRoofType).name} - Detailed
                        Information
                      </h4>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <strong>Description:</strong>{" "}
                          {getRoofTypeDetails(selectedRoofType).description}
                        </p>
                        <p className="text-sm">
                          <strong>Best For:</strong>{" "}
                          {getRoofTypeDetails(selectedRoofType).bestFor}
                        </p>
                        <p className="text-sm">
                          <strong>Cost Range:</strong>{" "}
                          {getRoofTypeDetails(selectedRoofType).costRange}
                        </p>
                        <p className="text-sm">
                          <strong>Complexity:</strong>{" "}
                          {getRoofTypeDetails(selectedRoofType).complexity}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-base font-medium text-foreground mb-2">
                      Selection Tips:
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        • Consider local climate conditions and weather patterns
                      </li>
                      <li>• Factor in architectural style compatibility</li>
                      <li>
                        • Evaluate maintenance requirements and accessibility
                      </li>
                      <li>• Check local building codes and HOA restrictions</li>
                      <li>• Consider future expansion or modification needs</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="materials"
                className="mt-0 p-4 bg-muted/20 rounded-lg"
              >
                <h3 className="text-lg font-semibold mb-3">Materials</h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Choosing the right roofing material is crucial for
                    longevity, cost-effectiveness, and aesthetic appeal. Each
                    material has unique properties, installation requirements,
                    and cost implications.
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="text-base font-medium text-foreground mb-2">
                          Asphalt Shingles
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Cost:</strong> ₱4,500-6,700 per square meter
                          </p>
                          <p>
                            <strong>Lifespan:</strong> 15-30 years
                          </p>
                          <p>
                            <strong>Pros:</strong> Affordable, easy
                            installation, variety of colors
                          </p>
                          <p>
                            <strong>Cons:</strong> Shorter lifespan, weather
                            sensitive
                          </p>
                          <p>
                            <strong>Best for:</strong> Most residential
                            applications, budget-conscious projects
                          </p>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="text-base font-medium text-foreground mb-2">
                          Metal Roofing
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Cost:</strong> ₱6,700-50,400 per square
                            meter
                          </p>
                          <p>
                            <strong>Lifespan:</strong> 40-70 years
                          </p>
                          <p>
                            <strong>Pros:</strong> Durable, energy efficient,
                            recyclable
                          </p>
                          <p>
                            <strong>Cons:</strong> Higher initial cost, noise
                            during rain
                          </p>
                          <p>
                            <strong>Best for:</strong> Long-term investments,
                            modern aesthetics
                          </p>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="text-base font-medium text-foreground mb-2">
                          Clay Tiles
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Cost:</strong> ₱16,800-28,000 per square
                            meter
                          </p>
                          <p>
                            <strong>Lifespan:</strong> 50-100 years
                          </p>
                          <p>
                            <strong>Pros:</strong> Fire resistant, energy
                            efficient, timeless appeal
                          </p>
                          <p>
                            <strong>Cons:</strong> Heavy, requires strong
                            structure, fragile
                          </p>
                          <p>
                            <strong>Best for:</strong> Mediterranean/Spanish
                            style homes, warm climates
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="text-base font-medium text-foreground mb-2">
                          Slate
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Cost:</strong> ₱33,600-84,000 per square
                            meter
                          </p>
                          <p>
                            <strong>Lifespan:</strong> 75-200 years
                          </p>
                          <p>
                            <strong>Pros:</strong> Extremely durable, fire
                            resistant, natural beauty
                          </p>
                          <p>
                            <strong>Cons:</strong> Very heavy, expensive,
                            requires skilled installation
                          </p>
                          <p>
                            <strong>Best for:</strong> Premium homes, historic
                            restoration
                          </p>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="text-base font-medium text-foreground mb-2">
                          Wood Shingles/Shakes
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Cost:</strong> ₱22,400-39,200 per square
                            meter
                          </p>
                          <p>
                            <strong>Lifespan:</strong> 30-50 years
                          </p>
                          <p>
                            <strong>Pros:</strong> Natural beauty, good
                            insulation, renewable
                          </p>
                          <p>
                            <strong>Cons:</strong> Fire risk, maintenance
                            required, insect prone
                          </p>
                          <p>
                            <strong>Best for:</strong> Rustic/cottage styles,
                            forested areas
                          </p>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="text-base font-medium text-foreground mb-2">
                          Synthetic Materials
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Cost:</strong> ₱11,200-33,600 per square
                            meter
                          </p>
                          <p>
                            <strong>Lifespan:</strong> 30-50 years
                          </p>
                          <p>
                            <strong>Pros:</strong> Lightweight, versatile,
                            weather resistant
                          </p>
                          <p>
                            <strong>Cons:</strong> Newer technology, varying
                            quality
                          </p>
                          <p>
                            <strong>Best for:</strong> Eco-conscious projects,
                            modern designs
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-base font-medium text-foreground mb-2">
                      Material Selection Guide:
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        • <strong>Climate:</strong> Consider local weather
                        patterns and temperature extremes
                      </li>
                      <li>
                        • <strong>Budget:</strong> Factor in initial cost vs.
                        long-term value
                      </li>
                      <li>
                        • <strong>Structure:</strong> Ensure your roof can
                        support the material weight
                      </li>
                      <li>
                        • <strong>Maintenance:</strong> Consider ongoing care
                        requirements
                      </li>
                      <li>
                        • <strong>Energy Efficiency:</strong> Look for materials
                        that reduce heating/cooling costs
                      </li>
                      <li>
                        • <strong>Local Codes:</strong> Check building
                        regulations and fire safety requirements
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="calculator"
                className="mt-0 p-4 bg-muted/20 rounded-lg"
              >
                <h3 className="text-lg font-semibold mb-3">Calculator</h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    The RoofCal calculator is the heart of our platform,
                    providing accurate cost estimates through an intuitive
                    step-by-step process. Follow this guide to maximize accuracy
                    and efficiency.
                  </p>

                  <div className="space-y-4">
                    <h4 className="text-base font-medium text-foreground">
                      Step-by-Step Workflow:
                    </h4>

                    <div className="space-y-4">
                      <div className="border-l-4 border-primary pl-4">
                        <h5 className="font-medium text-foreground">
                          Step 1: Project Information
                        </h5>
                        <p className="text-sm mt-1">
                          Enter basic project details including project name,
                          location, and description. Location helps determine
                          regional pricing and climate considerations.
                        </p>
                      </div>

                      <div className="border-l-4 border-primary pl-4">
                        <h5 className="font-medium text-foreground">
                          Step 2: Roof Type Selection
                        </h5>
                        <p className="text-sm mt-1">
                          Choose from our comprehensive list of roof types. The
                          system automatically adjusts calculations based on
                          complexity and material requirements.
                        </p>
                      </div>

                      <div className="border-l-4 border-primary pl-4">
                        <h5 className="font-medium text-foreground">
                          Step 3: Measurements
                        </h5>
                        <p className="text-sm mt-1">
                          Input roof dimensions using our measurement tools:
                        </p>
                        <ul className="text-sm ml-4 mt-2 space-y-1">
                          <li>
                            • <strong>Length & Width:</strong> Basic rectangular
                            measurements
                          </li>
                          <li>
                            • <strong>Pitch/Slope:</strong> Roof angle for
                            accurate surface area calculation
                          </li>
                          <li>
                            • <strong>Complex Shapes:</strong> Break down into
                            sections for irregular roofs
                          </li>
                          <li>
                            • <strong>Waste Factor:</strong> Automatic 10-15%
                            addition for cuts and overlaps
                          </li>
                        </ul>
                      </div>

                      <div className="border-l-4 border-primary pl-4">
                        <h5 className="font-medium text-foreground">
                          Step 4: Material Selection
                        </h5>
                        <p className="text-sm mt-1">
                          Choose roofing materials with real-time pricing
                          updates. Compare options with cost breakdowns and
                          lifespan projections.
                        </p>
                      </div>

                      <div className="border-l-4 border-primary pl-4">
                        <h5 className="font-medium text-foreground">
                          Step 5: Labor & Additional Costs
                        </h5>
                        <p className="text-sm mt-1">
                          Configure labor rates, permit costs, and additional
                          features like:
                        </p>
                        <ul className="text-sm ml-4 mt-2 space-y-1">
                          <li>• Underlayment and insulation</li>
                          <li>• Gutters and downspouts</li>
                          <li>• Ventilation systems</li>
                          <li>• Skylights and roof access</li>
                        </ul>
                      </div>

                      <div className="border-l-4 border-primary pl-4">
                        <h5 className="font-medium text-foreground">
                          Step 6: Review & Export
                        </h5>
                        <p className="text-sm mt-1">
                          Review the detailed cost breakdown, save the project,
                          and export professional reports for clients or
                          documentation.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-base font-medium text-foreground mb-2">
                      Pro Tips for Accurate Calculations:
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        • <strong>Measure Twice:</strong> Double-check all
                        dimensions for accuracy
                      </li>
                      <li>
                        • <strong>Account for Complexity:</strong> Include
                        dormers, valleys, and architectural features
                      </li>
                      <li>
                        • <strong>Consider Access:</strong> Factor in
                        scaffolding or equipment rental costs
                      </li>
                      <li>
                        • <strong>Local Factors:</strong> Include permit fees
                        and local labor rates
                      </li>
                      <li>
                        • <strong>Seasonal Pricing:</strong> Material costs may
                        vary by season and demand
                      </li>
                    </ul>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-base font-medium text-foreground mb-2">
                      Advanced Features:
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        • <strong>Multiple Quotes:</strong> Compare different
                        material and contractor options
                      </li>
                      <li>
                        • <strong>Cost History:</strong> Track pricing trends
                        and seasonal variations
                      </li>
                      <li>
                        • <strong>What-If Analysis:</strong> Test different
                        scenarios and material combinations
                      </li>
                      <li>
                        • <strong>Integration:</strong> Connect with contractor
                        networks for real-time quotes
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="manual-calc"
                className="mt-0 p-4 bg-muted/20 rounded-lg"
              >
                <h3 className="text-lg font-semibold mb-3">
                  Manual Calculator
                </h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    The manual calculator provides advanced users with precise
                    control over calculations for complex or unique roofing
                    scenarios that require custom measurements and specialized
                    considerations.
                  </p>

                  <div className="space-y-4">
                    <h4 className="text-base font-medium text-foreground">
                      When to Use Manual Calculator:
                    </h4>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>
                          Complex roof geometries with multiple intersecting
                          planes
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>
                          Historical or architectural restoration projects
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>
                          Commercial buildings with unique structural
                          requirements
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>
                          When you have precise architectural drawings or
                          surveys
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <h4 className="text-base font-medium text-foreground">
                        Manual Entry Options:
                      </h4>
                      <div className="space-y-2">
                        <div className="border rounded-lg p-3">
                          <h5 className="font-medium text-foreground">
                            Surface Area Input
                          </h5>
                          <p className="text-sm">
                            Direct entry of calculated roof surface area in
                            square feet
                          </p>
                        </div>
                        <div className="border rounded-lg p-3">
                          <h5 className="font-medium text-foreground">
                            Section-by-Section
                          </h5>
                          <p className="text-sm">
                            Break complex roofs into manageable sections
                          </p>
                        </div>
                        <div className="border rounded-lg p-3">
                          <h5 className="font-medium text-foreground">
                            Custom Waste Factors
                          </h5>
                          <p className="text-sm">
                            Override default waste percentages for specific
                            materials
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-base font-medium text-foreground">
                        Advanced Features:
                      </h4>
                      <div className="space-y-2">
                        <div className="border rounded-lg p-3">
                          <h5 className="font-medium text-foreground">
                            Material Overrides
                          </h5>
                          <p className="text-sm">
                            Custom pricing for specialty or imported materials
                          </p>
                        </div>
                        <div className="border rounded-lg p-3">
                          <h5 className="font-medium text-foreground">
                            Labor Adjustments
                          </h5>
                          <p className="text-sm">
                            Fine-tune labor rates for specific skill
                            requirements
                          </p>
                        </div>
                        <div className="border rounded-lg p-3">
                          <h5 className="font-medium text-foreground">
                            Custom Formulas
                          </h5>
                          <p className="text-sm">
                            Apply specialized calculation methods for unique
                            scenarios
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-base font-medium text-foreground mb-2">
                      Best Practices:
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        • Verify all measurements with professional surveys when
                        possible
                      </li>
                      <li>
                        • Document assumptions and calculation methods for
                        future reference
                      </li>
                      <li>
                        • Include contingency factors for unknown variables
                      </li>
                      <li>
                        • Cross-reference manual calculations with standard
                        estimates
                      </li>
                      <li>
                        • Consult with structural engineers for complex
                        architectural features
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="contractor"
                className="mt-0 p-4 bg-muted/20 rounded-lg"
              >
                <h3 className="text-lg font-semibold mb-3">Contractor Tools</h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Professional contractor features designed to streamline your
                    roofing business operations, improve client relationships,
                    and maximize profitability through advanced tools and
                    integrations.
                  </p>

                  <div className="space-y-4">
                    <h4 className="text-base font-medium text-foreground">
                      Professional Features:
                    </h4>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Business Management
                          </h5>
                          <ul className="text-sm space-y-1">
                            <li>• Multi-project portfolio management</li>
                            <li>• Team member access and permissions</li>
                            <li>• Client relationship management (CRM)</li>
                            <li>• Lead tracking and conversion analytics</li>
                          </ul>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Pricing & Estimates
                          </h5>
                          <ul className="text-sm space-y-1">
                            <li>
                              • Custom labor rates by region and skill level
                            </li>
                            <li>• Material markup and discount management</li>
                            <li>• Competitive pricing analysis</li>
                            <li>• Profit margin tracking and optimization</li>
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Client Communication
                          </h5>
                          <ul className="text-sm space-y-1">
                            <li>• Professional proposal generation</li>
                            <li>• Client portal for project visibility</li>
                            <li>
                              • Automated status updates and notifications
                            </li>
                            <li>
                              • Digital signature collection for contracts
                            </li>
                          </ul>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Reporting & Analytics
                          </h5>
                          <ul className="text-sm space-y-1">
                            <li>• Revenue and profit analytics</li>
                            <li>• Project completion time tracking</li>
                            <li>• Material usage and waste analysis</li>
                            <li>• Customer satisfaction metrics</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-base font-medium text-foreground mb-2">
                      Advanced Integrations:
                    </h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <h5 className="font-medium text-foreground mb-2">
                          Business Tools:
                        </h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• QuickBooks and accounting software sync</li>
                          <li>• CRM platform integrations</li>
                          <li>• Calendar and scheduling tools</li>
                          <li>• Email marketing automation</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-foreground mb-2">
                          Industry Resources:
                        </h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Material supplier APIs and pricing</li>
                          <li>• Weather monitoring for project planning</li>
                          <li>• Building permit database access</li>
                          <li>• Insurance and warranty tracking</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-base font-medium text-foreground mb-2">
                      Contractor Benefits:
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        • <strong>Increased Efficiency:</strong> Streamline
                        workflows and reduce administrative overhead
                      </li>
                      <li>
                        • <strong>Better Client Relations:</strong> Professional
                        presentations and transparent communication
                      </li>
                      <li>
                        • <strong>Improved Profitability:</strong> Accurate
                        pricing and margin optimization
                      </li>
                      <li>
                        • <strong>Competitive Advantage:</strong> Advanced tools
                        that set you apart from competitors
                      </li>
                      <li>
                        • <strong>Scalability:</strong> Tools that grow with
                        your business
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="ai-system"
                className="mt-0 p-4 bg-muted/20 rounded-lg"
              >
                <h3 className="text-lg font-semibold mb-3">AI System</h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Our advanced AI system leverages machine learning and
                    industry data to provide intelligent recommendations,
                    optimize estimates, and enhance your roofing project
                    planning with data-driven insights.
                  </p>

                  <div className="space-y-4">
                    <h4 className="text-base font-medium text-foreground">
                      AI-Powered Features:
                    </h4>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Smart Recommendations
                          </h5>
                          <ul className="text-sm space-y-1">
                            <li>
                              • Optimal material selection based on climate and
                              budget
                            </li>
                            <li>
                              • Labor time estimates using historical project
                              data
                            </li>
                            <li>
                              • Cost optimization suggestions for better margins
                            </li>
                            <li>
                              • Risk assessment for complex architectural
                              features
                            </li>
                          </ul>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Predictive Analytics
                          </h5>
                          <ul className="text-sm space-y-1">
                            <li>• Material price trend forecasting</li>
                            <li>• Seasonal demand and pricing patterns</li>
                            <li>• Project timeline optimization</li>
                            <li>• Weather impact on project scheduling</li>
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Intelligent Calculations
                          </h5>
                          <ul className="text-sm space-y-1">
                            <li>• Automatic waste factor adjustments</li>
                            <li>
                              • Complex geometry surface area calculations
                            </li>
                            <li>
                              • Material overlap and installation optimization
                            </li>
                            <li>
                              • Structural load and wind resistance analysis
                            </li>
                          </ul>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Quality Assurance
                          </h5>
                          <ul className="text-sm space-y-1">
                            <li>
                              • Error detection and correction suggestions
                            </li>
                            <li>• Best practice recommendations</li>
                            <li>• Code compliance verification</li>
                            <li>• Safety protocol reminders</li>
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
                      Our AI system continuously learns from project data,
                      industry trends, and user feedback to provide increasingly
                      accurate and valuable insights.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        • <strong>Data Sources:</strong> Industry databases,
                        weather patterns, material pricing, and project outcomes
                      </li>
                      <li>
                        • <strong>User Feedback:</strong> Incorporates
                        contractor input to refine recommendations
                      </li>
                      <li>
                        • <strong>Regional Adaptation:</strong> Learns local
                        market conditions and pricing patterns
                      </li>
                      <li>
                        • <strong>Continuous Updates:</strong> Regular model
                        improvements and feature enhancements
                      </li>
                    </ul>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-base font-medium text-foreground mb-2">
                      Getting the Most from AI:
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        • Provide detailed project information for better
                        recommendations
                      </li>
                      <li>• Review and provide feedback on AI suggestions</li>
                      <li>
                        • Use historical project data to train the system for
                        your specific needs
                      </li>
                      <li>
                        • Stay updated with new AI features and capabilities
                      </li>
                      <li>
                        • Combine AI insights with your professional expertise
                        for optimal results
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="projects"
                className="mt-0 p-4 bg-muted/20 rounded-lg"
              >
                <h3 className="text-lg font-semibold mb-3">Projects</h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    The Project Management system helps you organize, track, and
                    manage all your roofing projects from initial estimate to
                    completion. Keep detailed records and generate professional
                    reports for clients.
                  </p>

                  <div className="space-y-4">
                    <h4 className="text-base font-medium text-foreground">
                      Project Management Features:
                    </h4>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Project Organization
                          </h5>
                          <ul className="text-sm space-y-1">
                            <li>• Create and categorize projects by status</li>
                            <li>
                              • Add detailed project descriptions and notes
                            </li>
                            <li>• Set project priorities and deadlines</li>
                            <li>• Link related estimates and calculations</li>
                          </ul>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Progress Tracking
                          </h5>
                          <ul className="text-sm space-y-1">
                            <li>
                              • Update project status (Active, Completed, On
                              Hold)
                            </li>
                            <li>• Track milestone completion</li>
                            <li>• Monitor budget vs. actual costs</li>
                            <li>• Record timeline and scheduling updates</li>
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Documentation
                          </h5>
                          <ul className="text-sm space-y-1">
                            <li>• Store project photos and documentation</li>
                            <li>• Generate professional client reports</li>
                            <li>• Export detailed cost breakdowns</li>
                            <li>• Create project summaries and invoices</li>
                          </ul>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Collaboration
                          </h5>
                          <ul className="text-sm space-y-1">
                            <li>• Share projects with team members</li>
                            <li>• Client portal for project visibility</li>
                            <li>• Comment and communication tracking</li>
                            <li>• Approval workflows and signatures</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-base font-medium text-foreground mb-2">
                      Project Workflow:
                    </h4>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-medium">
                          1
                        </div>
                        <h5 className="font-medium text-foreground">
                          Create Project
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          Set up new project with basic information and initial
                          estimate
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-medium">
                          2
                        </div>
                        <h5 className="font-medium text-foreground">
                          Track Progress
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          Monitor status, update estimates, and manage timeline
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-medium">
                          3
                        </div>
                        <h5 className="font-medium text-foreground">
                          Complete & Archive
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          Finalize documentation and archive for future
                          reference
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-base font-medium text-foreground mb-2">
                      Pro Tips:
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        • Use consistent naming conventions for easy project
                        identification
                      </li>
                      <li>
                        • Regularly update project status to maintain accurate
                        records
                      </li>
                      <li>
                        • Export project data regularly for backup and reporting
                        purposes
                      </li>
                      <li>
                        • Utilize search and filter features to quickly locate
                        specific projects
                      </li>
                      <li>
                        • Set up project templates for common project types
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="archive"
                className="mt-0 p-4 bg-muted/20 rounded-lg"
              >
                <h3 className="text-lg font-semibold mb-3">Archive</h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    The Archive system provides secure storage and easy access
                    to completed projects, historical estimates, and reference
                    materials. Maintain organized records for future reference,
                    analysis, and client support.
                  </p>

                  <div className="space-y-4">
                    <h4 className="text-base font-medium text-foreground">
                      Archive Features:
                    </h4>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Project Storage
                          </h5>
                          <ul className="text-sm space-y-1">
                            <li>• Automatic archiving of completed projects</li>
                            <li>
                              • Manual archiving for inactive or cancelled
                              projects
                            </li>
                            <li>
                              • Bulk archive operations for project cleanup
                            </li>
                            <li>• Archive by date range or project status</li>
                          </ul>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Search & Retrieval
                          </h5>
                          <ul className="text-sm space-y-1">
                            <li>
                              • Advanced search by project name, date, or client
                            </li>
                            <li>
                              • Filter by material type, roof style, or cost
                              range
                            </li>
                            <li>
                              • Quick access to recently archived projects
                            </li>
                            <li>
                              • Export archived data for external analysis
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Data Management
                          </h5>
                          <ul className="text-sm space-y-1">
                            <li>
                              • Secure cloud storage with backup protection
                            </li>
                            <li>• Data retention policies and compliance</li>
                            <li>• Regular backup and recovery procedures</li>
                            <li>• Privacy controls and access permissions</li>
                          </ul>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Restoration & Reference
                          </h5>
                          <ul className="text-sm space-y-1">
                            <li>
                              • Restore archived projects to active status
                            </li>
                            <li>
                              • Create new projects from archived templates
                            </li>
                            <li>
                              • Reference historical pricing and material data
                            </li>
                            <li>
                              • Generate reports from archived project data
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-base font-medium text-foreground mb-2">
                      Archive Workflow:
                    </h4>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-medium">
                          1
                        </div>
                        <h5 className="font-medium text-foreground">
                          Archive Projects
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          Move completed or inactive projects to archive
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-medium">
                          2
                        </div>
                        <h5 className="font-medium text-foreground">
                          Organize & Search
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          Use filters and search to find archived projects
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-medium">
                          3
                        </div>
                        <h5 className="font-medium text-foreground">
                          Restore or Reference
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          Access data for new projects or client support
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-base font-medium text-foreground mb-2">
                      Best Practices:
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        • Archive projects regularly to keep active workspace
                        organized
                      </li>
                      <li>
                        • Use descriptive project names and tags for easy
                        retrieval
                      </li>
                      <li>
                        • Review archived projects periodically for pricing
                        trends
                      </li>
                      <li>• Maintain archive backups for data security</li>
                      <li>
                        • Set up automatic archiving rules for completed
                        projects
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="costs"
                className="mt-0 p-4 bg-muted/20 rounded-lg"
              >
                <h3 className="text-lg font-semibold mb-3">Cost Settings</h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Customize pricing parameters to ensure accurate,
                    region-specific estimates. Configure material costs, labor
                    rates, and regional adjustments to reflect your local market
                    conditions and business requirements.
                  </p>

                  <div className="space-y-4">
                    <h4 className="text-base font-medium text-foreground">
                      Cost Configuration:
                    </h4>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Material Pricing
                          </h5>
                          <ul className="text-sm space-y-1">
                            <li>• Base material costs by type and grade</li>
                            <li>
                              • Regional pricing adjustments and multipliers
                            </li>
                            <li>
                              • Bulk purchase discounts and volume pricing
                            </li>
                            <li>• Seasonal pricing variations and trends</li>
                          </ul>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Labor Rates
                          </h5>
                          <ul className="text-sm space-y-1">
                            <li>• Hourly rates by skill level and specialty</li>
                            <li>
                              • Regional wage adjustments and cost of living
                            </li>
                            <li>• Overtime and weekend premium rates</li>
                            <li>• Travel time and mobilization costs</li>
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Additional Costs
                          </h5>
                          <ul className="text-sm space-y-1">
                            <li>• Equipment rental and tool costs</li>
                            <li>• Permit fees and inspection costs</li>
                            <li>• Waste disposal and cleanup fees</li>
                            <li>• Insurance and bonding requirements</li>
                          </ul>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-2">
                            Markup & Margins
                          </h5>
                          <ul className="text-sm space-y-1">
                            <li>
                              • Standard markup percentages by project type
                            </li>
                            <li>• Profit margin targets and analysis</li>
                            <li>• Competitive pricing adjustments</li>
                            <li>• Volume discount structures</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-base font-medium text-foreground mb-2">
                      Regional Customization:
                    </h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <h5 className="font-medium text-foreground mb-2">
                          Location Factors:
                        </h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Climate and weather considerations</li>
                          <li>• Local building codes and requirements</li>
                          <li>• Accessibility and terrain factors</li>
                          <li>• Economic conditions and market demand</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-foreground mb-2">
                          Market Data:
                        </h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Competitor pricing analysis</li>
                          <li>• Supplier network and availability</li>
                          <li>• Labor market conditions</li>
                          <li>• Regulatory and compliance costs</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-base font-medium text-foreground mb-2">
                      Important Considerations:
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        • <strong>Regular Updates:</strong> Keep pricing current
                        with market fluctuations
                      </li>
                      <li>
                        • <strong>Accuracy:</strong> Verify costs with local
                        suppliers and contractors
                      </li>
                      <li>
                        • <strong>Competitiveness:</strong> Balance
                        profitability with market positioning
                      </li>
                      <li>
                        • <strong>Documentation:</strong> Maintain records of
                        pricing decisions and changes
                      </li>
                      <li>
                        • <strong>Review Cycles:</strong> Establish regular
                        pricing review schedules
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default TutorialGuideDialog;
