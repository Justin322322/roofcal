"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
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
  DollarSignIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export function TutorialGuideDialog() {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        <button
          className={cn(
            "min-w-8 bg-primary text-primary-foreground duration-200 ease-linear",
            "hover:bg-primary/90 hover:text-primary-foreground",
            "active:bg-primary/90 active:text-primary-foreground",
            "inline-flex items-center gap-2 h-9 px-3 rounded-md text-sm font-medium"
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
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-[98vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl translate-x-[-50%] translate-y-[-50%] gap-4",
            "border bg-background p-6 shadow-lg duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
          )}
        >
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <DialogTitle className="text-lg font-semibold leading-none tracking-tight">
              RoofCal tutorial guide
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Complete guide to using RoofCal for accurate roof cost estimation
            </p>
          </div>
          <div className="max-h-[75vh] overflow-hidden flex flex-col">
            <Tabs defaultValue="overview" className="w-full flex flex-col">
              <div className="overflow-x-auto overflow-y-hidden">
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
                    <DollarSignIcon className="h-4 w-4" />
                    <span className="whitespace-nowrap">Costs</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto mt-4">
                <TabsContent value="overview" className="mt-0 p-4 bg-muted/20 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Welcome to RoofCal</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    RoofCal is your comprehensive roofing cost estimation tool. Navigate through the tabs above to learn about specific features and workflows.
                  </p>
                </TabsContent>

                <TabsContent value="roof-types" className="mt-0 p-4 bg-muted/20 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Roof Types</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Guidance on selecting roof types for your projects. Choose from various architectural styles and configurations.
                  </p>
                </TabsContent>

                <TabsContent value="materials" className="mt-0 p-4 bg-muted/20 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Materials</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Explore material options and trade-offs. Compare durability, cost, and aesthetic considerations for different roofing materials.
                  </p>
                </TabsContent>

                <TabsContent value="calculator" className="mt-0 p-4 bg-muted/20 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Calculator</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Learn how to use the primary calculator workflow for accurate roof measurements and cost estimates.
                  </p>
                </TabsContent>

                <TabsContent value="manual-calc" className="mt-0 p-4 bg-muted/20 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Manual Calculator</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Use manual entry for custom scenarios when you have specific measurements or unique project requirements.
                  </p>
                </TabsContent>

                <TabsContent value="contractor" className="mt-0 p-4 bg-muted/20 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Contractor Tools</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Access contractor-specific settings and features designed for professional roofing contractors.
                  </p>
                </TabsContent>

                <TabsContent value="ai-system" className="mt-0 p-4 bg-muted/20 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">AI System</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Get intelligent suggestions and tips powered by AI to optimize your roofing estimates and project planning.
                  </p>
                </TabsContent>

                <TabsContent value="projects" className="mt-0 p-4 bg-muted/20 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Projects</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Manage your active roofing projects. Track progress, update estimates, and organize project documentation.
                  </p>
                </TabsContent>

                <TabsContent value="archive" className="mt-0 p-4 bg-muted/20 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Archive</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    View and restore archived calculations and past projects for reference or reuse.
                  </p>
                </TabsContent>

                <TabsContent value="costs" className="mt-0 p-4 bg-muted/20 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Cost Settings</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Customize material costs, labor rates, and regional pricing to ensure accurate estimates for your area.
                  </p>
                </TabsContent>
              </div>
            </Tabs>
          </div>
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export default TutorialGuideDialog


