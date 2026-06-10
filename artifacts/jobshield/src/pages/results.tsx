import { useParams } from "wouter";
import { useGetAnalysis, getGetAnalysisQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ShieldCheck, FileText, CheckCircle2, ChevronRight, Activity } from "lucide-react";
import { ThreatBadge } from "@/components/threat-badge";
import { AIExplanation } from "@/components/ai-explanation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

function RiskGauge({ score }: { score: number }) {
  let color = "text-chart-3"; // low
  let trackColor = "bg-chart-3/20";
  let indicatorColor = "bg-chart-3";
  
  if (score > 75) {
    color = "text-destructive";
    trackColor = "bg-destructive/20";
    indicatorColor = "bg-destructive";
  } else if (score > 50) {
    color = "text-chart-4";
    trackColor = "bg-chart-4/20";
    indicatorColor = "bg-chart-4";
  } else if (score > 25) {
    color = "text-chart-2";
    trackColor = "bg-chart-2/20";
    indicatorColor = "bg-chart-2";
  }

  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-muted/30 rounded-full aspect-square w-48 mx-auto border border-border">
      <span className={cn("text-5xl font-black tracking-tighter", color)}>{score}</span>
      <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-1">Risk Score</span>
      <div className={cn("absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-2 rounded-full", trackColor)}>
        <div className={cn("h-full rounded-full transition-all duration-1000", indicatorColor)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function Results() {
  const { id } = useParams();
  const numId = id ? parseInt(id, 10) : 0;
  
  const { data: analysis, isLoading, isError } = useGetAnalysis(numId, { 
    query: { 
      enabled: !!numId, 
      queryKey: getGetAnalysisQueryKey(numId) 
    } 
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-1" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (isError || !analysis) {
    return (
      <div className="p-8 text-center text-destructive">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Analysis not found or failed to load.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold tracking-tight">Analysis Report</h1>
            <ThreatBadge level={analysis.threatLevel} className="text-base px-3 py-1" />
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Scanned on {format(new Date(analysis.createdAt), "MMM d, yyyy 'at' HH:mm")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Score & Meta */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader className="text-center pb-2">
              <CardTitle>Threat Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <RiskGauge score={analysis.riskScore} />
              
              <div className="mt-8 space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Content Type</span>
                  <span className="font-medium capitalize">{analysis.contentType.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Source</span>
                  <span className="font-medium">{analysis.source || "N/A"}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Flags Found</span>
                  <span className="font-medium">{analysis.redFlags.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.recommendations.length > 0 ? (
                <ul className="space-y-3">
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No specific recommendations.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="bg-muted/10">
            <CardHeader>
              <CardTitle className="text-lg">Executive Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{analysis.summary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-chart-4" />
                Detected Anomalies
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {analysis.redFlags.length > 0 ? (
                <div className="divide-y divide-border">
                  {analysis.redFlags.map((flag) => (
                    <div key={flag.id} className="p-6 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h4 className="font-semibold text-foreground">{flag.description}</h4>
                        <ThreatBadge level={flag.severity} />
                      </div>
                      <div className="text-xs font-mono text-primary mb-3">{flag.category}</div>
                      
                      {flag.matchedText && (
                        <div className="mt-3 p-3 bg-background border border-border/50 rounded text-sm font-mono text-muted-foreground relative">
                          <div className="absolute -top-2.5 left-3 bg-background px-1 text-[10px] uppercase tracking-wider text-muted-foreground">Matched String</div>
                          "{flag.matchedText}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-chart-3 opacity-50" />
                  <p>No suspicious patterns detected in this content.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <AIExplanation analysisId={analysis.id} threatLevel={analysis.threatLevel} />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
                Original Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/30 border border-border rounded-md max-h-64 overflow-y-auto font-mono text-sm whitespace-pre-wrap text-muted-foreground">
                {analysis.content}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
