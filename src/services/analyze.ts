import { analyzeLogSchema } from "../schemas/index.js";
import type { AnalyzeLogRequest, AnalyzeLogResponse } from "../types/index.js";
import { aggregateLogs } from "./aggregate.js";
import { buildLLMPrompt } from "./buildLLMContext.js";
import { buildTimeline } from "./buildTimeline.js";
import { callLLM } from "./callLLM.js";
import { parseLogs } from "./logParse.js";
import { normalizeLogs } from "./normalize.js";
import { scoreEvents } from "./scoreEvents.js";

export async function analyze(
  payload: AnalyzeLogRequest
): Promise<AnalyzeLogResponse> {
  const result = analyzeLogSchema.safeParse(payload);
  console.log("Analyzing logs...");
  if(!result.data?.logs)
    return {
  summary:'Empty log',
  rootCause:'Empty file/text',
  affectedComponents:[],
  probableFixes:[],
  severity:"critical"
}
  
 const parsedLogs=parseLogs(result.data?.logs)
 const normalizedLogs=normalizeLogs(parsedLogs)
 const aggregatedLogs=aggregateLogs(normalizedLogs)
 const scoredEvents=scoreEvents(aggregatedLogs)
 const timeline=buildTimeline(scoredEvents)
 const prompt=buildLLMPrompt(timeline)
 const llmResult=callLLM(prompt)
return llmResult as unknown as Promise<AnalyzeLogResponse>

  return {
    summary:
      "Application encountered repeated database timeout failures.",

    rootCause:
      "Database connection pool exhaustion caused request failures.",

    severity: "high",

    probableFixes: [
      "Increase DB connection pool size",
      "Optimize long-running queries",
      "Add retry mechanism",
    ],

    affectedComponents: [
      "PostgreSQL",
      "Auth Service",
      "API Gateway",
    ],
  };
}
