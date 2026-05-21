import type { Branded } from "~/types";

export type ColumnId = Branded<string, "ColumnId">;

export function toColumnId(value: string): ColumnId {
  return value as ColumnId;
}

/** Default columns created at first-time signup, in display order. */
export const DEFAULT_COLUMNS: readonly { name: string; position: number }[] = [
  { name: "To do", position: 1024 },
  { name: "In progress", position: 2048 },
  { name: "Done", position: 3072 },
];
