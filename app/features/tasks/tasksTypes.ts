import type { Branded } from "~/types";

export type TaskId = Branded<string, "TaskId">;

export function toTaskId(value: string): TaskId {
  return value as TaskId;
}
