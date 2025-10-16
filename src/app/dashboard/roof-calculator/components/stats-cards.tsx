"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RulerIcon,
  DollarSignIcon,
  PackageIcon,
} from "lucide-react";
import {
  formatCurrency,
} from "../utils";
import { materials } from "./material-selection";
import { useIsMobile } from "@/hooks/use-mobile";

interface RoofStatsCardsProps {
  area: number;
  totalCost: number;
  material: string;
  loading?: boolean;
}

// Helper function to get material name with fallback for thickness variants
function getMaterialName(materialValue: string): string {
  // Find in materials array
  const material = materials.find((m) => m.value === materialValue);
  return material?.name || materialValue;
}

// Helper function to get material price
function getMaterialPrice(materialValue: string): number {
  // Find in materials array
  const material = materials.find((m) => m.value === materialValue);
  return material?.price || 0;
}

export function RoofStatsCards({
  area,
  totalCost,
  material,
  loading = false,
}: RoofStatsCardsProps) {
  const isMobile = useIsMobile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const stats = useMemo(() => {
    const materialName = getMaterialName(material);
    const materialPrice = getMaterialPrice(material);

    return [
      {
        title: "Roof Area",
        value: area > 0 ? `${area.toFixed(2)} sq.m` : "—",
        icon: RulerIcon,
        description: "Total calculated area",
      },
      {
        title: "Total Cost",
        value: totalCost > 0 ? formatCurrency(totalCost) : "—",
        icon: DollarSignIcon,
        description: totalCost > 0 ? "Material + Labor" : "Enter measurements",
      },
      {
        title: "Material",
        value: materialName,
        icon: PackageIcon,
        description: materialPrice > 0
          ? `${formatCurrency(materialPrice)}/sq.m`
          : "Select material",
      },
    ];
  }, [area, totalCost, material]);

  // Handle scroll events for pagination dots
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isMobile) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.clientWidth;
      const newIndex = Math.round(scrollLeft / cardWidth);
      setCurrentIndex(newIndex);
    };

    const handleScrollEnd = () => {
      // Snap to nearest card
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.clientWidth;
      const newIndex = Math.round(scrollLeft / cardWidth);
      container.scrollTo({
        left: newIndex * cardWidth,
        behavior: 'smooth'
      });
    };

    container.addEventListener('scroll', handleScroll);
    container.addEventListener('scrollend', handleScrollEnd);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('scrollend', handleScrollEnd);
    };
  }, [isMobile]);

  // Handle touch events for better mobile experience
  const handleTouchStart = () => {};
  const handleTouchEnd = () => {};

  if (loading) {
    return (
      <div className="mb-4 sm:mb-6 lg:mb-8">
        {isMobile ? (
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="relative overflow-hidden flex-shrink-0 w-[calc(100vw-2rem)] snap-center">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 sm:h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="mb-4 sm:mb-6 lg:mb-8">
        {/* Mobile Carousel */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {stats.map((stat, index) => (
            <Card 
              key={index} 
              className="relative overflow-hidden flex-shrink-0 w-[calc(100vw-2rem)] snap-center bg-gradient-to-br from-background to-muted/20 border-border/50 shadow-sm hover:shadow-md transition-all duration-300 ease-out"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-foreground/90">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground/70" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xl font-bold text-foreground break-words mb-1">
                  {typeof stat.value === "string" ? stat.value : stat.value}
                </div>
                <p className="text-xs text-muted-foreground/80 break-words leading-relaxed">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Page Indicators */}
        <div className="flex justify-center mt-4 space-x-2">
          {stats.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-primary scale-125'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              onClick={() => {
                const container = scrollContainerRef.current;
                if (container) {
                  const cardWidth = container.clientWidth;
                  container.scrollTo({
                    left: index * cardWidth,
                    behavior: 'smooth'
                  });
                }
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Desktop/Tablet Grid Layout
  return (
    <div className="grid gap-2 sm:gap-3 md:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-4 sm:mb-6 lg:mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold break-words">
              {typeof stat.value === "string" ? stat.value : stat.value}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground break-words">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
