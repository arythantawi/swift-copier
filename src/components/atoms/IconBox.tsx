import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface IconBoxProps {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "gradient" | "outline" | "glow";
  className?: string;
}

const IconBox = ({
  icon: Icon,
  size = "md",
  variant = "default",
  className,
}: IconBoxProps) => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-14 h-14",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-7 h-7",
  };

  const variants = {
    default: "bg-primary/10 text-primary",
    gradient: "bg-gradient-to-br from-primary to-accent text-primary-foreground",
    outline: "bg-transparent border-2 border-primary/30 text-primary",
    glow: "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl transition-all duration-300",
        sizes[size],
        variants[variant],
        className
      )}
    >
      <Icon className={iconSizes[size]} />
    </div>
  );
};

export default IconBox;
