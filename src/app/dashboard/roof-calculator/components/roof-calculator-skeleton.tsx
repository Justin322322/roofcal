"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function RoofCalculatorSkeleton() {
  return (
    <>
      <div className="px-4 lg:px-6 flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-96" />
        <Skeleton className="h-9 w-20" />
      </div>

      <div className="px-4 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-5 w-32" />
                </CardTitle>
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-5 w-28" />
                </CardTitle>
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-28" />
                </CardTitle>
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-5 w-32" />
                </CardTitle>
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                  <Skeleton className="h-4 w-4" />
                </CardTitle>
                <Skeleton className="h-4 w-56" />
              </CardHeader>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <Skeleton className="h-5 w-36" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-7 w-20" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-px w-full" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-px w-full" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-px w-full" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-px w-full" />
                </div>

                <div className="space-y-2 bg-muted/50 -mx-6 px-6 py-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-px w-full" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-8 w-28" />
                  </div>
                </div>

                <Skeleton className="h-3 w-full mt-4" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-5 w-36" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-4 w-20" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-5/6" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
