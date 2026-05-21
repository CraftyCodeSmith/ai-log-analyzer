import { LEVEL_MAP, type LogLevel, type ParsedLog } from "../types/index.js";

function normalizeLevel(level?: string): LogLevel | null {
  if (!level) {
    return null;
  }

  return LEVEL_MAP[level.toUpperCase()] ?? null;
}

function extractMetadata(text: string): Record<string, string> {
  const metadata: Record<string, string> = {};

  const regex = /(\w+)=("[^"]*"|'[^']*'|[^\s]+)/g;

  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const key = match[1];
    const rawValue = match[2];

    if (!key || !rawValue) {
      continue;
    }

    const value = rawValue.replace(/^['"]|['"]$/g, "");

    metadata[key] = value;
  }

  return metadata;
}

function isJson(line: string): boolean {
  const trimmed = line.trim();

  return trimmed.startsWith("{") && trimmed.endsWith("}");
}

function isNewLogLine(line: string): boolean {
  return (
    /^\[?\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(line) ||
    /^\[Nest\]/.test(line) ||
    isJson(line)
  );
}

function splitEntries(logText: string): string[] {
  const lines = logText.split("\n");

  const entries: string[] = [];

  let current = "";

  for (const line of lines) {
    if (isNewLogLine(line)) {
      if (current.trim()) {
        entries.push(current.trim());
      }

      current = line;
    } else {
      current += `\n${line}`;
    }
  }

  if (current.trim()) {
    entries.push(current.trim());
  }

  return entries;
}

function buildParsedLog(params: {
  timestamp: string | null;
  level: LogLevel | null;
  service: string | null;
  fullMessage: string;
  metadata?: Record<string, string>;
  raw: string;
}): ParsedLog {
  const {
    timestamp,
    level,
    service,
    fullMessage,
    metadata = {},
    raw,
  } = params;

  const parts = fullMessage.split("\n");

  const message = parts[0]?.trim() ?? "";

  const stackTrace = parts.slice(1).join("\n").trim();

  const parsed: ParsedLog = {
    timestamp,
    level,
    service,
    message,
    metadata,
    raw,
  };

  if (stackTrace.length > 0) {
    parsed.stackTrace = stackTrace;
  }

  return parsed;
}

function parseJsonLog(entry: string): ParsedLog | null {
  try {
    const parsedJson = JSON.parse(entry);

    const timestamp =
      parsedJson.timestamp ??
      parsedJson.time ??
      parsedJson.ts ??
      null;

    const level = normalizeLevel(
      parsedJson.level?.toString() ??
        parsedJson.severity ??
        parsedJson.lvl
    );

    const message = parsedJson.message ?? parsedJson.msg ?? "";

    const service =
      parsedJson.service ??
      parsedJson.context ??
      parsedJson.module ??
      null;

    return buildParsedLog({
      timestamp,
      level,
      service,
      fullMessage: message,
      metadata: extractMetadata(JSON.stringify(parsedJson)),
      raw: entry,
    });
  } catch {
    return null;
  }
}

function parseNestJs(entry: string): ParsedLog | null {
  const regex =
    /^\[Nest\]\s+\d+\s+-\s+(.+?)\s+(LOG|ERROR|WARN|DEBUG|VERBOSE)\s+\[(.+?)\]\s+([\s\S]*)$/;

  const match = entry.match(regex);

  if (!match) {
    return null;
  }

  const timestamp = match[1] ?? null;

  const level = normalizeLevel(match[2]);

  const service = match[3] ?? null;

  const fullMessage = match[4] ?? "";

  return buildParsedLog({
    timestamp,
    level,
    service,
    fullMessage,
    metadata: extractMetadata(fullMessage),
    raw: entry,
  });
}

function parseDockerLog(entry: string): ParsedLog | null {
  const regex =
    /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s+(stdout|stderr)\s+\w\s+([\s\S]*)$/;

  const match = entry.match(regex);

  if (!match) {
    return null;
  }

  const timestamp = match[1] ?? null;

  const stream = match[2];

  const content = match[3] ?? "";

  return buildParsedLog({
    timestamp,
    level: stream === "stderr" ? "ERROR" : "INFO",
    service: "docker",
    fullMessage: content,
    raw: entry,
  });
}

function parseWinston(entry: string): ParsedLog | null {
  const regex =
    /^\[?([0-9T:.\-Z]+)\]?\s+(info|error|warn|debug|trace):?\s+([\s\S]*)$/i;

  const match = entry.match(regex);

  if (!match) {
    return null;
  }

  const timestamp = match[1] ?? null;

  const level = normalizeLevel(match[2]);

  const fullMessage = match[3] ?? "";

  return buildParsedLog({
    timestamp,
    level,
    service: "winston",
    fullMessage,
    metadata: extractMetadata(fullMessage),
    raw: entry,
  });
}

function parsePlainText(entry: string): ParsedLog | null {
  const regex =
    /^\[?([0-9T:.\-Z\s]+)\]?\s+(\w+)\s+\[?([\w.-]+)\]?\s+([\s\S]*)$/;

  const match = entry.match(regex);

  if (!match) {
    return null;
  }

  const timestamp = match[1] ?? null;

  const level = normalizeLevel(match[2]);

  const service = match[3] ?? null;

  const fullMessage = match[4] ?? "";

  return buildParsedLog({
    timestamp,
    level,
    service,
    fullMessage,
    metadata: extractMetadata(fullMessage),
    raw: entry,
  });
}

function parseEntry(entry: string): ParsedLog {
  const parsers = [
    parseJsonLog,
    parseNestJs,
    parseDockerLog,
    parseWinston,
    parsePlainText,
  ];

  for (const parser of parsers) {
    const parsed = parser(entry);

    if (parsed) {
      return parsed;
    }
  }

  return {
    timestamp: null,
    level: null,
    service: null,
    message: entry,
    metadata: {},
    raw: entry,
  };
}

export function parseLogs(logText: string): ParsedLog[] {
  const entries = splitEntries(logText);

  return entries.map(parseEntry);
}