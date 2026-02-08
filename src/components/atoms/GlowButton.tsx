import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface GlowButtonProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  variant?: "primary" | "secondary" | "accent" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const GlowButton = ({
  children,
  icon: Icon,
  iconPosition = "right",
  variant = "primary",
  size = "md",
  className,
  href,
  onClick,
  disabled = false,
}: GlowButtonProps) => {
  const variants = {
    primary: "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30",
    secondary: "bg-secondary text-secondary-foreground shadow-lg hover:shadow-xl",
    accent: "bg-gradient-to-r from-accent to-accent/80 text-accent-foreground shadow-xl shadow-accent/25 hover:shadow-2xl hover:shadow-accent/30",
    outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary/10",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm gap-2",
    md: "px-6 py-3 text-base gap-2",
    lg: "px-8 py-4 text-lg gap-3",
  };

  const baseClasses = cn(
    "group inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
    variants[variant],
    sizes[size],
    className
  );

  const content = (
    <>
      {Icon && iconPosition === "left" && (
        <Icon className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
      )}
      <span>{children}</span>
      {Icon && iconPosition === "right" && (
        <Icon className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClasses}
      >
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={baseClasses}>
      {content}
    </button>
  );
};

export default GlowButton;
