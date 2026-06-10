import { useState } from "react";
import { Link } from "wouter";
import { useListAnalyses, useDeleteAnalysis, getListAnalysesQueryKey, ListAnalysesThreatLevel } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThreatBadge } from "@/components/threat-badge";
import { Eye, Trash2, Shield, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function History() {
  const queryClient = useQueryClient();
  const [threatLevel, setThreatLevel] = useState<ListAnalysesThreatLevel | "all">("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const params = {
    limit,
    offset: (page - 1) * limit,
    ...(threatLevel !== "all" ? { threatLevel: threatLevel as ListAnalysesThreatLevel } : {})
  };

  const { data: analyses, isLoading } = useListAnalyses(params);
  const deleteAnalysis = useDeleteAnalysis();

  const handleDelete = (id: number) => {
    if (confirm("Delete this analysis?")) {
      deleteAnalysis.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
        }
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Scan History</h1>
          <p className="text-muted-foreground text-lg">
            Review past analyses and their outcomes.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4 flex flex-col md:flex-row items-center justify-between gap-4 space-y-0 border-b border-border">
          <CardTitle className="text-lg">All Records</CardTitle>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Select value={threatLevel} onValueChange={(val: any) => { setThreatLevel(val); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Threat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Threat Levels</SelectItem>
                <SelectItem value="critical">Critical Only</SelectItem>
                <SelectItem value="high">High Only</SelectItem>
                <SelectItem value="medium">Medium Only</SelectItem>
                <SelectItem value="low">Low Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Threat Level</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : analyses?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No analyses found.
                  </TableCell>
                </TableRow>
              ) : (
                analyses?.map((analysis) => (
                  <TableRow key={analysis.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(analysis.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="capitalize">{analysis.contentType.replace("_", " ")}</TableCell>
                    <TableCell className="text-muted-foreground">{analysis.source || "Unknown"}</TableCell>
                    <TableCell>
                      <span className="font-mono">{analysis.riskScore}/100</span>
                    </TableCell>
                    <TableCell>
                      <ThreatBadge level={analysis.threatLevel} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/results/${analysis.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(analysis.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Simple Pagination Controls */}
          <div className="p-4 border-t border-border flex items-center justify-between">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <Button variant="outline" disabled={!analyses || analyses.length < limit} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
