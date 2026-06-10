import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShieldAlert, FileText, Loader2 } from "lucide-react";

import { useCreateAnalysis, AnalysisInputContentType } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  content: z.string().min(10, "Content must be at least 10 characters to analyze."),
  contentType: z.nativeEnum(AnalysisInputContentType),
  source: z.string().optional(),
});

export default function Home() {
  const [, setLocation] = useLocation();
  const createAnalysis = useCreateAnalysis();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      contentType: AnalysisInputContentType.job_posting,
      source: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createAnalysis.mutate(
      { data },
      {
        onSuccess: (analysis) => {
          setLocation(`/results/${analysis.id}`);
        },
      }
    );
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Threat Scanner</h1>
        <p className="text-muted-foreground text-lg">
          Analyze recruiter messages, job postings, and emails for potential scams or malicious intent.
        </p>
      </div>

      <Card className="border-border">
        <CardHeader className="bg-muted/50 border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" />
            New Analysis
          </CardTitle>
          <CardDescription>Paste the content below to run a comprehensive threat analysis.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="contentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select content type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={AnalysisInputContentType.job_posting}>Job Posting</SelectItem>
                          <SelectItem value={AnalysisInputContentType.recruiter_message}>Recruiter Message</SelectItem>
                          <SelectItem value={AnalysisInputContentType.linkedin_message}>LinkedIn Message</SelectItem>
                          <SelectItem value={AnalysisInputContentType.email}>Email</SelectItem>
                          <SelectItem value={AnalysisInputContentType.other}>Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Acme Corp, LinkedIn, etc." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content to Analyze</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste the message or job description here..."
                        className="min-h-[250px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" size="lg" className="w-full md:w-auto" disabled={createAnalysis.isPending}>
                {createAnalysis.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Content...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Run Threat Analysis
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
