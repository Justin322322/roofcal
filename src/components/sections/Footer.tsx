import { Separator } from "@/components/ui/separator";
import RoofCalcLogo from "@/components/RoofCalcLogo";

export default function Footer() {
  return (
    <>
      <Separator />
      
      {/* Footer */}
      <footer className="bg-muted py-16">
        <div className="container mx-auto px-6 text-center max-w-7xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <RoofCalcLogo className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">RoofCal</span>
          </div>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6">
            Professional roof calculator for accurate measurements and cost estimates. 
            Built for contractors and homeowners who demand precision.
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">© 2025 RoofCal</span>
          </div>
        </div>
      </footer>
    </>
  );
}
