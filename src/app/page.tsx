import Header from "@/components/sections/Header";
import Hero from "@/components/sections/Hero";
import RoofPattern from "@/components/sections/RoofPattern";
import Features from "@/components/sections/Features";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <RoofPattern />
      <Features />
      <Footer />
    </div>
  );
}
