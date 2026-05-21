import type { AggregatedEvent, LogLevel, NormalizedLog } from "../types/index.js";


export function aggregateLogs(
  logs: NormalizedLog[]
): AggregatedEvent[] {
  const map = new Map<string, AggregatedEvent>();

  for (const log of logs) {
    const existing = map.get(log.fingerprint);

    if (!existing) {
      map.set(log.fingerprint, {
        fingerprint: log.fingerprint,
        normalizedMessage: log.normalizedMessage,
        level: log.level,

        count: 1,

        firstSeen: log.timestamp,
        lastSeen: log.timestamp,

        services: log.service ? [log.service] : [],

        samples: [log.raw],

        logs: [log],
      });

      continue;
    }

    existing.count += 1;

    existing.logs.push(log);

    if (
      log.service &&
      !existing.services.includes(log.service)
    ) {
      existing.services.push(log.service);
    }

    if (existing.samples.length < 5) {
      existing.samples.push(log.raw);
    }

    if (
      log.timestamp &&
      (!existing.firstSeen ||
        log.timestamp < existing.firstSeen)
    ) {
      existing.firstSeen = log.timestamp;
    }

    if (
      log.timestamp &&
      (!existing.lastSeen ||
        log.timestamp > existing.lastSeen)
    ) {
      existing.lastSeen = log.timestamp;
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const levelWeight = (level: LogLevel | null): number => {
      switch (level) {
        case "ERROR":
          return 4;
        case "WARN":
          return 3;
        case "INFO":
          return 2;
        case "DEBUG":
          return 1;
        case "TRACE":
          return 0;
        default:
          return 0;
      }
    };

    const scoreA =
      a.count * 10 + levelWeight(a.level) * 100;

    const scoreB =
      b.count * 10 + levelWeight(b.level) * 100;

    return scoreB - scoreA;
  });
}
