import type { ScoredEvent, TimelineEvent } from "../types/index.js";

export interface Timeline {
  startTime: string | null;
  endTime: string | null;

  totalEvents: number;

  criticalEvents: number;

  events: TimelineEvent[];
}

export function buildTimeline(
  scoredEvents: ScoredEvent[]
): Timeline {
  const timelineEvents: TimelineEvent[] = [];

  for (const event of scoredEvents) {
    const timestamp =
      event.firstSeen ??
      event.lastSeen;

    if (!timestamp) {
      continue;
    }

    timelineEvents.push({
      timestamp,

      severityScore: event.severityScore,

      severityLabel: event.severityLabel,

      service:
        event.services[0] ?? "unknown",

      level: event.level,

      summary:
        event.normalizedMessage,

      count: event.count,

      fingerprint: event.fingerprint,

      reasons: event.reasons,
    });
  }

  timelineEvents.sort((a, b) => {
    return (
      new Date(a.timestamp).getTime() -
      new Date(b.timestamp).getTime()
    );
  });

  const criticalEvents =
    timelineEvents.filter(
      (e) =>
        e.severityLabel ===
          "CRITICAL" ||
        e.severityLabel === "HIGH"
    ).length;

  return {
    startTime:
      timelineEvents[0]?.timestamp ??
      null,

    endTime:
      timelineEvents[
        timelineEvents.length - 1
      ]?.timestamp ?? null,

    totalEvents: timelineEvents.length,

    criticalEvents,

    events: timelineEvents,
  };
}
