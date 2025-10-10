import { cn } from "@/lib/utils";
import {
  IconRuler,
  IconCalculator,
  IconCurrencyDollar,
  IconShieldCheck,
  IconCloud,
  IconBook,
  IconBolt,
  IconHeart,
} from "@tabler/icons-react";

export default function FeaturesSectionDemo() {
  const features = [
    {
      title: "Accurate Measurements",
      description:
        "Get precise roof area calculations with multiple pitch options and complex roof shapes.",
      icon: <IconRuler />,
    },
    {
      title: "Instant Calculations",
      description:
        "Professional-grade calculations delivered in seconds, not hours.",
      icon: <IconCalculator />,
    },
    {
      title: "Cost Estimation",
      description:
        "Calculate material costs and get accurate estimates for your roofing project budget.",
      icon: <IconCurrencyDollar />,
    },
    {
      title: "Industry Standard",
      description:
        "Built with roofing industry standards and best practices in mind.",
      icon: <IconShieldCheck />,
    },
    {
      title: "Cloud Sync",
      description:
        "Access your calculations anywhere, anytime with cloud synchronization.",
      icon: <IconCloud />,
    },
    {
      title: "Guided Tutorials",
      description:
        "Step-by-step tips and in-app guidance to help you get results fast.",
      icon: <IconBook />,
    },
    {
      title: "Fast Processing",
      description:
        "Lightning-fast calculations that won't slow down your workflow.",
      icon: <IconBolt />,
    },
    {
      title: "Trusted by Professionals",
      description:
        "Used by contractors and homeowners nationwide for reliable results.",
      icon: <IconHeart />,
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4  relative z-10 py-10 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r border-border py-10 relative group/feature",
        (index === 0 || index === 4) && "lg:border-l border-border",
        index < 4 && "lg:border-b border-border"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-muted/50 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-muted/50 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-muted-foreground">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-muted group-hover/feature:bg-primary transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-foreground">
          {title}
        </span>
      </div>
      <p className="text-sm text-muted-foreground max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};
