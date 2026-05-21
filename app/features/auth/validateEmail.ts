import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1)
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());

export function parseEmail(input: unknown): string | null {
  const result = emailSchema.safeParse(input);
  return result.success ? result.data : null;
}
