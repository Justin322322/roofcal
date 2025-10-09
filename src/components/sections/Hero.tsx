import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center max-w-6xl mx-auto">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-8 leading-[1.1] tracking-tight">
            Professional{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Roof Calculator</span>
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-16 leading-relaxed max-w-4xl mx-auto font-light">
            Accurate roofing measurements, material estimates, and cost calculations 
            for contractors and homeowners. Get professional-grade results in seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button size="lg" className="min-w-[200px] h-14 text-lg font-semibold cursor-pointer">
              Start Calculating
            </Button>
            <Button variant="accent" size="lg" className="min-w-[200px] h-14 text-lg font-semibold cursor-pointer">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
