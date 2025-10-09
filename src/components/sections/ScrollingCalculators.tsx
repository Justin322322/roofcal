"use client";

import { useEffect, useRef } from "react";
import { Calculator } from "lucide-react";

export default function ScrollingCalculators() {
  const rowRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const translateX = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      // Move left when scrolling down (positive delta), right when scrolling up (negative delta)
      translateX.current -= scrollDelta * 0.5;

      if (rowRef.current) {
        rowRef.current.style.transform = `translateX(${translateX.current}px)`;
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      aria-hidden
      className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-0 overflow-hidden pointer-events-none w-[100vw] max-w-none"
    >
      <div
        ref={rowRef}
        className="flex items-center justify-center gap-12 transition-transform duration-100 ease-out will-change-transform"
        style={{ width: "150%" }}
      >
        {Array.from({ length: 18 }).map((_, i) =>
          i % 2 === 0 ? (
            <span
              key={`text-${i}`}
              className="text-5xl font-bold tracking-wide text-foreground/40 select-none"
            >
              RoofCal
            </span>
          ) : (
            <Calculator
              key={`icon-${i}`}
              className="w-40 h-40 text-primary/30 flex-shrink-0"
              strokeWidth={1.5}
            />
          )
        )}
      </div>
    </div>
  );
}
