"use client";

import Link from "next/link";
import RoofCalcLogo from "@/components/RoofCalcLogo";
import { ThemeToggle } from "@/components/theme-toggle";

interface AuthLayoutProps {
  children: React.ReactNode;
  brandingTitle: string;
  brandingDescription: string;
}

export default function AuthLayout({
  children,
  brandingTitle,
  brandingDescription,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        {children}
      </div>

      {/* Right side - Branding */}
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
              {brandingTitle}
            </h2>
            <p className="text-muted-foreground">{brandingDescription}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
