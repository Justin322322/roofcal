"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ScrollingCalculators from "./ScrollingCalculators";

export default function Hero() {

  return (
    <main
      id="home"
      className="relative min-h-screen flex items-center justify-center px-6 py-16 overflow-x-hidden scroll-mt-20"
    >
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center max-w-6xl mx-auto">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-8 leading-[1.1] tracking-tight">
            Professional{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Roof Calculator
            </span>
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-4xl mx-auto font-light">
            Accurate roofing measurements, material estimates, and cost
            calculations for contractors and homeowners. Get professional-grade
            results in seconds.
          </p>
          <div className="flex justify-center gap-4 mb-16">
            <Button size="lg" variant="default" className="text-lg px-8 py-6 h-auto font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
        {/* Demo calculation preview */}
        <div
          id="calculator"
          className="mt-16 relative overflow-visible scroll-mt-20"
        >
          {/* Scrolling calculator icons behind card */}
          <ScrollingCalculators />

          <div className="flex justify-center relative z-10">
            <div className="rounded-2xl border-2 border-border bg-card shadow-md overflow-hidden max-w-6xl w-full">
              <div className="bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
                Demo Calculation Preview
              </div>
              <div className="relative w-full">
                <Image
                  src="/dashboard.png"
                  alt="Roof calculator demo screenshot"
                  width={1920}
                  height={1080}
                  priority
                  className="w-full h-auto select-none"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
