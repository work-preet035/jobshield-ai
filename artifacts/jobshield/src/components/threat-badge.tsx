import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ThreatBadge({ level, className }: { level: string; className?: string }) {
  const variants: Record<string, string> = {
    low: "bg-chart-3 text-white hover:bg-chart-3/80",
    medium: "bg-chart-2 text-white hover:bg-chart-2/80",
    high: "bg-chart-4 text-white hover:bg-chart-4/80",
    critical: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
  };

  return (
    <Badge className={cn("uppercase tracking-wider font-bold", variants[level.toLowerCase()] || "bg-muted text-muted-foreground", className)}>
      {level}
    </Badge>
  );
}
