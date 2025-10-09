import Link from "next/link";
import { Button } from "@/components/ui/button";
import RoofCalcLogo from "@/components/RoofCalcLogo";

export default function Header() {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RoofCalcLogo className="w-8 h-8 text-primary" />
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                RoofCal
              </h1>
            </div>
          </div>
          <nav className="hidden md:flex gap-8 flex-1 justify-center">
            <a href="#calculator" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Calculator
            </a>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Features
            </a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              About
            </a>
          </nav>
          <div className="hidden md:flex gap-3">
            <Button variant="accent" size="sm" asChild>
              <Link href="/login">
                Login
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">
                Sign up
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
