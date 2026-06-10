import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, analysesTable } from "@workspace/db";
import { getIndicatorList } from "../lib/indicators.js";

const router: IRouter = Router();

router.get("/stats", async (req, res): Promise<void> => {
  const [totals] = await db
    .select({
      totalScans: sql<number>`count(*)::int`,
      avgRiskScore: sql<number>`coalesce(avg(risk_score), 0)::float`,
      safeCount: sql<number>`count(*) filter (where threat_level = 'low')::int`,
      scamCount: sql<number>`count(*) filter (where threat_level in ('high', 'critical'))::int`,
    })
    .from(analysesTable);

  const levelCounts = await db
    .select({
      level: analysesTable.threatLevel,
      count: sql<number>`count(*)::int`,
    })
    .from(analysesTable)
    .groupBy(analysesTable.threatLevel);

  // Compute top red flags from stored JSONB
  const flagRows = await db
    .select({ redFlags: analysesTable.redFlags })
    .from(analysesTable);

  const flagCounts: Record<string, number> = {};
  for (const row of flagRows) {
    const flags = row.redFlags as Array<{ matched: boolean; category: string }>;
    for (const flag of flags) {
      if (flag.matched) {
        flagCounts[flag.category] = (flagCounts[flag.category] ?? 0) + 1;
      }
    }
  }

  const topRedFlags = Object.entries(flagCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  res.json({
    totalScans: totals?.totalScans ?? 0,
    avgRiskScore: Math.round((totals?.avgRiskScore ?? 0) * 10) / 10,
    safeCount: totals?.safeCount ?? 0,
    scamCount: totals?.scamCount ?? 0,
    threatLevelCounts: levelCounts,
    topRedFlags,
  });
});

router.get("/indicators", async (req, res): Promise<void> => {
  const indicators = getIndicatorList();
  res.json(indicators);
});

export default router;
