"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import RoofCalcLogo from "@/components/RoofCalcLogo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, X } from "lucide-react";
import { toast } from "sonner";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleAboutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.info("About page coming soon!", {
      description: "We're working on this section. Stay tuned!",
    });
  };

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <Link
            href="#home"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <RoofCalcLogo className="w-8 h-8 text-primary" />
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">RoofCal</h1>
            </div>
          </Link>
          <nav className="hidden md:flex gap-8 flex-1 justify-center">
            <a
              href="#calculator"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              Calculator
            </a>
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              Features
            </a>
            <a
              href="#about"
              onClick={handleAboutClick}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium cursor-pointer"
            >
              About
            </a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Button variant="accent" size="sm" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
          {/* Mobile dropdown panel below navbar */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
      {mobileOpen && (
        <>
          {/* Blur backdrop overlay - excludes navigation area */}
          <div
            className="md:hidden fixed left-0 right-0 top-[73px] bottom-0 bg-background/20 backdrop-blur-sm z-10"
            onClick={() => setMobileOpen(false)}
          />

          {/* Mobile menu panel */}
          <div className="md:hidden absolute left-0 right-0 top-full border-b border-border bg-card/90 backdrop-blur-md shadow-sm z-20">
            <div className="container mx-auto px-6 py-4 max-w-7xl">
              <div className="grid gap-3">
                <a
                  href="#calculator"
                  className="text-foreground/90 hover:text-foreground text-base font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  Calculator
                </a>
                <a
                  href="#features"
                  className="text-foreground/90 hover:text-foreground text-base font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  Features
                </a>
                <a
                  href="#about"
                  onClick={(e) => {
                    handleAboutClick(e);
                    setMobileOpen(false);
                  }}
                  className="text-foreground/90 hover:text-foreground text-base font-medium cursor-pointer"
                >
                  About
                </a>
                <div className="h-px bg-border my-2" />
                <div className="grid gap-2">
                  <Button
                    variant="accent"
                    className="w-full"
                    asChild
                    onClick={() => setMobileOpen(false)}
                  >
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button
                    className="w-full"
                    asChild
                    onClick={() => setMobileOpen(false)}
                  >
                    <Link href="/signup">Sign up</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
