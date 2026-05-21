import { z } from "zod";

const TITLE_MAX = 200;
const DESCRIPTION_MAX = 2000;

/**
 * Zod schema for an add-task form submission.
 *
 * Empty strings for the optional fields are normalised to `null` so the
 * orchestrator can pass them straight into the INSERT.
 */
const schema = z.object({
  columnId: z.string().uuid(),
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(TITLE_MAX, `Title must be at most ${TITLE_MAX} characters.`),
  description: z
    .string()
    .trim()
    .max(
      DESCRIPTION_MAX,
      `Description must be at most ${DESCRIPTION_MAX} characters.`,
    )
    .transform((s) => (s.length === 0 ? null : s))
    .nullable(),
  assigneeUserId: z
    .union([z.string().uuid(), z.literal(""), z.null(), z.undefined()])
    .transform((v) => (v === "" || v === undefined || v === null ? null : v)),
  dueDate: z
    .union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be YYYY-MM-DD."),
      z.literal(""),
      z.null(),
      z.undefined(),
    ])
    .transform((v) => (v === "" || v === undefined || v === null ? null : v)),
});

export type NewTaskInput = z.infer<typeof schema>;

export type ValidationResult =
  | { ok: true; value: NewTaskInput }
  | { ok: false; error: string };

export function validateNewTaskInput(raw: unknown): ValidationResult {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    return { ok: false, error: first?.message ?? "Invalid input." };
  }
  return { ok: true, value: result.data };
}

export function parseFormData(formData: FormData): unknown {
  return {
    columnId: formData.get("column_id"),
    title: formData.get("title"),
    description: formData.get("description"),
    assigneeUserId: formData.get("assignee_user_id"),
    dueDate: formData.get("due_date"),
  };
}
