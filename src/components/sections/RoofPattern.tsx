import RoofCalcLogo from "@/components/RoofCalcLogo";

export default function RoofPattern() {
  return (
    <section className="relative bg-transparent py-12 overflow-hidden">
      <div className="flex justify-center items-center">
        <RoofCalcLogo className="w-40 h-40 text-primary/70" />
        <RoofCalcLogo className="w-40 h-40 text-primary/70 -ml-2" />
        <RoofCalcLogo className="w-40 h-40 text-primary/70 -ml-2" />
        <RoofCalcLogo className="w-40 h-40 text-primary/70 -ml-2" />
        <RoofCalcLogo className="w-40 h-40 text-primary/70 -ml-2" />
      </div>
    </section>
  );
}
