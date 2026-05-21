import type { AggregatedEvent, LogLevel, ScoredEvent } from "../types/index.js";



function getLevelScore(level: LogLevel | null): number {
  switch (level) {
    case "ERROR":
      return 100;

    case "WARN":
      return 50;

    case "INFO":
      return 10;

    case "DEBUG":
      return 5;

    case "TRACE":
      return 1;

    default:
      return 0;
  }
}

function getSeverityLabel(
  score: number
): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (score >= 300) {
    return "CRITICAL";
  }

  if (score >= 180) {
    return "HIGH";
  }

  if (score >= 80) {
    return "MEDIUM";
  }

  return "LOW";
}

export function scoreEvents(
  events: AggregatedEvent[]
): ScoredEvent[] {
  const scored: ScoredEvent[] = events.map((event) => {
    let score = 0;

    const reasons: string[] = [];

    const levelScore = getLevelScore(event.level);

    score += levelScore;

    if (levelScore > 0) {
      reasons.push(
        `Log level ${event.level} contributed ${levelScore}`
      );
    }

    const countScore = Math.min(event.count * 2, 100);

    score += countScore;

    if (event.count > 10) {
      reasons.push(
        `High occurrence count (${event.count})`
      );
    }

    const hasStackTrace = event.logs.some(
      (log) =>
        typeof log.stackTrace === "string" &&
        log.stackTrace.trim().length > 0
    );

    if (hasStackTrace) {
      score += 75;

      reasons.push("Stack trace detected");
    }

    if (event.services.length > 1) {
      score += 40;

      reasons.push(
        `Multiple services affected (${event.services.length})`
      );
    }

    const hasErrorKeywords =
      /(timeout|exception|failed|refused|crash|panic|unavailable)/i.test(
        event.normalizedMessage
      );

    if (hasErrorKeywords) {
      score += 50;

      reasons.push(
        "Critical error keywords detected"
      );
    }

    return {
      ...event,

      severityScore: score,

      severityLabel: getSeverityLabel(score),

      reasons,
    };
  });

  return scored.sort(
    (a, b) => b.severityScore - a.severityScore
  );
}
