import Header from "@/components/sections/Header";
import Footer from "@/components/sections/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Target, Shield } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="success" className="mb-6">
              About RoofCal
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Revolutionizing{" "}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Roof Calculations
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Built by professionals, for professionals. RoofCal delivers accurate, 
              reliable roof calculations that contractors and homeowners trust for 
              their most important projects.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                To simplify and streamline the roof calculation process while maintaining 
                the highest standards of accuracy and professionalism. We believe that 
                every roofing project deserves precise measurements and reliable estimates.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Whether you&apos;re a seasoned contractor managing multiple projects or a 
                homeowner planning a renovation, RoofCal provides the tools you need 
                to make informed decisions with confidence.
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl transform rotate-3"></div>
              <Card className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Precision First
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Every calculation is built on industry-standard formulas and 
                    verified against real-world project data to ensure accuracy.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>


      {/* Algorithm Section */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Our Calculation Algorithm
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Built on proven mathematical formulas and industry standards for accurate roof measurements
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6">
                Core Formula
              </h3>
              <div className="bg-muted/50 rounded-lg p-6 mb-6">
                <div className="font-mono text-sm space-y-2">
                  <div className="text-primary font-semibold">Roof Area Calculation</div>
                  <div>area = length × width × pitch_factor</div>
                  <div className="text-muted-foreground mt-4">Pitch Factor Formula</div>
                  <div>pitch_factor = √(1 + (rise/run)²)</div>
                  <div className="text-muted-foreground mt-4">Material Calculation</div>
                  <div>materials = area ÷ coverage_per_unit</div>
                  <div className="text-muted-foreground mt-4">Waste Factor</div>
                  <div>total_materials = materials × (1 + waste_percentage)</div>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Our algorithm accounts for roof pitch, material coverage, waste factors, 
                and regional variations to provide the most accurate estimates possible.
              </p>
            </div>
            
            <div>
              {[
                {
                  title: "Pitch Calculation",
                  description:
                    "Automatically calculates roof slope using rise-over-run ratios, ensuring accurate surface area measurements regardless of roof complexity.",
                  icon: <Target className="h-5 w-5" />,
                },
                {
                  title: "Material Optimization",
                  description:
                    "Factors in material dimensions, overlap requirements, and standard installation practices to minimize waste and cost.",
                  icon: <CheckCircle className="h-5 w-5" />,
                },
                {
                  title: "Quality Assurance",
                  description:
                    "Validates calculations against industry standards and real-world project data to ensure reliability and accuracy.",
                  icon: <Shield className="h-5 w-5" />,
                },
              ].map((item, index) => (
                <div 
                  key={item.title} 
                  className={`relative overflow-hidden group/feature px-6 py-8 ${
                    index === 0 ? 'border-l border-r border-b border-border' : // Pitch Calculation - no top border
                    index === 2 ? 'border-l border-r border-t border-border' : // Quality Assurance - no bottom border
                    'border border-border' // Material Optimization - all borders
                  }`}
                >
                  <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-muted/50 to-transparent pointer-events-none" />
                  <div className="mb-3 relative z-10 text-muted-foreground ml-4">
                    <div className="inline-flex items-center justify-center rounded-md bg-muted/60 p-2 text-primary">
                      {item.icon}
                    </div>
                  </div>
                  <div className="text-lg font-bold mb-2 relative z-10">
                    <div className="absolute left-0 inset-y-0 h-6 w-1 rounded-tr-full rounded-br-full bg-muted group-hover/feature:bg-primary transition-all duration-200 origin-center" />
                    <span className="group-hover/feature:translate-x-1 transition duration-200 inline-block text-foreground ml-4">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-prose relative z-10 ml-4">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      <Footer />
    </div>
  );
}
