import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { IconBox, GradientText } from "@/components/atoms";

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  suffix?: string;
  variant?: "default" | "gradient" | "outline";
  className?: string;
}

const StatCard = ({
  icon,
  value,
  label,
  suffix = "",
  variant = "default",
  className,
}: StatCardProps) => {
  const variants = {
    default: "bg-card border-border",
    gradient: "bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20",
    outline: "bg-transparent border-primary/30",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        variants[variant],
        className
      )}
    >
      <IconBox icon={icon} variant="glow" size="lg" />
      <div className="text-center">
        <div className="text-3xl md:text-4xl font-bold">
          <GradientText>{value}{suffix}</GradientText>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
};

export default StatCard;
