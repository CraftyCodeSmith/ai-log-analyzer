import type { BuildLLMPromptOptions } from "../types/index.js";
import type { Timeline } from "./buildTimeline.js";



export function buildLLMPrompt(
  timeline: Timeline,
  options?: BuildLLMPromptOptions
): string {
  const maxEvents =
    options?.maxEvents ?? 10;

  const includeReasons =
    options?.includeReasons ?? true;

  const lines: string[] = [];

  lines.push(`
You are an expert distributed systems log analyzer.

Your task:
- analyze production logs
- identify the most likely root cause
- determine severity
- identify affected components
- recommend actionable fixes

Rules:
- prioritize evidence over speculation
- focus on the most critical events
- identify cascading failures
- keep explanations concise
- do not hallucinate missing infrastructure
- use only evidence from provided logs

Return ONLY valid JSON.

Required JSON schema:

{
  "summary": "string",
  "rootCause": "string",
  "severity": "low" | "medium" | "high" | "critical",
  "probableFixes": ["string"],
  "affectedComponents": ["string"]
}
`);

  lines.push("");

  lines.push("=== INCIDENT OVERVIEW ===");

  lines.push(
    `Start Time: ${timeline.startTime ?? "unknown"}`
  );

  lines.push(
    `End Time: ${timeline.endTime ?? "unknown"}`
  );

  lines.push(
    `Total Events: ${timeline.totalEvents}`
  );

  lines.push(
    `Critical Events: ${timeline.criticalEvents}`
  );

  lines.push("");

  lines.push("=== IMPORTANT EVENTS ===");

  const importantEvents =
    timeline.events
      .sort(
        (a, b) =>
          b.severityScore -
          a.severityScore
      )
      .slice(0, maxEvents);

  for (const event of importantEvents) {
    lines.push("");

    lines.push(
      `[${event.severityLabel}] ${event.timestamp}`
    );

    lines.push(
      `Service: ${event.service}`
    );

    lines.push(
      `Level: ${event.level ?? "UNKNOWN"}`
    );

    lines.push(
      `Occurrences: ${event.count}`
    );

    lines.push(
      `Issue: ${event.summary}`
    );

    lines.push(
      `Severity Score: ${event.severityScore}`
    );

    if (
      includeReasons &&
      event.reasons.length > 0
    ) {
      lines.push("Indicators:");

      for (const reason of event.reasons) {
        lines.push(`- ${reason}`);
      }
    }
  }

  lines.push("");

  lines.push(
    "Analyze the incident and return the JSON response."
  );

  return lines.join("\n");
}
