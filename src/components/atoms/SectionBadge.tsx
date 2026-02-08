import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SectionBadgeProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  iconPosition?: "left" | "right" | "both";
  variant?: "default" | "glow" | "outline" | "gradient";
  className?: string;
}

const SectionBadge = ({
  children,
  icon: Icon,
  iconPosition = "left",
  variant = "default",
  className,
}: SectionBadgeProps) => {
  const variants = {
    default: "bg-primary/10 text-primary border-primary/20",
    glow: "bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 text-primary border-primary/20 shadow-lg shadow-primary/10",
    outline: "bg-transparent text-primary border-primary/30",
    gradient: "bg-gradient-to-r from-primary to-accent text-primary-foreground border-transparent",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border backdrop-blur-sm transition-all duration-300",
        variants[variant],
        className
      )}
    >
      {Icon && (iconPosition === "left" || iconPosition === "both") && (
        <Icon className="w-4 h-4" />
      )}
      <span>{children}</span>
      {Icon && (iconPosition === "right" || iconPosition === "both") && (
        <Icon className="w-4 h-4" />
      )}
    </div>
  );
};

export default SectionBadge;
