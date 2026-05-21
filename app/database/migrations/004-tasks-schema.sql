-- Tasks live in a column inside a workspace.
--
-- position is numeric so midpoint inserts can repeat indefinitely
-- without forcing a re-spacing pass (initial scheme will be picked by
-- the task-move feature in #21).
--
-- Cascade policy (per project-plan §6):
--   workspace_id      ON DELETE CASCADE   tasks are workspace data
--   column_id         ON DELETE RESTRICT  matches the "delete column
--                                         only when empty" rule, as
--                                         schema-level defense in depth
--   assignee_user_id  ON DELETE SET NULL  removing a user does not
--                                         delete their assignments

CREATE TABLE tasks (
  id               uuid        NOT NULL DEFAULT gen_random_uuid(),
  workspace_id     uuid        NOT NULL,
  column_id        uuid        NOT NULL,
  title            text        NOT NULL,
  description      text,
  assignee_user_id uuid,
  due_date         date,
  archived         boolean     NOT NULL DEFAULT false,
  position         numeric     NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tasks_pkey         PRIMARY KEY (id),
  CONSTRAINT tasks_workspace_fk FOREIGN KEY (workspace_id)
                 REFERENCES workspaces (id) ON DELETE CASCADE,
  CONSTRAINT tasks_column_fk    FOREIGN KEY (column_id)
                 REFERENCES columns (id) ON DELETE RESTRICT,
  CONSTRAINT tasks_assignee_fk  FOREIGN KEY (assignee_user_id)
                 REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_tasks_workspace_id          ON tasks (workspace_id);
CREATE INDEX idx_tasks_column_id             ON tasks (column_id);
CREATE INDEX idx_tasks_column_id_position    ON tasks (column_id, position);
