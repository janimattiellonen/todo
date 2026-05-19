import { createSqlTag } from "slonik";
import { z } from "zod";

export const sql = createSqlTag({
  typeAliases: {
    void: z.strictObject({}),
    id: z.strictObject({ id: z.string() }),
  },
});
