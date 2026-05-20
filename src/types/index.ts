import { z } from "zod";

export type AnalyzeLogRequest = {
  logs: string;
  source?: string;
};

export type AnalyzeLogResponse = {
  summary: string;
  rootCause: string;
  severity: "low" | "medium" | "high" | "critical";
  probableFixes: string[];
  affectedComponents: string[];
};

