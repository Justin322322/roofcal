"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface HorizontalScrollTableProps {
  children: React.ReactNode;
  className?: string;
  showScrollControls?: boolean;
  scrollStep?: number;
}

export function HorizontalScrollTable({
  children,
  className,
  showScrollControls = true,
  scrollStep = 200,
}: HorizontalScrollTableProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollButtons();
    container.addEventListener("scroll", checkScrollButtons);
    window.addEventListener("resize", checkScrollButtons);

    return () => {
      container.removeEventListener("scroll", checkScrollButtons);
      window.removeEventListener("resize", checkScrollButtons);
    };
  }, []);

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: -scrollStep, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: scrollStep, behavior: "smooth" });
    }
  };

  return (
    <div className="relative">
      {/* Scroll Controls */}
      {showScrollControls && (
        <>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "absolute left-2 top-1/2 z-20 -translate-y-1/2 h-8 w-8 p-0 rounded-full shadow-lg",
              "bg-background border-border",
              "hover:bg-accent hover:text-accent-foreground transition-all duration-200",
              "focus:ring-2 focus:ring-ring focus:ring-offset-2",
              !canScrollLeft && "opacity-40 cursor-not-allowed"
            )}
            onClick={scrollLeft}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "absolute right-2 top-1/2 z-20 -translate-y-1/2 h-8 w-8 p-0 rounded-full shadow-lg",
              "bg-background border-border",
              "hover:bg-accent hover:text-accent-foreground transition-all duration-200",
              "focus:ring-2 focus:ring-ring focus:ring-offset-2",
              !canScrollRight && "opacity-40 cursor-not-allowed"
            )}
            onClick={scrollRight}
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        className={cn(
          "overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
          "scroll-smooth relative z-0",
          className
        )}
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "hsl(var(--border)) transparent",
        }}
      >
        {children}
      </div>

      {/* Scroll Indicators */}
      {showScrollControls && (
        <>
          {/* Left fade indicator */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
          )}
          
          {/* Right fade indicator */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
          )}
        </>
      )}
    </div>
  );
}

// Enhanced Table component with horizontal scroll
interface ScrollableTableProps {
  children: React.ReactNode;
  className?: string;
  showScrollControls?: boolean;
  scrollStep?: number;
}

export function ScrollableTable({
  children,
  className,
  showScrollControls = true,
  scrollStep = 200,
}: ScrollableTableProps) {
  return (
    <HorizontalScrollTable
      className={className}
      showScrollControls={showScrollControls}
      scrollStep={scrollStep}
    >
      <div className="min-w-full rounded-md border">
        <Table className="min-w-full">{children}</Table>
      </div>
    </HorizontalScrollTable>
  );
}
