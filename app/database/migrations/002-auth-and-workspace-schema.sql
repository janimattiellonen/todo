-- Auth + workspace identity tables.
--
-- workspace_members.role is constrained to the two roles defined in SPEC §3.
-- Tokens (magic-link and session) are stored as SHA-256 hex hashes, never
-- plaintext (see SPEC.md Decision Log 2026-05-20 entry on token storage).
-- Auth-table FKs cascade on user delete: magic-link tokens, sessions, and
-- workspace memberships have no meaning without their user.

CREATE TABLE users (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  email       text        NOT NULL,
  name        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey     PRIMARY KEY (id),
  CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TABLE workspaces (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workspaces_pkey PRIMARY KEY (id)
);

CREATE TABLE workspace_members (
  workspace_id uuid        NOT NULL,
  user_id      uuid        NOT NULL,
  role         text        NOT NULL,
  joined_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workspace_members_pkey         PRIMARY KEY (workspace_id, user_id),
  CONSTRAINT workspace_members_workspace_fk FOREIGN KEY (workspace_id)
               REFERENCES workspaces (id) ON DELETE CASCADE,
  CONSTRAINT workspace_members_user_fk      FOREIGN KEY (user_id)
               REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT chk_workspace_members_role     CHECK (role IN ('admin', 'user'))
);

CREATE INDEX idx_workspace_members_user_id ON workspace_members (user_id);

CREATE TABLE magic_link_tokens (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL,
  token_hash  text        NOT NULL,
  expires_at  timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT magic_link_tokens_pkey    PRIMARY KEY (id),
  CONSTRAINT uq_magic_link_tokens_hash UNIQUE (token_hash),
  CONSTRAINT magic_link_tokens_user_fk FOREIGN KEY (user_id)
               REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_magic_link_tokens_user_id ON magic_link_tokens (user_id);

CREATE TABLE sessions (
  id           uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL,
  workspace_id uuid        NOT NULL,
  token_hash   text        NOT NULL,
  expires_at   timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sessions_pkey          PRIMARY KEY (id),
  CONSTRAINT uq_sessions_token_hash UNIQUE (token_hash),
  CONSTRAINT sessions_user_fk       FOREIGN KEY (user_id)
               REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT sessions_workspace_fk  FOREIGN KEY (workspace_id)
               REFERENCES workspaces (id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id      ON sessions (user_id);
CREATE INDEX idx_sessions_workspace_id ON sessions (workspace_id);
