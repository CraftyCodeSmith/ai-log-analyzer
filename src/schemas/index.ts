import z from "zod";

export const analyzeLogSchema = z.object({
  logs: z
    .string()
    .min(1, "Logs are required")
    .max(50000, "Logs too large"),

  source: z.string().optional(),
});
