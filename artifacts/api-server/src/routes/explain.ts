import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { db, analysesTable } from "@workspace/db";

const router: IRouter = Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/analyses/:id/explain", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [analysis] = await db
    .select()
    .from(analysesTable)
    .where(eq(analysesTable.id, id));

  if (!analysis) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  const matchedFlags = (analysis.redFlags as Array<{ matched: boolean; category: string; description: string; severity: string; matchedText: string | null }>)
    .filter((f) => f.matched);

  const flagsText = matchedFlags.length > 0
    ? matchedFlags.map((f) => `- [${f.severity.toUpperCase()}] ${f.category}: ${f.description}${f.matchedText ? ` (matched: "${f.matchedText}")` : ""}`).join("\n")
    : "No red flags detected.";

  const systemPrompt = `You are a senior cybersecurity analyst specializing in recruitment fraud and social engineering attacks. Your job is to explain threat findings to job seekers in plain, direct language — no jargon, no hedging. Be concise, specific, and actionable. Write in second person ("you", "your"). Maximum 3 short paragraphs.`;

  const userPrompt = `Analyze this ${analysis.contentType.replace("_", " ")} for a job seeker and explain what makes it ${analysis.threatLevel === "low" ? "appear legitimate" : "suspicious or dangerous"}.

Risk Score: ${analysis.riskScore}/100 (${analysis.threatLevel.toUpperCase()} threat)

Detected red flags:
${flagsText}

Content excerpt (first 800 chars):
"${analysis.content.substring(0, 800)}"

Write a plain-English explanation of:
1. What the specific red flags mean and why they matter
2. What a scammer likely wants from you
3. One concrete action to take right now

Be direct. No bullet points. No headings. Just 2–3 tight paragraphs.`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 600,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "OpenAI explain error");
    res.write(`data: ${JSON.stringify({ error: "AI explanation failed" })}\n\n`);
    res.end();
  }
});

export default router;
