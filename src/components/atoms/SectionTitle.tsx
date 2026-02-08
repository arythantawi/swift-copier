import { cn } from "@/lib/utils";

interface SectionTitleProps {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4";
  size?: "sm" | "md" | "lg" | "xl";
  gradient?: boolean;
  className?: string;
}

const SectionTitle = ({
  children,
  as: Tag = "h2",
  size = "lg",
  gradient = false,
  className,
}: SectionTitleProps) => {
  const sizes = {
    sm: "text-xl md:text-2xl",
    md: "text-2xl md:text-3xl",
    lg: "text-3xl md:text-4xl lg:text-5xl",
    xl: "text-4xl md:text-5xl lg:text-6xl",
  };

  return (
    <Tag
      className={cn(
        "font-display font-bold leading-tight tracking-tight",
        sizes[size],
        gradient && "bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent",
        !gradient && "text-foreground",
        className
      )}
    >
      {children}
    </Tag>
  );
};

export default SectionTitle;
