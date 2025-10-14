"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpRequestDialog } from "@/components/help-request-dialog";
import { HelpCircleIcon, UsersIcon, ClockIcon, CheckCircleIcon } from "lucide-react";

export default function RequestHelpContent() {
  return (
    <div className="px-3 sm:px-4 lg:px-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Request Help</h1>
          <p className="text-muted-foreground">
            Need assistance with your roofing project? Our contractors are here to help.
          </p>
        </div>

        {/* Main Help Request Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircleIcon className="h-5 w-5 text-primary" />
              Get Professional Assistance
            </CardTitle>
            <CardDescription>
              If you&apos;re having trouble with the calculator or need help creating your project, 
              our experienced contractors can assist you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Help Request Button */}
            <div className="flex justify-center">
              <HelpRequestDialog 
                trigger={
                  <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                    <HelpCircleIcon className="h-5 w-5" />
                    Request Contractor Help
                  </button>
                }
              />
            </div>

            {/* Information Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <UsersIcon className="h-8 w-8 text-primary" />
                    <h3 className="font-semibold">Expert Contractors</h3>
                    <p className="text-sm text-muted-foreground">
                      Get help from experienced roofing professionals
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <ClockIcon className="h-8 w-8 text-primary" />
                    <h3 className="font-semibold">Quick Response</h3>
                    <p className="text-sm text-muted-foreground">
                      Contractors will be notified immediately
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <CheckCircleIcon className="h-8 w-8 text-primary" />
                    <h3 className="font-semibold">Project Creation</h3>
                    <p className="text-sm text-muted-foreground">
                      They can create your project for you
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* How It Works */}
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="font-semibold mb-4">How it works:</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Click &quot;Request Contractor Help&quot;</p>
                    <p className="text-sm text-muted-foreground">Select a contractor and fill out the form with any specific questions or requirements</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Contractor gets notified</p>
                    <p className="text-sm text-muted-foreground">The selected contractor receives your request immediately</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Project gets created</p>
                    <p className="text-sm text-muted-foreground">A contractor will create your project and you&apos;ll be notified</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
