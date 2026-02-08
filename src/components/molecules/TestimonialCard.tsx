import { cn } from "@/lib/utils";
import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TestimonialCardProps {
  name: string;
  location?: string;
  rating: number;
  text: string;
  avatarUrl?: string;
  route?: string;
  className?: string;
}

const TestimonialCard = ({
  name,
  location,
  rating,
  text,
  avatarUrl,
  route,
  className,
}: TestimonialCardProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card hover="lift" className={cn("relative overflow-hidden", className)}>
      {/* Decorative Quote */}
      <div className="absolute top-4 right-4 opacity-10">
        <Quote className="w-12 h-12 text-primary" />
      </div>
      
      <CardContent className="p-6 space-y-4">
        {/* Rating Stars */}
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "w-4 h-4 transition-colors",
                i < rating
                  ? "text-accent fill-accent"
                  : "text-muted-foreground/30"
              )}
            />
          ))}
        </div>

        {/* Testimonial Text */}
        <p className="text-muted-foreground leading-relaxed line-clamp-4">
          "{text}"
        </p>

        {/* Author Info */}
        <div className="flex items-center gap-3 pt-2 border-t border-border/50">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{name}</p>
            {(location || route) && (
              <p className="text-xs text-muted-foreground truncate">
                {location && <span>{location}</span>}
                {location && route && <span> • </span>}
                {route && <span>{route}</span>}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestimonialCard;
