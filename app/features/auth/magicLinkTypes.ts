import type { Branded } from "~/types";

export type MagicLinkTokenId = Branded<string, "MagicLinkTokenId">;

export function toMagicLinkTokenId(value: string): MagicLinkTokenId {
  return value as MagicLinkTokenId;
}
