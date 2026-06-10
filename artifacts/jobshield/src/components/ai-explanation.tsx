import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BrainCircuit, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIExplanationProps {
  analysisId: number;
  threatLevel: string;
}

export function AIExplanation({ analysisId, threatLevel }: AIExplanationProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setText("");
    setDone(false);
    setError(null);
    setLoading(true);

    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
      const res = await fetch(`${base}/api/analyses/${analysisId}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        setError("Failed to connect to AI service.");
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.error) {
              setError(parsed.error);
              setLoading(false);
              return;
            }
            if (parsed.done) {
              setDone(true);
              setLoading(false);
              return;
            }
            if (parsed.content) {
              setText((prev) => prev + parsed.content);
            }
          } catch {
            // ignore malformed SSE lines
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError("Connection error. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const accentClass =
    threatLevel === "critical"
      ? "text-destructive"
      : threatLevel === "high"
      ? "text-chart-4"
      : threatLevel === "medium"
      ? "text-chart-2"
      : "text-chart-3";

  return (
    <Card>
      <CardHeader className="border-b border-border pb-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <BrainCircuit className={cn("w-5 h-5", accentClass)} />
          AI Threat Analyst
        </CardTitle>
        {(done || error) && (
          <Button variant="ghost" size="sm" onClick={run} className="gap-1 text-muted-foreground">
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerate
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-5">
        {!text && !loading && !error && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <p className="text-sm text-muted-foreground max-w-sm">
              Get a plain-English explanation of what these findings mean and what to do next.
            </p>
            <Button onClick={run} data-testid="button-ai-explain" className="gap-2">
              <BrainCircuit className="w-4 h-4" />
              Explain This Threat
            </Button>
          </div>
        )}

        {loading && !text && (
          <div className="space-y-3 py-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
              <Loader2 className="w-3 h-3 animate-spin" />
              Analyst is reviewing...
            </div>
          </div>
        )}

        {text && (
          <div className="space-y-3">
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap text-foreground"
              data-testid="text-ai-explanation"
            >
              {text}
              {loading && (
                <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary animate-pulse rounded-sm align-middle" />
              )}
            </p>
          </div>
        )}

        {error && (
          <div className="py-4 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={run} className="mt-3">
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
