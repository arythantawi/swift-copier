import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { IconBox } from "@/components/atoms";
import { Card, CardContent } from "@/components/ui/card";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconVariant?: "default" | "gradient" | "outline" | "glow";
  hover?: "default" | "lift" | "glow" | "scale" | "subtle";
  className?: string;
}

const FeatureCard = ({
  icon,
  title,
  description,
  iconVariant = "gradient",
  hover = "lift",
  className,
}: FeatureCardProps) => {
  return (
    <Card hover={hover} className={cn("group", className)}>
      <CardContent className="p-6 flex flex-col items-center text-center gap-4">
        <IconBox 
          icon={icon} 
          variant={iconVariant} 
          size="lg"
          className="group-hover:scale-110 transition-transform duration-300"
        />
        <div className="space-y-2">
          <h3 className="font-semibold text-lg text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;
