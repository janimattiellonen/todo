import type { Branded } from "~/types";

export type WorkspaceId = Branded<string, "WorkspaceId">;

export function toWorkspaceId(value: string): WorkspaceId {
  return value as WorkspaceId;
}

export const workspaceRoles = ["admin", "user"] as const;

export type WorkspaceRole = (typeof workspaceRoles)[number];
