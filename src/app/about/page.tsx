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
            <Badge variant="outline" className="mb-6">
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
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Pitch Calculation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Automatically calculates roof slope using rise-over-run ratios, 
                    ensuring accurate surface area measurements regardless of roof complexity.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Material Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Factors in material dimensions, overlap requirements, and standard 
                    installation practices to minimize waste and cost.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Quality Assurance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Validates calculations against industry standards and real-world 
                    project data to ensure reliability and accuracy.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>


      <Footer />
    </div>
  );
}
