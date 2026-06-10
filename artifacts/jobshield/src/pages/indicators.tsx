import { useListIndicators } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ThreatBadge } from "@/components/threat-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, BookOpen } from "lucide-react";

export default function Indicators() {
  const { data: indicators, isLoading, isError } = useListIndicators();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  if (isError || !indicators) {
    return (
      <div className="p-8 text-center text-destructive">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Failed to load detection rules.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Detection Rules</h1>
        <p className="text-muted-foreground text-lg">
          The indicators used by JobShield to evaluate threats.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {indicators.map((indicator) => (
          <Card key={indicator.id} className="flex flex-col h-full border-border bg-card hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex justify-between items-start gap-4">
                <CardTitle className="text-lg leading-tight">{indicator.name}</CardTitle>
                <ThreatBadge level={indicator.severity} className="shrink-0" />
              </div>
              <CardDescription className="text-xs font-mono mt-1 text-primary">{indicator.category}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex-1 flex flex-col gap-4">
              <p className="text-sm leading-relaxed">{indicator.description}</p>
              
              {indicator.examples && indicator.examples.length > 0 && (
                <div className="mt-auto pt-4 space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> Examples
                  </div>
                  <ul className="space-y-2">
                    {indicator.examples.map((example, i) => (
                      <li key={i} className="text-xs p-2 bg-muted rounded-md font-mono border border-border/50 text-muted-foreground">
                        "{example}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
