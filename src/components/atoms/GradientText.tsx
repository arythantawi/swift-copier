import { cn } from "@/lib/utils";

interface GradientTextProps {
  children: React.ReactNode;
  variant?: "primary" | "accent" | "rainbow";
  className?: string;
}

const GradientText = ({
  children,
  variant = "primary",
  className,
}: GradientTextProps) => {
  const variants = {
    primary: "from-primary via-primary/80 to-accent",
    accent: "from-accent via-accent/80 to-primary",
    rainbow: "from-primary via-accent to-secondary",
  };

  return (
    <span
      className={cn(
        "bg-gradient-to-r bg-clip-text text-transparent",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export default GradientText;
