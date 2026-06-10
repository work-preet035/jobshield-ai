import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, analysesTable } from "@workspace/db";
import {
  CreateAnalysisBody,
  ListAnalysesQueryParams,
  GetAnalysisParams,
  DeleteAnalysisParams,
} from "@workspace/api-zod";
import { analyzeContent } from "../lib/detector.js";

const router: IRouter = Router();

router.get("/analyses", async (req, res): Promise<void> => {
  const parsed = ListAnalysesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { limit = 20, offset = 0, threatLevel } = parsed.data;

  let query = db
    .select()
    .from(analysesTable)
    .orderBy(desc(analysesTable.createdAt))
    .limit(limit)
    .offset(offset);

  if (threatLevel) {
    const results = await db
      .select()
      .from(analysesTable)
      .where(eq(analysesTable.threatLevel, threatLevel))
      .orderBy(desc(analysesTable.createdAt))
      .limit(limit)
      .offset(offset);
    res.json(results);
    return;
  }

  const results = await query;
  res.json(results);
});

router.post("/analyses", async (req, res): Promise<void> => {
  const parsed = CreateAnalysisBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid analysis input");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { content, contentType, source } = parsed.data;

  const analysisResult = analyzeContent(content);

  const [analysis] = await db
    .insert(analysesTable)
    .values({
      content,
      contentType,
      source: source ?? null,
      riskScore: analysisResult.riskScore,
      threatLevel: analysisResult.threatLevel,
      redFlags: analysisResult.redFlags,
      recommendations: analysisResult.recommendations,
      summary: analysisResult.summary,
    })
    .returning();

  req.log.info({ id: analysis.id, riskScore: analysis.riskScore }, "Analysis created");
  res.status(201).json(analysis);
});

router.get("/analyses/recent", async (req, res): Promise<void> => {
  const results = await db
    .select()
    .from(analysesTable)
    .orderBy(desc(analysesTable.createdAt))
    .limit(5);
  res.json(results);
});

router.get("/analyses/:id", async (req, res): Promise<void> => {
  const params = GetAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [analysis] = await db
    .select()
    .from(analysesTable)
    .where(eq(analysesTable.id, params.data.id));

  if (!analysis) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  res.json(analysis);
});

router.delete("/analyses/:id", async (req, res): Promise<void> => {
  const params = DeleteAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(analysesTable)
    .where(eq(analysesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
