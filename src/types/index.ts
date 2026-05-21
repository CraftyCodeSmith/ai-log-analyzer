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

export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG" | "TRACE";

export interface ParsedLog {
  timestamp: string | null;
  level: LogLevel | null;
  service: string | null;
  message: string;
  metadata: Record<string, string>;
  stackTrace?: string;
  raw: string;
}

export const LEVEL_MAP: Record<string, LogLevel> = {
  INFO: "INFO",
  WARN: "WARN",
  WARNING: "WARN",
  ERROR: "ERROR",
  ERR: "ERROR",
  DEBUG: "DEBUG",
  TRACE: "TRACE",
  FATAL: "ERROR",
};

export interface NormalizedLog extends ParsedLog {
  normalizedMessage: string;
  fingerprint: string;
}


export interface AggregatedEvent {
  fingerprint: string;
  normalizedMessage: string;
  level: LogLevel | null;

  count: number;

  firstSeen: string | null;
  lastSeen: string | null;

  services: string[];

  samples: string[];

  logs: NormalizedLog[];
}


export interface ScoredEvent extends AggregatedEvent {
  severityScore: number;
  severityLabel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reasons: string[];
}



export interface TimelineEvent {
  timestamp: string;
  severityScore: number;
  severityLabel: string;

  service: string;

  level: LogLevel | null;

  summary: string;

  count: number;

  fingerprint: string;

  reasons: string[];
}


export interface BuildLLMPromptOptions {
  maxEvents?: number;
  includeReasons?: boolean;
}