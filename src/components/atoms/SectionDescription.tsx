import { cn } from "@/lib/utils";

interface SectionDescriptionProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SectionDescription = ({
  children,
  size = "md",
  className,
}: SectionDescriptionProps) => {
  const sizes = {
    sm: "text-sm md:text-base",
    md: "text-base md:text-lg",
    lg: "text-lg md:text-xl",
  };

  return (
    <p
      className={cn(
        "text-muted-foreground leading-relaxed",
        sizes[size],
        className
      )}
    >
      {children}
    </p>
  );
};

export default SectionDescription;
