import type { Branded } from "~/types";

export type UserId = Branded<string, "UserId">;

export function toUserId(value: string): UserId {
  return value as UserId;
}
