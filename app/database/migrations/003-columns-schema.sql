-- Kanban columns. Each workspace gets three by default at first-time
-- signup (To do / In progress / Done), inserted at consume time in the
-- same transaction as the workspace + member rows (see
-- app/features/auth/consumeMagicLink.server.ts).
--
-- position is a sparse-spaced integer (defaults at 1024 / 2048 / 3072).
-- Midpoint values are taken for reorders. If the gap collapses, the
-- workspace columns can be re-spaced. No UNIQUE constraint on
-- (workspace_id, position) because reorder operations need to write two
-- rows in close sequence without deadlocking on the index.

CREATE TABLE columns (
  id           uuid        NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid        NOT NULL,
  name         text        NOT NULL,
  position     integer     NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT columns_pkey         PRIMARY KEY (id),
  CONSTRAINT columns_workspace_fk FOREIGN KEY (workspace_id)
               REFERENCES workspaces (id) ON DELETE CASCADE
);

CREATE INDEX idx_columns_workspace_id          ON columns (workspace_id);
CREATE INDEX idx_columns_workspace_id_position ON columns (workspace_id, position);
