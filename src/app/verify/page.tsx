import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import RoofCalcLogo from "@/components/RoofCalcLogo";
import { ThemeToggle } from "@/components/theme-toggle";
import VerifyCodeForm from "@/components/auth/verify-code-form";

function VerifyPageSkeleton() {
  return (
    <div className="min-h-screen flex">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Left side - Form Skeleton */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                <Skeleton className="h-8 w-48 mx-auto" />
              </CardTitle>
              <div className="text-center">
                <Skeleton className="h-4 w-64 mx-auto" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <div className="flex gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-12 rounded-md" />
                    ))}
                  </div>
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="mt-6">
                <Separator className="my-4" />
                <div className="text-center space-y-2">
                  <Skeleton className="h-4 w-40 mx-auto" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Branding (same as actual page) */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 bg-muted/50">
        <div className="flex flex-col items-center space-y-8 text-center">
          <Link
            href="/"
            className="flex items-center space-x-4 hover:opacity-80 transition-opacity"
          >
            <RoofCalcLogo className="w-16 h-16 text-primary" />
            <div className="text-left">
              <h1 className="text-4xl font-bold text-foreground">RoofCal</h1>
              <p className="text-lg text-muted-foreground">
                Professional Roof Calculator
              </p>
            </div>
          </Link>
          <div className="max-w-md space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Enter Your Verification Code
            </h2>
            <p className="text-muted-foreground">
              We&apos;ve sent a 6-digit OTP code to your email address. Enter
              it below to complete your account setup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <>
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <Suspense fallback={<VerifyPageSkeleton />}>
        <VerifyCodeForm />
      </Suspense>
    </>
  );
}
