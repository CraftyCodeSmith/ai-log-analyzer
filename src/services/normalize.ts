import type { LogLevel, NormalizedLog, ParsedLog } from "../types/index.js";

function normalizeMessage(message: string): string {
  return message
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
      "<UUID>"
    )
    .replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g, "<IP>")
    .replace(
      /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\b/g,
      "<TIMESTAMP>"
    )
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, "<DATE>")
    .replace(/\b\d{2}:\d{2}:\d{2}\b/g, "<TIME>")
    .replace(
      /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
      "<EMAIL>"
    )
    .replace(/\b(?:\/[^\s]+)+\b/g, "<PATH>")
    .replace(/\b\d+ms\b/gi, "<DURATION>")
    .replace(/\b\d+\.\d+\b/g, "<FLOAT>")
    .replace(/\b\d+\b/g, "<NUMBER>")
    .trim();
}

function createFingerprint(
  service: string | null,
  level: LogLevel | null,
  normalizedMessage: string
): string {
  return `${service ?? "unknown"}|${level ?? "unknown"}|${normalizedMessage}`;
}

export function normalizeLogs(logs: ParsedLog[]): NormalizedLog[] {
  return logs.map((log): NormalizedLog => {
    const normalizedMessage = normalizeMessage(log.message);

    return {
      ...log,
      normalizedMessage,
      fingerprint: createFingerprint(
        log.service,
        log.level,
        normalizedMessage
      ),
    };
  });
}
