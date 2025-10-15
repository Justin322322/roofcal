import { Badge } from "@/components/ui/badge";
import FeaturesSectionDemo from "@/components/features-section-demo-2";

export default function Features() {
  return (
    <section id="features" className="pt-24 pb-12 bg-transparent">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center mb-20">
          <Badge variant="outline" className="mb-4">
            Features
          </Badge>
          <h3 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 tracking-tight">
            Why Choose RoofCalc?
          </h3>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Professional-grade calculations with industry-standard accuracy
          </p>
        </div>

        <FeaturesSectionDemo />
      </div>
    </section>
  );
}
