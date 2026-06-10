import { useGetStats } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldAlert, ShieldCheck, Activity, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ThreatBadge } from "@/components/threat-badge";

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useGetStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="p-8 text-center text-destructive">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Failed to load dashboard statistics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Intelligence Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Overview of processed threats and system statistics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Scans</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalScans}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Risk Score</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgRiskScore.toFixed(1)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Safe Content</CardTitle>
            <ShieldCheck className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-3">{stats.safeCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Detected Scams</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{stats.scamCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Threat Level Distribution</CardTitle>
            <CardDescription>Breakdown of scans by severity</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              {stats.threatLevelCounts.map((item) => (
                <div key={item.level} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ThreatBadge level={item.level} />
                  </div>
                  <span className="font-mono text-lg">{item.count}</span>
                </div>
              ))}
              {stats.threatLevelCounts.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">No data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Top Red Flags</CardTitle>
            <CardDescription>Most frequently triggered detection rules</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              {stats.topRedFlags.map((flag, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-border/50 last:border-0 pb-2 last:pb-0">
                  <span className="text-sm font-medium">{flag.category}</span>
                  <span className="font-mono text-sm text-muted-foreground">{flag.count} hits</span>
                </div>
              ))}
              {stats.topRedFlags.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">No red flags detected yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
