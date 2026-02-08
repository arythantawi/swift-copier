import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface SectionWrapperProps {
  children: React.ReactNode;
  id?: string;
  variant?: "default" | "muted" | "gradient" | "dark";
  padding?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SectionWrapper = forwardRef<HTMLElement, SectionWrapperProps>(
  ({ children, id, variant = "default", padding = "lg", className }, ref) => {
    const variants = {
      default: "bg-background",
      muted: "bg-muted/30",
      gradient: "bg-gradient-to-b from-background via-muted/20 to-background",
      dark: "bg-primary text-primary-foreground",
    };

    const paddings = {
      sm: "py-8 md:py-12",
      md: "py-12 md:py-16",
      lg: "py-16 md:py-24",
      xl: "py-20 md:py-32",
    };

    return (
      <section
        ref={ref}
        id={id}
        className={cn(
          "relative overflow-hidden",
          variants[variant],
          paddings[padding],
          className
        )}
      >
        <div className="container px-4 sm:px-6 relative z-10">
          {children}
        </div>
      </section>
    );
  }
);

SectionWrapper.displayName = "SectionWrapper";

export default SectionWrapper;
