"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UsersIcon, TrendingUpIcon, ClockIcon } from "lucide-react";
import type { Account } from "../types";
import { formatCurrencyForStats } from "../utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface AccountStatsCardsProps {
  accounts: Account[];
  loading?: boolean;
}

export function AccountStatsCards({
  accounts,
  loading = false,
}: AccountStatsCardsProps) {
  const isMobile = useIsMobile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const stats = useMemo(() => {
    const totalAccounts = accounts.length;
    const activeAccounts = accounts.filter(
      (account) => account.status === "Active"
    ).length;
    const totalRevenue = accounts.reduce(
      (sum, account) => sum + account.totalSpend,
      0
    );
    const averageRevenue = totalRevenue / totalAccounts || 0;
    const totalProjects = accounts.reduce(
      (sum, account) => sum + account.totalProjects,
      0
    );
    const averageProjectsPerActive =
      activeAccounts > 0 ? totalProjects / activeAccounts : 0;

    // Guard against division by zero for percentage calculation
    const percent =
      totalAccounts === 0
        ? 0
        : Math.round((activeAccounts / totalAccounts) * 100);

    return [
      {
        title: "Total Accounts",
        value: totalAccounts.toString(),
        icon: UsersIcon,
        description: `${activeAccounts} active`,
      },
      {
        title: "Active Accounts",
        value: activeAccounts.toString(),
        icon: TrendingUpIcon,
        description: `${percent}% of total`,
      },
      {
        title: "Total Revenue",
        value: formatCurrencyForStats(totalRevenue),
        icon: TrendingUpIcon,
        description: `${formatCurrencyForStats(averageRevenue)} avg per account`,
      },
      {
        title: "Avg. Projects",
        value: activeAccounts > 0 ? averageProjectsPerActive.toFixed(1) : "—",
        icon: ClockIcon,
        description: "per active account",
      },
    ];
  }, [accounts]);

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
            {Array.from({ length: 4 }).map((_, index) => (
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
          <div className="grid gap-2 sm:gap-3 md:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32 mb-2" />
                  <Skeleton className="h-5 w-20" />
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
                  {stat.value}
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
    <div className="grid gap-2 sm:gap-3 md:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-4 sm:mb-6 lg:mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold break-words">
              {stat.value}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
