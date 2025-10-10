import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RoofCalcLogo from "@/components/RoofCalcLogo";
import Error404Icon from "@/components/Error404Icon";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <RoofCalcLogo className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">RoofCal</h1>
            </Link>
            <div className="hidden md:flex gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="cursor-pointer">
                  Home
                </Button>
              </Link>
              <Link href="/#features">
                <Button size="sm" className="cursor-pointer">
                  Features
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 404 Content */}
      <main className="min-h-screen flex items-center justify-center px-6 py-16">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center">
            {/* 404 Icon */}
            <div className="mb-8">
              <Error404Icon className="w-64 h-64 text-primary/60 mx-auto" />
            </div>

            {/* Error Badge */}
            <Badge variant="outline" className="mb-6">
              Page Not Found
            </Badge>

            {/* Error Message */}
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold text-foreground mb-6 tracking-tight">
              404
            </h1>

            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Oops! This page is missing
            </h2>

            <p className="text-lg sm:text-xl text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto">
              The page you&#39;re looking for seems to have disappeared like a
              shingle in a storm. Don&#39;t worry, we&#39;ll help you find your
              way back to solid ground.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button
                  size="lg"
                  className="min-w-[200px] h-14 text-lg font-semibold cursor-pointer"
                >
                  Go Home
                </Button>
              </Link>
              <Link href="/#features">
                <Button
                  variant="outline"
                  size="lg"
                  className="min-w-[200px] h-14 text-lg font-semibold cursor-pointer"
                >
                  View Features
                </Button>
              </Link>
            </div>

            {/* Helpful Links */}
            <div className="mt-16 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">
                Popular pages:
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/#features"
                  className="text-sm text-primary hover:underline"
                >
                  Features
                </Link>
                <Link
                  href="/#about"
                  className="text-sm text-primary hover:underline"
                >
                  About
                </Link>
                <Link
                  href="/#calculator"
                  className="text-sm text-primary hover:underline"
                >
                  Calculator
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
