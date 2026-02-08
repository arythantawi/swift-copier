import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { SectionBadge, SectionTitle, SectionDescription } from "@/components/atoms";

interface SectionHeaderProps {
  badge?: string;
  badgeIcon?: LucideIcon;
  badgeVariant?: "default" | "glow" | "outline" | "gradient";
  title: string;
  titleGradient?: boolean;
  titleSize?: "sm" | "md" | "lg" | "xl";
  description?: string;
  align?: "left" | "center" | "right";
  className?: string;
}

const SectionHeader = ({
  badge,
  badgeIcon,
  badgeVariant = "glow",
  title,
  titleGradient = false,
  titleSize = "lg",
  description,
  align = "center",
  className,
}: SectionHeaderProps) => {
  const alignments = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        alignments[align],
        className
      )}
    >
      {badge && (
        <SectionBadge icon={badgeIcon} variant={badgeVariant}>
          {badge}
        </SectionBadge>
      )}
      
      <SectionTitle size={titleSize} gradient={titleGradient}>
        {title}
      </SectionTitle>
      
      {description && (
        <SectionDescription className="max-w-2xl">
          {description}
        </SectionDescription>
      )}
    </div>
  );
};

export default SectionHeader;
