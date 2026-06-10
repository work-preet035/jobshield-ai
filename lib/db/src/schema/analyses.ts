import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  contentType: text("content_type").notNull(),
  source: text("source"),
  riskScore: integer("risk_score").notNull(),
  threatLevel: text("threat_level").notNull(),
  redFlags: jsonb("red_flags").notNull().$type<RedFlag[]>(),
  recommendations: jsonb("recommendations").notNull().$type<string[]>(),
  summary: text("summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export interface RedFlag {
  id: string;
  category: string;
  description: string;
  severity: string;
  matched: boolean;
  matchedText: string | null;
}

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
