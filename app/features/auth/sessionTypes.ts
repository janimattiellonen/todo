import type { UserId } from "~/features/users/usersTypes";
import type {
  WorkspaceId,
  WorkspaceRole,
} from "~/features/workspaces/workspacesTypes";
import type { Branded } from "~/types";

export type SessionId = Branded<string, "SessionId">;

export function toSessionId(value: string): SessionId {
  return value as SessionId;
}

/** Result of a successful `requireSession` — branded user/workspace identifiers + role. */
export type Session = {
  sessionId: SessionId;
  userId: UserId;
  workspaceId: WorkspaceId;
  role: WorkspaceRole;
};
