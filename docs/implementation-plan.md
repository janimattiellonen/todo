# Implementation Plan — Kanban TODO MVP

> Grounded in [`docs/project-plan.md`](./project-plan.md) and [`SPEC.md`](../SPEC.md).
> Status: Draft · Last updated: 2026-05-15
> Granularity rule: every task is S or M (1–5 files). XL tasks are decomposed further.
> **Revision 2026-05-15 (later same day):** Aligned with reference project. Switched migration tool to a custom Slonik-based runner (Task 1.4); TypeScript now extends `@tsconfig/strictest`; pnpm replaces npm everywhere; Pino added. StyleX risk downgraded — reference project's setup is copyable. See SPEC.md decision log for the four 2026-05-15 entries.
> **Revision 2026-05-15 (later still):** Added **Phase 0 — UI Prototype (throwaway)** at the very top. Plain HTML/CSS mockups in `prototype/`, no build step, time-boxed to two sessions. Output: `docs/design-tokens.md`. Then `prototype/` is deleted. Reason: planner has no Figma source — early visual alignment is cheaper than redoing UI mid-Phase-2.

---

## Overview

Build the personal/portfolio Kanban MVP described in the project plan and spec. Local-only, no production hosting. Each phase ships a vertical slice that leaves the system in a working, demoable state — never a half-wired horizontal layer.

The single most important non-functional outcome is **Risk #2** (agentic dev produces unmaintainable code). The plan structures around it: every task has explicit acceptance criteria, verification gates run after every task, and a checkpoint sits between every phase.

A deliberate **mid-build motivation checkpoint** sits between Phase 4 (planner-personal-use complete) and Phase 5 (team-shaped plumbing for users who may never exist) — per project plan §15.4. That boundary is where motivation collapse (Risk #1b) is most likely.

## Architecture decisions (reference, not re-decided)

All locked in `SPEC.md` §2 and §7. Not re-litigated here. Pointers only:

- React Router 7 framework mode (`ssr: true`), Node LTS, TypeScript extending `@tsconfig/strictest`, single app.
- Slonik + Zod row validation; **custom Slonik-based migration runner** (forward-only, plain SQL in `app/database/migrations/`).
- StyleX (`@stylexjs/stylex` + `vite-plugin-stylex`) for styling, Biome for lint/format, **pnpm** as package manager, **Pino** for logging.
- Vitest two-project split (`*.unit.test.*` parallel / `*.integration.test.*` sequential isolated, real Docker Postgres on 5433), Playwright for 3 E2E flows.
- Defer to `.claude/skills/project-conventions/SKILL.md` and `.claude/skills/tests/SKILL.md` verbatim.

## Dependency graph (high level)

```
Phase 0 (UI prototype — throwaway) ───┐
                                      │  ← outputs docs/design-tokens.md
Phase 1 (foundation) ─────────────────┘
                                      │
═══════ Pre-Phase-2 design review ═══════ (verifies tokens are ready)
                                      │
Phase 2 (auth → empty board) ─────────┘
                                      │
Phase 3 (tasks on board) ───┐         │  ← planner's first usable build
                            │         │
Phase 4 (archive) ──────────┘         │  ← planner can dogfood
                                      │
═══════════════ Motivation checkpoint ═══════════════
                                      │
Phase 5 (invitations) ────────────────┘   ← team-shaped plumbing starts
                                      │
Phase 6 (user management) ────────────┘
                                      │
Phase 7 (column management) ──────────┘
                                      │
Phase 8 (launch polish) ──────────────┘
```

Each phase is sequential. Inside a phase, tasks are mostly sequential too — vertical slicing makes parallelism rarely worth the coordination tax for a solo dev.

Phase 0 and Phase 1 can technically run in parallel (Phase 0 has zero overlap with the real codebase), but realistically Phase 0 happens first — it's so cheap there's no value in interleaving.

---

## Phase 0 — UI Prototype (throwaway)

**Goal:** before a single line of production UI is written, agree on the look and the functional layout of the board with the planner. Output: a one-page `docs/design-tokens.md`. (Originally: "and *no other surviving artefact*" — softened on 2026-05-15: the planner kept `prototype/` as a visual reference. The doc remains the source of truth; the HTML is for human review only — see revised Task 0.5.)

**Constraints (strict):**
- **No build step. No npm install. No framework.** Plain `.html` + `.css` files in `prototype/`.
- **No production-code patterns.** No `app/ui/`, no StyleX, no branded types, no `project-conventions` skill compliance. **Code quality bar: zero.** This is a sketch, not a building.
- **Hardcoded data only.** Lorem-ipsum tasks, fake column names, fake user names. No DB, no auth, no JS state management beyond the simplest event handler.
- **Time-box: 2 working sessions max.** If alignment is taking longer, the issue is taste-not-yet-found, not tool-not-yet-figured-out. Pause and have a different conversation (look at real apps the planner likes).
- **Throwaway.** The `prototype/` directory is deleted before Phase 1 starts. Its only persistent output is `docs/design-tokens.md`.

### Task 0.1: Agree the screens to prototype

**Description:** Pick which views to mock up. Recommended set (6 screens):
1. Landing / sign-in page (single email input).
2. Empty board (just-signed-up state, 3 default columns, prominent "Add task" + "Invite teammates").
3. Board with tasks (multiple columns populated, one task open in a detail panel/modal).
4. Mobile board (single-column scroll, tap-menu "Move to" affordance visible).
5. Archive view (list of archived tasks).
6. User panel (admin view: list of members + invite form).

**Acceptance criteria:**
- [x] Final screen list agreed in writing (here in this doc, or a short note).
- [x] Planner has flagged any visual references they want to draw from (apps they like, screenshots, anything — gathered upfront, not mid-iteration).

**Verification:** Planner confirms the list.

**Dependencies:** None.

**Files likely touched:** This plan (the agreed list gets written under Task 0.1).

**Estimated scope:** XS.

**Agreed 2026-05-15:**
- Screen list: the 6 recommended screens, no changes.
- Visual lineage: **Linear's structure** (typography hierarchy, generous whitespace, monochromatic surfaces, 1px borders, almost no shadows). **No AI-tool aesthetic** — no purple/violet/magenta accents, no gradients, no glassmorphism.
- Accent colour: **deep teal** (target ~`#1F5862`), used sparingly (primary CTA, active states, focus rings). Single-accent discipline; all other colour from neutrals + semantic (success/warning/danger/info).
- Fonts: system sans-serif stack only (no CDN, no installs — per Phase 0 constraints).

### Task 0.2: First-pass HTML/CSS mockups

**Description:** Generate static HTML + CSS for each screen from Task 0.1 in `prototype/`. One `.html` per screen, shared `prototype/styles.css`. Use generic web-safe choices that are easy to swap later: system font stack, neutral palette, 8-px spacing grid, single accent colour. Don't try to be a designer — produce *something concrete to react to*.

**Acceptance criteria:**
- [ ] Each agreed screen has a corresponding `.html` file.
- [ ] Opening any file in a browser renders without errors.
- [ ] Files are self-contained — no CDN, no fonts that need installing.

**Verification:** Open each file in a browser; nothing broken.

**Dependencies:** 0.1.

**Files likely touched:** `prototype/*.html`, `prototype/styles.css`.

**Estimated scope:** M.

### Task 0.3: Iterate with planner

**Description:** Planner reviews mockups, gives feedback on visuals (colour, typography, density, accents) and functional layout (where things go, how the task-detail surface should look, mobile interaction model). Iterate **maximum twice**. If a third pass is needed, stop and have a different conversation about reference apps before iterating again.

**Acceptance criteria:**
- [x] Planner approves the visuals as "close enough to start the real build from".
- [ ] Any visual nits that didn't get resolved are noted in `docs/design-tokens.md` as deliberately deferred.

**Verification:** Planner says "yes" or "yes-with-notes".

**Dependencies:** 0.2.

**Files likely touched:** `prototype/*.html`, `prototype/styles.css`.

**Estimated scope:** M.

**Approved 2026-05-15 on pass 1.** Planner: "I think it generally looks good." No visual changes requested. Additional ask captured: pre-implementation checkpoint for every new UI component (now codified as a boundary in `SPEC.md` §6 and reinforced in the Pre-Phase-2 design review section below).

### Task 0.4: Distil to `docs/design-tokens.md`

**Description:** Write a one-page note in `docs/design-tokens.md` capturing the agreed design tokens. **Concrete values**, not vibes. The Phase 2 work consumes this directly — the agent will turn these values into `app/ui/tokens.stylex.ts` (or split files, per the Pre-Phase-2 review).

Recommended sections:
- **Colour palette.** Hex values for primary, surface (1–3 background levels), text (default / muted / inverse), semantic (success / warning / danger / info), state (hover / active / focus / disabled).
- **Typography.** Font family, scale (4–6 sizes with px values), weights, line-height ratios.
- **Spacing scale.** 4 or 8 px grid; specific values (e.g. `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`).
- **Border radius scale.** Small / medium / large pixel values.
- **Shadow scale.** Subtle / medium / strong, with exact CSS values.
- **Focus-ring style.** Concrete colour + offset + width (non-negotiable: visible focus, per plan §10 a11y).
- **Theming intent.** Light only first, dark deferred? Or both day-one?
- **Deliberately deferred.** Anything left unresolved on purpose.

**Acceptance criteria:**
- [x] All sections above either filled with concrete values or explicitly marked deferred with a reason.
- [x] No "TBD" without a deferral reason next to it.

**Verification:** Planner reads the doc and confirms it reflects what they agreed.

**Dependencies:** 0.3.

**Files likely touched:** `docs/design-tokens.md`.

**Estimated scope:** S.

**Done 2026-05-15.** `docs/design-tokens.md` written from the approved prototype's `styles.css`. Planner confirmed the doc 2026-05-15 (after a typography revision that adopted the reference project's component signatures and rewrote §2 / added §2A). On to Task 0.5.

### Task 0.5: Discard `prototype/` *(deferred — kept as visual reference)*

**Original description:** Once `docs/design-tokens.md` is approved, delete the `prototype/` directory.

**Planner decision 2026-05-15:** **Keep `prototype/` for now** — the planner may want to review the mockups during early Phase 1 / Phase 2 development. The deletion is deferred, not cancelled.

**Revised acceptance criteria:**
- [ ] When `git init` happens (Phase 1 Task 1.1), `prototype/` is **committed** as part of the initial state — so the eventual deletion is recoverable via history.
- [ ] When the planner explicitly says "delete prototype" (likely sometime during Phase 2 or early Phase 3), the directory is removed in a dedicated commit.
- [ ] **Until then, `docs/design-tokens.md` remains the source of truth.** The prototype is a *visual* reference only; if `prototype/styles.css` and `docs/design-tokens.md` disagree, the doc wins.

**Note for the agent:** **Do not** treat the prototype HTML / CSS as a copy-paste source for the real implementation. Phase 2 work consumes `docs/design-tokens.md` and the `project-conventions` skill — not `prototype/styles.css`. The prototype is for the *planner* to look at; the *agent* uses the canonical artefacts.

**Dependencies:** 0.4.

**Files likely touched:** None for now.

**Estimated scope:** XS (when eventually run).

### Checkpoint: Phase 0 complete

- [x] `docs/design-tokens.md` exists and is approved by the planner.
- [ ] ~~`prototype/` is gone.~~ **Deferred** — kept as a visual reference during early development; will be removed when the planner says so (see revised Task 0.5).
- [x] Planner has visual confidence to start Phase 1 (foundation) and the design review preceding Phase 2.

**A warning about Phase 0 scope creep:** the temptation will be to add "just one more screen" or "let me also style the columns properly". **Resist.** Phase 0 is alignment, not delivery. Two sessions max. The real visuals get built in Phase 2 with the agreed tokens; that's where the polish lives.

---

## Phase 1 — Foundation

Goal: empty app runs locally, tests run, DB migrates, E2E smoke passes. Boring, mechanical. The point is that every later task assumes this works.

### Task 1.1: Bootstrap React Router 7 + TypeScript + path alias

**Description:** Initialise the React Router 7 framework-mode project (`ssr: true`), TypeScript extending `@tsconfig/strictest`, the `~/` → `app/` path alias, pnpm as package manager, and a working dev server. Copy the reference project's `tsconfig.json`, `vite.config.ts`, and `react-router.config.ts` as the starting point.

**Acceptance criteria:**
- [ ] `pnpm run dev` serves a placeholder page on `localhost`.
- [ ] `tsconfig.json` extends `@tsconfig/strictest` and the `~/*` path alias resolves.
- [ ] `pnpm run types` runs and passes on the empty app.

**Verification:** `pnpm run dev` opens a page; `pnpm run types` exits 0.

**Dependencies:** None.

**Files likely touched:** `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `vite.config.ts`, `react-router.config.ts`, `app/root.tsx`, `app/routes/_index.tsx`, `app/entry.client.tsx`, `app/entry.server.tsx`.

**Estimated scope:** M.

### Task 1.2: Add Biome lint + format

**Description:** Configure Biome with rules matching the reference project. Copy `biome.jsonc` from the reference as the starting point. Wire `pnpm run lint`, `lint:fix`, `format`, `format:fix`.

**Acceptance criteria:**
- [ ] `biome.jsonc` exists and matches reference-project conventions.
- [ ] `pnpm run lint` exits 0 on the bootstrapped code.
- [ ] `pnpm run format` writes deterministic output.

**Verification:** `pnpm run lint` passes; format is idempotent (running twice produces no diff).

**Dependencies:** 1.1.

**Files likely touched:** `biome.jsonc`, `package.json`.

**Estimated scope:** S.

### Task 1.3: Docker Postgres on port 5433

**Description:** `docker-compose.yml` with Postgres 16 (or current LTS) on host port `5433`. Add `pnpm run db:start`, `db:stop`, `db:psql` scripts. Persistent volume so data survives restarts. Two databases: one for `.env` (dev), one for `.env.test` (integration tests).

**Acceptance criteria:**
- [ ] `pnpm run db:start` brings Postgres up; `psql -h localhost -p 5433` connects.
- [ ] DB credentials live in `.env` and `.env.test` (gitignored) with checked-in `.env.example` and `.env.test.example`.
- [ ] `pnpm run db:stop` cleanly stops the container.

**Verification:** Round-trip — start, connect, create a table, stop, start, table still there.

**Dependencies:** 1.1.

**Files likely touched:** `docker-compose.yml`, `.env.example`, `.env.test.example`, `.gitignore`, `package.json`.

**Estimated scope:** S.

### Task 1.4: Custom Slonik migration runner + first migration

**Description:** Copy the reference project's migration approach: `app/database/runMigrations.server.ts` (the ~70-line Slonik-based runner), `app/scripts/migrate.server.ts` (the script entry point), `app/scripts/runScript.server.ts` (shared harness with config + logger). Migrations are plain SQL files in `app/database/migrations/`, numbered `001-…sql`, `002-…sql`. State tracked in a `_migrations` table the runner creates on first run. **Forward-only — no `migrate:down`.**

Add `pnpm run script:db:migrate` and `pnpm run script:db:migrate:test` scripts using `tsx --env-file=`.

Create an initial no-op migration (e.g. `001-init.sql` with a single comment) to verify the toolchain end-to-end.

**Acceptance criteria:**
- [ ] `pnpm run script:db:migrate` applies pending migrations against the Docker DB.
- [ ] `pnpm run script:db:migrate:test` applies pending migrations against the test DB.
- [ ] Running migrations twice is idempotent (second run logs "skip: already applied").
- [ ] The `_migrations` table tracks applied migrations.

**Verification:** Run migrations twice; second run logs all-skipped; `_migrations` table shows the applied filenames.

**Dependencies:** 1.3, 1.5 (Slonik pool must exist first — note the dependency reversal vs original plan).

**Files likely touched:** `app/database/runMigrations.server.ts`, `app/database/migrations/001-init.sql`, `app/scripts/migrate.server.ts`, `app/scripts/runScript.server.ts`, `package.json`.

**Estimated scope:** M.

### Task 1.5: Slonik pool + Zod row validation pattern

**Description:** Add Slonik. Create the pool factory at `app/database/pool.server.ts` (matching the reference project's location). Add `app/config/` with env parsing (DB URL). Add Pino logger setup at `app/config/logger.server.ts` (or wherever the reference puts it). Demonstrate the Zod row-validation pattern on a throwaway `SELECT 1` query.

**Note:** This task is a prerequisite for Task 1.4 (the migration runner uses Slonik). Build order is 1.3 → 1.5 → 1.4.

**Acceptance criteria:**
- [ ] Slonik pool can be created from a DATABASE_URL env var.
- [ ] Zod parser pattern is demonstrated (a Zod schema wired into a Slonik type-parser, per the reference project's `runMigrations.server.ts` pattern).
- [ ] Pino logger is configured with `pino-pretty` in dev.

**Verification:** A trivial script (or REPL test) opens the pool, runs `SELECT 1`, validates with Zod, logs the result via Pino.

**Dependencies:** 1.3.

**Files likely touched:** `app/database/pool.server.ts`, `app/database/sql.server.ts`, `app/config/`, `app/scripts/runScript.server.ts` (shared harness), `package.json`.

**Estimated scope:** M.

### Task 1.6: Vitest setup (two-project split)

**Description:** Configure Vitest with two projects, copying the reference project's `vitest.config.ts`:
- **Unit tests:** `*.unit.test.{ts,tsx}` — jsdom, parallel, no isolation needed.
- **Integration tests:** `*.integration.test.{ts,tsx}` — node, sequential (`fileParallelism: false`), `isolate: true`, real Postgres via `.env.test`.

Add `app/test/{unit,integration}/setup.ts` + `app/test/integration/globalSetup.ts` (runs migrations against test DB once before all integration tests).

**Decide isolation strategy here:** per-test transaction rollback is the recommended default. If that produces hard-to-debug failures, fall back to truncate-and-reseed. Document the choice in SPEC.md §8 once chosen.

**Acceptance criteria:**
- [ ] `pnpm run test:run` runs all Vitest tests across both projects.
- [ ] `pnpm run test:run:integration` runs only the integration project.
- [ ] One sample `*.unit.test.ts` and one sample `*.integration.test.ts` exist as templates.
- [ ] Integration tests do not leak state between runs (running 10× produces identical results).

**Verification:** `pnpm run test:run` green; rerun 10× without flake.

**Dependencies:** 1.4, 1.5.

**Files likely touched:** `vitest.config.ts`, `app/test/unit/setup.ts`, `app/test/integration/globalSetup.ts`, `app/test/integration/setup.ts`, `app/test/database/`, example tests.

**Estimated scope:** M.

### Task 1.7: Playwright setup + smoke test

**Description:** Install Playwright, point it at the local dev server, write one smoke test that navigates to `/` and asserts the page renders.

**Acceptance criteria:**
- [ ] `pnpm run e2e` boots the app, hits `/`, asserts a known element exists.
- [ ] Test runs headless in CI-friendly mode by default.

**Verification:** `pnpm run e2e` exits 0.

**Dependencies:** 1.1.

**Files likely touched:** `playwright.config.ts`, `e2e/smoke.spec.ts`, `package.json`.

**Estimated scope:** S.

### Task 1.8: StyleX + Vite plugin

**Description:** Install `@stylexjs/stylex` and `vite-plugin-stylex`. Configure the plugin in `vite.config.ts` with the `~/*` alias (per the reference project's setup). Copy the reference's exact plugin invocation. Prove a styled component renders.

**Acceptance criteria:**
- [ ] One demo component on the placeholder page is styled via StyleX.
- [ ] Build outputs the CSS correctly (no FOUC in dev or build).
- [ ] `vitest.config.ts` also includes the StyleX plugin (so component tests can render styled components — reference project does this).

**Verification:** Visual confirmation in browser + `pnpm run build` succeeds.

**Dependencies:** 1.1.

**Files likely touched:** `vite.config.ts`, `vitest.config.ts`, `package.json`, one demo component.

**Estimated scope:** S. *(Risk downgraded from Medium to Low — reference project has a working setup we can copy.)*

### Task 1.9: Branded types module

**Description:** Create `app/types.ts` exporting `Branded<T, B>` per `project-conventions` skill. No domain IDs yet — those come per-feature in their own `<domain>Types.ts` files.

**Acceptance criteria:**
- [ ] `~/types` is importable; `Branded<string, "Foo">` compiles.
- [ ] A trivial usage example in a unit test passes.

**Verification:** `npm run typecheck`, `npm test`.

**Dependencies:** 1.1.

**Files likely touched:** `app/types.ts`, one test.

**Estimated scope:** S.

### Task 1.10: Resend email-sender abstraction with dev mock

**Description:** Create an email-sender interface in `app/features/email/` (per `project-conventions` skill — even cross-cutting infra goes through a feature). In dev/test, the implementation logs the email + captures it in-memory for assertions. In production-ish runs (env flag), it calls Resend. Never sends real emails from `pnpm test` or `pnpm run e2e`.

**Acceptance criteria:**
- [ ] `sendEmail({ to, subject, body })` interface defined; one outbound call → one recipient (enforced at the type level, not just runtime).
- [ ] Dev mock captures sent emails in-memory for assertions; placed in `app/test/mocks/`.
- [ ] Unit test asserts the one-recipient-per-call property.

**Verification:** Unit test demonstrates type rejects an array of recipients; mock captures emails.

**Dependencies:** 1.6.

**Files likely touched:** `app/features/email/sendEmail.server.ts`, `app/test/mocks/emailTransport.ts`, `app/features/email/sendEmail.unit.test.ts`.

**Estimated scope:** M.

### Checkpoint: Foundation complete

- [ ] `pnpm run dev`, `pnpm run build`, `pnpm run types`, `pnpm run lint`, `pnpm run test:run`, `pnpm run e2e` all pass.
- [ ] `docker compose up -d` brings Postgres up on 5433; `pnpm run script:db:migrate` is idempotent.
- [ ] One integration test runs against real Postgres; one E2E test runs against real app.
- [ ] Branded types and StyleX patterns are demonstrated.
- [ ] **Review with planner before continuing.** If anything diverged from the reference project unexpectedly, surface it now.

### ═══════════════ Pre-Phase-2 design review ═══════════════

Phase 0 produced `docs/design-tokens.md`. Phase 1 produced the foundation. **Before Task 2.6 (the empty board page) ships any pixels, do these three things:**

1. **Translate `docs/design-tokens.md` into StyleX.** Write `app/ui/tokens.stylex.ts` (or split files — see point 2 below) consuming the concrete values from the design-tokens doc. No invention by the agent — every value traces back to the doc. If the doc said "deferred", the token is omitted, not improvised.

2. **Agree the StyleX implementation strategy.** Same decisions, asked once:
   - **Token file layout:** single `app/ui/tokens.stylex.ts` vs split into `colors.stylex.ts`, `typography.stylex.ts`, `spacing.stylex.ts`, `radius.stylex.ts`, `shadows.stylex.ts`. (Recommended: split — easier to scan and refactor; matches the modular shape of `docs/design-tokens.md`.)
   - **Theming:** if `docs/design-tokens.md` includes a light-only intent, scaffold `stylex.defineVars` so adding a dark theme later is mechanical, but only define the light values.
   - **Per-component convention:** `stylex.create` at the bottom of each component file (per `project-conventions`), local-only, no exported style objects.

3. **Sanity-check `app/ui/` skeletons.** The reference structure (`app/ui/{buttons, forms, navigation, feedback, primitives, typography, display}`) is empty at this point. Decide whether to stub minimum primitives now (a `<Button>` and a `<Stack>` are usually first to be needed), or grow them just-in-time as Phase 2 routes demand them. (Recommended: just-in-time. Pre-building leads to unused or wrong abstractions.)

4. **Component-implementation checkpoint protocol.** Per `SPEC.md` §6 boundary "Ask first", every new UI component (and every significant modification to an existing one) requires a pre-implementation proposal — visual + props API — and explicit approval before the component is written. This applies throughout Phases 2–8. The proposal can be lightweight (ASCII sketch, inline preview, link to the corresponding prototype screen, or a short paragraph) — the requirement is the *pause*, not the format. Trivial edits (typos, aria-label fixes, token swaps) are exempt.

Output of this review: `app/ui/tokens.stylex.ts` (or the split files) committed, and a one-line note in the Decision Log of `SPEC.md` capturing which layout (single vs split) was chosen and why.

**Without this review, the agent will improvise visuals during Phase 2 and you'll have to redo work to bring them in line later — exactly the kind of churn Risk #1b (motivation collapse) feeds on.**

---

## Phase 2 — Auth + workspace creation (Flow A)

Goal: a visitor enters their email, clicks the magic link, and lands on an empty board belonging to a freshly-created workspace where they are the sole admin.

**Open Q decision needed before starting:** **Workspace naming.** Recommended: ask for a workspace name at signup; default to `"<email-localpart>'s workspace"`. Implement here so the table schema is final from day one.

### Task 2.1: Schema — users, workspaces, workspace_members, magic_link_tokens, sessions

**Description:** One migration creating the five tables for auth + workspace identity. Include `workspace_id` on every multi-tenant table from day one (so the never-bypass-isolation rule has nothing to retrofit). Indexes for foreign keys and the obvious lookups (user email, token hash, session id).

**Acceptance criteria:**
- [ ] Migration applies cleanly up and rolls back cleanly down.
- [ ] Foreign keys cascade sensibly (deleting a workspace deletes its members; deleting a user — undecided, ask).
- [ ] All `workspace_id` columns are NOT NULL with FK to workspaces.
- [ ] Tokens are stored as **hashes**, never plaintext.

**Verification:** Migration up/down round-trip; an integration test inserts a user + workspace + member and reads them back via Slonik.

**Dependencies:** Phase 1 complete.

**Files likely touched:** One migration file, one or two integration tests.

**Estimated scope:** M.

### Task 2.2: Magic-link request flow

**Description:** `POST /auth/request` — accepts an email, generates a token, hashes and stores it with expiry, sends the magic-link email via the abstraction from 1.10. UI: a single email-form page on `/`.

**Acceptance criteria:**
- [ ] Submitting a valid email queues an email (captured by the dev mock) with a tokenised link.
- [ ] Invalid emails fail with a user-readable error; valid syntactically-but-non-existent emails still succeed silently (do not leak account existence).
- [ ] Tokens expire after a defined window (recommended: 15 minutes).
- [ ] Rate-limit on `/auth/request` per email per minute (recommended: 3/min).

**Verification:** Unit tests on the validator and token issuer. Integration test on the action end-to-end.

**Dependencies:** 2.1, 1.10.

**Files likely touched:** `app/features/auth/`, `app/routes/auth.request.tsx`, mock-transport assertions.

**Estimated scope:** M.

### Task 2.3: Magic-link consume + session creation

**Description:** `GET /auth/consume?token=…` — validates token, marks consumed, creates a session, sets a 30-day sliding cookie, redirects to the workspace board (or to workspace-creation flow if no workspace exists yet, see 2.4).

**Acceptance criteria:**
- [ ] Valid token → session cookie set, user redirected.
- [ ] Expired / consumed / unknown token → error page, no leak of which case occurred.
- [ ] Cookie is HttpOnly, Secure (in non-dev), SameSite=Lax.
- [ ] Session expiry refreshes on each request that uses it (sliding window).

**Verification:** Unit tests on token validator; integration test on full request→consume→authenticated-request cycle.

**Dependencies:** 2.2.

**Files likely touched:** `app/features/auth/`, `app/routes/auth.consume.tsx`, session helpers.

**Estimated scope:** M.

### Task 2.4: First-time signup → workspace creation

**Description:** If a magic-link consume succeeds for an email with no existing user, create user + workspace + workspace_members row (role = admin) + default columns ("To do", "In progress", "Done") atomically in one Slonik transaction. Ask for workspace name on the empty board the first time (one-time prompt), default to email-localpart's workspace.

**Acceptance criteria:**
- [ ] Atomic transaction: either all five rows insert or none do.
- [ ] Default columns appear in the new workspace with stable ordering.
- [ ] User lands on the board page with no tasks yet.

**Verification:** Integration test of the transaction; unit test of the rollback path.

**Dependencies:** 2.3, 2.1.

**Files likely touched:** `app/features/workspaces/`, one or two `query*.server.ts`, test.

**Estimated scope:** M.

### Task 2.5: Session middleware (loader-level auth)

**Description:** A helper that any loader/action can call to require authentication. Unauthenticated requests redirect to `/`. Authenticated requests get a typed `Session` object with `userId`, `workspaceId`, `role`.

**Acceptance criteria:**
- [ ] Every protected loader/action calls `requireSession(request)`; unprotected ones don't.
- [ ] Returns `{ userId, workspaceId, role }` typed with branded types.
- [ ] Used by the empty-board route from 2.4.

**Verification:** Integration tests for both authenticated and unauthenticated paths.

**Dependencies:** 2.3.

**Files likely touched:** `app/features/auth/requireSession.server.ts`, edits to existing loaders.

**Estimated scope:** S.

### Task 2.6: Empty board page

**Description:** `/board` shows the workspace's columns side-by-side, with empty drop areas. No task UI yet. Header shows workspace name + sign-out button. Visit `/board` without auth → redirect to `/`.

**Acceptance criteria:**
- [ ] Loader fetches columns scoped to the user's workspace.
- [ ] StyleX-styled three-column layout renders.
- [ ] Sign-out clears the session cookie.

**Verification:** Integration test on the loader (asserts workspace isolation); manual visual check.

**Dependencies:** 2.4, 2.5.

**Files likely touched:** `app/routes/board.tsx`, `app/features/board/`, `app/features/board/queryColumnsByWorkspace.server.ts`.

**Estimated scope:** M.

### Task 2.7: E2E — Flow A

**Description:** Playwright test: visit `/` → submit email → grab magic-link from the dev-mock transport → visit link → assert board page with three default columns is shown.

**Acceptance criteria:**
- [ ] Test green and stable (runs 10× without flakes).
- [ ] Test uses dev-mock transport, never sends real email.

**Verification:** `npm run e2e` green.

**Dependencies:** 2.6.

**Files likely touched:** `e2e/flow-a-signup.spec.ts`.

**Estimated scope:** S.

### Checkpoint: Auth + workspace complete

- [ ] Flow A E2E green.
- [ ] Workspace isolation tested: an integration test asserts user A cannot see workspace B's data.
- [ ] All quality gates pass.
- [ ] **Review with planner.** Auth/session is a high-risk surface; spend extra time spot-reading the agent's output here.

---

## Phase 3 — Tasks on board (the product is alive)

Goal: the planner can create, edit, move, and delete tasks on the board. From this phase onwards the planner can use the product daily.

### Task 3.1: Schema — tasks

**Description:** One migration adding the `tasks` table with the exact fields from plan §6: `id`, `workspace_id`, `column_id`, `title`, `description`, `assignee_user_id`, `due_date`, `archived`, `position`, timestamps. Position is a numeric used for in-column ordering.

**Acceptance criteria:**
- [ ] Migration up/down round-trips.
- [ ] FK constraints cascade sensibly (deleting a workspace deletes its tasks; deleting a user nulls the `assignee_user_id`).
- [ ] An integration test inserts and reads back a task.

**Verification:** Migration round-trip; integration test green.

**Dependencies:** Phase 2 complete.

**Files likely touched:** Migration file, one integration test.

**Estimated scope:** S.

### Task 3.2: Board loader — fetch columns + tasks

**Description:** Extend the existing board loader to return tasks grouped by column, scoped to the workspace, excluding archived tasks. **Includes an isolation test:** assert a query with workspace A's session returns no rows for workspace B.

**Acceptance criteria:**
- [ ] Loader returns `{ workspace, columns: [{ ..., tasks: [...] }] }` with explicit field selection (per `project-conventions`).
- [ ] Archived tasks are excluded.
- [ ] Within a column, tasks are ordered by `position`.
- [ ] Isolation test passes.

**Verification:** Integration test green; manual: board shows tasks once seeded.

**Dependencies:** 3.1, 2.6.

**Files likely touched:** `app/features/board/queryBoardByWorkspace.server.ts`, edits to `app/routes/board.tsx`, test.

**Estimated scope:** M.

### Task 3.3: Add task

**Description:** "Add task" affordance per column. Form: title (required), description, assignee, due date, column (preset). Action inserts the task at the bottom of the column (max position + 1).

**Acceptance criteria:**
- [ ] Submitted with title only → task appears at bottom of column.
- [ ] Submitted with empty title → validation error visible, no insert.
- [ ] Position is strictly greater than any existing task in the column.

**Verification:** Integration test for the action; unit test for the validator.

**Dependencies:** 3.2.

**Files likely touched:** `app/features/board/`, `queryInsertTask.server.ts`, form components.

**Estimated scope:** M.

### Task 3.4: Edit task

**Description:** Click a task → opens an edit form (modal or in-place — recommend modal). Update title/description/assignee/due date/column. Save calls a single action; failure leaves the form open with an error.

**Acceptance criteria:**
- [ ] All five editable fields can be updated.
- [ ] Update persists across reload.
- [ ] Validation errors are surfaced without losing the user's edits.

**Verification:** Integration test on the update action; unit test on the validator.

**Dependencies:** 3.3.

**Files likely touched:** `app/features/board/`, `queryUpdateTask.server.ts`.

**Estimated scope:** M.

### Task 3.5: Delete task (hard delete)

**Description:** Delete button with a confirmation prompt. Removes the task row entirely. Archive is the soft-delete; delete is intentional permanent removal.

**Acceptance criteria:**
- [ ] Confirmation prompt before deletion.
- [ ] Row is removed from the DB.
- [ ] Adjacent tasks in the column are not reordered (positions stay sparse — that's fine).

**Verification:** Integration test on the action.

**Dependencies:** 3.4.

**Files likely touched:** `app/features/board/`, `queryDeleteTask.server.ts`.

**Estimated scope:** S.

### Task 3.6: Move task across columns — drag-and-drop (desktop)

**Description:** Install `dnd-kit` (recommended). Wire drag-and-drop so a task can be moved between columns. On drop: call an action that updates `column_id` and `position`.

**Acceptance criteria:**
- [ ] Drag from column A → drop in column B → task reappears in column B.
- [ ] Persists across reload.
- [ ] No accidental moves on click without drag distance.

**Verification:** Manual + Playwright spec; unit test on the position-recalculation function.

**Dependencies:** 3.5.

**Files likely touched:** `app/features/board/dnd/`, `queryMoveTask.server.ts`.

**Estimated scope:** M.

### Task 3.7: Move task — tap-menu (mobile) + keyboard

**Description:** On touch devices and via keyboard, a "Move to" menu appears per task. Lists all columns. Selecting a column moves the task. `dnd-kit` provides keyboard sensors — verify they actually move the task, don't merely highlight it.

**Acceptance criteria:**
- [ ] Menu reachable by keyboard alone (Tab to task, Enter or context-menu key opens, arrows navigate, Enter selects).
- [ ] Menu reachable by tap on touch.
- [ ] Same action as drag-and-drop — no duplicate logic.

**Verification:** Manual keyboard walk-through; one E2E spec exercising keyboard movement.

**Dependencies:** 3.6.

**Files likely touched:** `app/features/board/`, menu component.

**Estimated scope:** M.

### Task 3.8: Reorder within column

**Description:** Drag a task up/down in the same column. Action updates `position`. Use sparse positions (e.g., gaps of 1024) and renumber lazily when gaps run out, or use fractional indexing.

**Acceptance criteria:**
- [ ] Reorder persists across reload.
- [ ] Many reorders in a row do not require a renumbering pass mid-session.
- [ ] Keyboard alternative exists (recommended: arrow keys when a task is focused).

**Verification:** Unit test for the position function; manual walkthrough.

**Dependencies:** 3.7.

**Files likely touched:** Reuse of `queryMoveTask.server.ts`, possibly a `positionUtils.ts`.

**Estimated scope:** M.

### Task 3.9: E2E — Flow C

**Description:** Playwright test: signed-in user creates a task, drags it across columns, archives it (Phase 4 dep — bring the test in once 4.x is done, or stub the archive call here and finish it in Phase 4).

**Acceptance criteria:**
- [ ] Test green and stable.

**Verification:** `npm run e2e` green.

**Dependencies:** 3.8 (+ 4.1 once Phase 4 is in).

**Files likely touched:** `e2e/flow-c-task-lifecycle.spec.ts`.

**Estimated scope:** S.

### Checkpoint: Tasks on board complete

- [ ] Planner can create, edit, move, reorder, delete tasks on their own board.
- [ ] All quality gates pass.
- [ ] **Planner starts using the board daily from this point.** Section 5 success metric "consecutive weeks of personal use" clock starts.

---

## Phase 4 — Archive

Goal: archive/restore round-trip works; archived tasks have a viewable home.

### Task 4.1: Archive action

**Description:** "Archive" affordance on a task → action sets `archived = true`. Task disappears from main board (excluded by 3.2's loader already).

**Acceptance criteria:**
- [ ] Archived tasks no longer appear on the board.
- [ ] Action is idempotent (archiving an already-archived task is a no-op).

**Verification:** Integration test.

**Dependencies:** 3.4.

**Files likely touched:** `queryArchiveTask.server.ts`, board UI.

**Estimated scope:** S.

### Task 4.2: Archive view page

**Description:** `/archive` shows archived tasks (latest first), scoped to the workspace.

**Acceptance criteria:**
- [ ] Page reachable from the board header.
- [ ] Shows title, original column name (denormalised at archive time *or* fetched live), archived-at timestamp.
- [ ] Empty state has helpful copy.

**Verification:** Integration test on the loader; manual visual check.

**Dependencies:** 4.1.

**Files likely touched:** `app/routes/archive.tsx`, `app/features/archive/`.

**Estimated scope:** M.

### Task 4.3: Restore action

**Description:** From the archive view, restore a task — `archived = false`, drops it back into its original column at the bottom.

**Acceptance criteria:**
- [ ] Restored task appears on the main board.
- [ ] If its original column has been deleted, restore puts it in the first column (and shows a notice).

**Verification:** Integration test (including the original-column-deleted edge case).

**Dependencies:** 4.2.

**Files likely touched:** `queryRestoreTask.server.ts`, archive UI.

**Estimated scope:** S.

### Checkpoint: Personal-use slice complete

- [ ] Planner-personal-use feature set is shipped: signup, board, tasks (create / edit / move / delete / archive / restore).
- [ ] E2E Flow A and Flow C green.
- [ ] All quality gates pass.

### ═══════════════ Mid-build motivation checkpoint ═══════════════

Before starting Phase 5: **the planner answers honestly: "Am I still going to use this when it ships, or have I lost interest?"** (Plan §15.4.)

- **If yes:** continue to Phase 5. Team-shaped plumbing (invitations, user management, column admin) is portfolio work; commit to finishing it.
- **If no / unsure:** **stop here.** Phase 4 is a usable personal Kanban. Tag the repo as `v0-personal-use`. Sunk cost is sunk. Portfolio value alone is not enough to grind through Phases 5–8.

This checkpoint is not optional. Skipping it is the highest-leverage way to waste the next month.

---

## Phase 5 — Invitations (Flow B)

Goal: an admin invites teammates by email; each gets a personalised, one-recipient-per-email invitation; clicking it auto-creates their account and lands them on the workspace board.

### Task 5.1: Schema — invitations

**Description:** Migration adding `invitations` table: `id`, `workspace_id`, `email`, `token_hash`, `invited_by_user_id`, `expires_at`, `consumed_at`, `revoked_at`, timestamps.

**Acceptance criteria:**
- [ ] Migration round-trips.
- [ ] Unique constraint on `(workspace_id, email)` where `consumed_at IS NULL AND revoked_at IS NULL`.

**Verification:** Migration up/down; integration test.

**Dependencies:** Phase 4 done.

**Files likely touched:** Migration file, test.

**Estimated scope:** S.

### Task 5.2: Invitation form (admin only)

**Description:** UI for an admin to enter comma- or newline-separated emails. Validates each. Submits to the action that creates invitations and sends emails.

**Acceptance criteria:**
- [ ] Mixed valid/invalid input reports per-email status ("3 of 5 sent; 2 invalid: …").
- [ ] Non-admins receive a 403 / are not shown the form.
- [ ] Existing-member emails are filtered with a clear message ("alice@… is already in the workspace").

**Verification:** Unit tests on the email parser + validator; integration test on the action.

**Dependencies:** 5.1, 2.5.

**Files likely touched:** `app/features/invitations/`, route, form.

**Estimated scope:** M.

### Task 5.3: Send invitation emails (privacy-critical)

**Description:** For each invitee, send a separate, personalised email with a unique token-bearing link. **One outbound email per recipient. No batched recipients. Test asserts this property** (per plan Risk #4 and SPEC §6 boundaries).

**Acceptance criteria:**
- [ ] One `sendEmail` call per invitee.
- [ ] Each email body contains only that invitee's link and no reference to other invitees.
- [ ] **Property test:** invite 5 emails → exactly 5 `sendEmail` calls captured, each with exactly 1 recipient, each link unique.

**Verification:** Unit + integration test of the action; the property test is the load-bearing check here.

**Dependencies:** 5.2.

**Files likely touched:** `app/features/invitations/`, email template, tests.

**Estimated scope:** M.

### Task 5.4: Pending invitations UI

**Description:** User panel shows invitees with `pending`, `expired`, `accepted`, `revoked` state per row. Admin sees re-send and revoke affordances.

**Acceptance criteria:**
- [ ] State derives correctly from `expires_at`, `consumed_at`, `revoked_at`.
- [ ] Times shown in user's local timezone.

**Verification:** Component test on the state-deriver; manual.

**Dependencies:** 5.1.

**Files likely touched:** `app/features/users/` or `app/features/invitations/`, UI.

**Estimated scope:** M.

### Task 5.5: Re-send invitation

**Description:** Admin clicks "re-send" on a pending/expired invitation. Action issues a new token, supersedes the old one, sends a new email.

**Acceptance criteria:**
- [ ] Old token is invalidated.
- [ ] New email arrives at the dev mock.

**Verification:** Integration test.

**Dependencies:** 5.3, 5.4.

**Files likely touched:** `queryResendInvitation.server.ts`.

**Estimated scope:** S.

### Task 5.6: Invitation accept route

**Description:** `GET /invite/accept?token=…` — validates token, creates user if absent, inserts `workspace_members` row as `user`, marks invitation consumed, creates session, redirects to `/board`.

**Acceptance criteria:**
- [ ] Atomic transaction.
- [ ] Expired / consumed / revoked tokens → friendly error.
- [ ] After accept, the new user can see the workspace's board.

**Verification:** Integration test; one E2E spec.

**Dependencies:** 5.5, 2.3.

**Files likely touched:** `app/routes/invite.accept.tsx`, `queryAcceptInvitation.server.ts`.

**Estimated scope:** M.

### Task 5.7: E2E — Flow B

**Description:** Playwright test: admin invites email X → captures email in dev mock → clicks link → asserts X is on the workspace board.

**Acceptance criteria:**
- [ ] Test green and stable.

**Verification:** `npm run e2e` green.

**Dependencies:** 5.6.

**Files likely touched:** `e2e/flow-b-invitation.spec.ts`.

**Estimated scope:** S.

### Checkpoint: Invitations complete

- [ ] Privacy property tested and enforced.
- [ ] All 3 E2E flows green.
- [ ] **Review with planner.** This is the highest-privacy-risk surface; spot-read agent output carefully.

---

## Phase 6 — User management

Goal: admin can manage workspace membership; users can opt out of task-assigned emails.

### Task 6.1: User list page

**Description:** `/users` shows workspace members: email, role, last-active. Visible to all members (per plan §6 "view the user list — read-only"). Admin-only affordances appear conditionally.

**Acceptance criteria:**
- [ ] List loader is workspace-scoped.
- [ ] Active-user signal (signed-in within last 30 days) is displayed.

**Verification:** Integration test.

**Dependencies:** Phase 5 complete.

**Files likely touched:** `app/routes/users.tsx`, `app/features/users/`.

**Estimated scope:** M.

### Task 6.2: Role change (admin only)

**Description:** Admin can promote a user to admin, or demote an admin to user. Last-admin check applies — see 6.3.

**Acceptance criteria:**
- [ ] Promotion/demotion persists.
- [ ] Non-admins cannot reach the action (403).

**Verification:** Integration test.

**Dependencies:** 6.1.

**Files likely touched:** `queryUpdateMemberRole.server.ts`.

**Estimated scope:** S.

### Task 6.3: Last-admin protection

**Description:** UI hides/disables remove + demote affordances on the last admin. Server action also rejects with a clear error if attempted (defence in depth).

**Acceptance criteria:**
- [ ] UI: action is not clickable on the last admin (with a tooltip explaining why).
- [ ] Server: even a direct POST attempt is rejected.
- [ ] Integration test asserts both paths.

**Verification:** Integration test.

**Dependencies:** 6.2.

**Files likely touched:** `app/features/users/`, action handler.

**Estimated scope:** S.

### Task 6.4: Remove user

**Description:** Admin can remove a user. Confirmation prompt names the count of tasks that will be unassigned. Action runs atomically: unassign all their tasks, delete `workspace_members` row.

**Acceptance criteria:**
- [ ] Confirmation prompt is accurate ("3 tasks will be unassigned").
- [ ] Removed user's session is invalidated.
- [ ] Last-admin check from 6.3 applies.

**Verification:** Integration test.

**Dependencies:** 6.3.

**Files likely touched:** `queryRemoveMember.server.ts`.

**Estimated scope:** M.

### Task 6.5: Email preferences — opt out of task-assigned

**Description:** Per-user settings page. Toggle: "Email me when a task is assigned to me." Default on. Persists.

**Acceptance criteria:**
- [ ] Toggle persists across reload.
- [ ] Toggle scope: per-user, not per-workspace.

**Verification:** Integration test.

**Dependencies:** 6.1.

**Files likely touched:** `app/routes/settings.tsx`, `app/features/users/`.

**Estimated scope:** S.

### Task 6.6: Task-assigned email sender (respects opt-out)

**Description:** When a task is created or edited with a non-null assignee that wasn't them before, send a task-assigned email to the assignee — unless they've opted out.

**Acceptance criteria:**
- [ ] Email sent on assignment change to a non-self assignee.
- [ ] Not sent if assignee = self (you assigning yourself).
- [ ] Not sent if assignee has opted out.

**Verification:** Integration test covering all three branches.

**Dependencies:** 6.5, 3.3, 3.4.

**Files likely touched:** `app/features/email/sendTaskAssignedEmail.server.ts`, hooks in 3.3 and 3.4.

**Estimated scope:** M.

### Checkpoint: User management complete

- [ ] Full multi-user lifecycle works: invite → accept → use → role change → remove.
- [ ] All quality gates pass.

---

## Phase 7 — Column management

Goal: admins can shape the board's columns.

### Task 7.1: Add column (admin only)

**Description:** Admin can add a new column. Position is appended at the end.

**Acceptance criteria:**
- [ ] New column appears on the board immediately.
- [ ] Non-admins cannot reach the action.

**Verification:** Integration test.

**Dependencies:** Phase 6 complete (or earlier, but ordering this last avoids re-wiring).

**Files likely touched:** `app/features/board/`, `queryInsertColumn.server.ts`.

**Estimated scope:** S.

### Task 7.2: Rename column

**Description:** Admin can rename a column inline.

**Acceptance criteria:**
- [ ] Name persists across reload.

**Verification:** Integration test.

**Dependencies:** 7.1.

**Files likely touched:** `queryUpdateColumn.server.ts`.

**Estimated scope:** S.

### Task 7.3: Reorder columns

**Description:** Admin can drag columns to reorder.

**Acceptance criteria:**
- [ ] New order persists.
- [ ] Non-admins cannot drag-reorder columns.

**Verification:** Integration test; manual.

**Dependencies:** 7.2.

**Files likely touched:** `app/features/board/dnd/`, action.

**Estimated scope:** M.

### Task 7.4: Delete column (only when empty)

**Description:** Delete affordance on a column. **Disabled (not hidden) when the column has any non-archived tasks**, with a tooltip explaining why.

**Acceptance criteria:**
- [ ] Delete is disabled on non-empty columns; tooltip clear.
- [ ] Delete on empty column succeeds.
- [ ] Server-side: even a direct POST against a non-empty column is rejected.

**Verification:** Integration test on both paths.

**Dependencies:** 7.3.

**Files likely touched:** `queryDeleteColumn.server.ts`, UI.

**Estimated scope:** M.

### Checkpoint: Column management complete

- [ ] Admin can fully shape the board.
- [ ] All quality gates pass.

---

## Phase 8 — Launch polish

Goal: dogfooding-ready. WCAG-floor accessibility, GDPR copy in place, observability minimum, E2E suite stable.

### Task 8.1: Keyboard accessibility audit

**Description:** Walk the entire app keyboard-only. Fix any focus traps, missing focus rings, inaccessible drag-drop alternatives. WCAG 2.1 AA target — focus, contrast, semantic structure.

**Acceptance criteria:**
- [ ] All three E2E flows are completable keyboard-only.
- [ ] No focus-trap incidents.
- [ ] Skip-to-content link where appropriate.

**Verification:** Manual keyboard walkthrough + axe-core run (`npx @axe-core/cli http://localhost:3000`).

**Dependencies:** Phase 7 complete.

**Files likely touched:** Many small UI files.

**Estimated scope:** M.

### Task 8.2: Privacy policy + Terms of Service v0.1

**Description:** Template-based privacy policy and ToS pages, linked from the footer. State EU residency, lawful basis (contract), data subject rights process (manual via planner).

**Acceptance criteria:**
- [ ] `/privacy` and `/terms` exist and are linked from the footer of every page.
- [ ] Copy explicitly states the manual data-subject-rights process.

**Verification:** Manual review.

**Dependencies:** Phase 7 complete.

**Files likely touched:** `app/routes/privacy.tsx`, `app/routes/terms.tsx`, footer.

**Estimated scope:** S.

### Task 8.3: Email bounce logging

**Description:** When Resend webhooks become available (post-hosting), log bounces to DB. Pre-hosting: scaffold the handler so it's wired but inactive.

**Acceptance criteria:**
- [ ] Webhook endpoint exists at `/webhooks/resend`.
- [ ] Bounce payload is parsed and logged to a `email_events` table.
- [ ] No admin UI (per plan §6 — "log entries only").

**Verification:** Integration test against a sample payload.

**Dependencies:** Phase 7 complete.

**Files likely touched:** `app/routes/webhooks.resend.tsx`, migration.

**Estimated scope:** M. *(Deferrable to post-hosting if the planner wants — flag as optional.)*

### Task 8.4: Final E2E sweep

**Description:** Run the three E2E flows 50× consecutively. Fix any flakes. Add `data-testid` where strictly needed and nowhere else.

**Acceptance criteria:**
- [ ] 50 consecutive runs without flake.
- [ ] No test IDs in production markup that aren't strictly needed for tests.

**Verification:** `for i in {1..50}; do npm run e2e || break; done` exits 0.

**Dependencies:** Phase 7 complete.

**Files likely touched:** E2E specs, a few UI tweaks.

**Estimated scope:** M.

### Task 8.5: First-load performance baseline

**Description:** Instrument the cold-cache time-to-board metric from plan §5. Record a baseline number. No optimisation work in this task — just measurement, so future regressions are detectable.

**Acceptance criteria:**
- [ ] A documented procedure exists to measure cold-cache TTI for the board view.
- [ ] Baseline number is recorded in `docs/`.

**Verification:** Procedure can be re-run by following the doc.

**Dependencies:** Phase 7 complete.

**Files likely touched:** `docs/performance-baseline.md`.

**Estimated scope:** S.

### Checkpoint: MVP complete

- [ ] All three E2E flows green, 50× consecutive.
- [ ] Keyboard walkthrough completes.
- [ ] Privacy/ToS pages live.
- [ ] All quality gates pass.
- [ ] Planner begins the 8-consecutive-weeks personal-use clock (plan §5 success metric).

---

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **StyleX + React Router 7 + Vite has thin documentation** — Task 1.8 may eat unexpected time. | ~~Medium~~ **Low** (downgraded 2026-05-15) | Reference project has a working setup at `/Users/janimattiellonen/Documents/Fraktio/Projektit/finfilm/apps/control` — copy `vite.config.ts` and `vitest.config.ts` StyleX plugin config verbatim. Fallback (vanilla-extract / CSS Modules) only if the reference setup somehow refuses to work against the latest dep versions. |
| **Slonik integration-test isolation strategy unproven for this dev** — Task 1.6 has a decision point. | Medium | Default to per-test transaction rollback. If that produces hard-to-debug failures, switch to truncate-and-reseed (slower but simpler). Document the choice in SPEC.md §8 once decided. |
| **Drag-and-drop keyboard accessibility is harder than it looks** — Tasks 3.6–3.8. | Medium | Pick `dnd-kit`, lean on its keyboard sensors. Don't roll your own. Test keyboard movement explicitly per task. |
| **Magic-link/session edge cases** — Tasks 2.2–2.3 have a long tail (expired link, replay, multi-device). | Medium | Spend extra spot-reading time on the agent's output here; this is the highest-risk surface. The two of you are the security review. |
| **Mid-build motivation collapse (plan Risk 1b)** | High | Hard checkpoint between Phase 4 and Phase 5. Walk away if the answer is anything other than confident "yes". |
| **Workspace isolation bug shipped silently** | Critical | Every multi-tenant query MUST have an integration test asserting cross-workspace isolation. Boundary in SPEC §6 is the rule; tests are the enforcement. |

## Open questions carried from SPEC.md §8

These do not block starting Phase 1, but each one is gated by a specific task and must be answered before that task:

- [ ] **Workspace naming semantics** — decide *before* Task 2.1 (schema affects it).
- [ ] **Test isolation strategy** (per-test transaction rollback vs truncate-and-reseed) — decide *during* Task 1.6 (when writing the first integration test).
- [ ] **Hosting vendor** — out of MVP scope. Re-opens when the planner finishes Phase 8 and wants to deploy.
- [ ] **Email-template authoring** (React-Email vs HTML strings) — decide *during* Task 2.2 (first email template).
- [ ] **Error tracking (Sentry et al.)** — accepted cut for MVP. Re-evaluate post-Phase 8.
- [ ] **Drag-and-drop library** — recommended `dnd-kit`. Decide *during* Task 3.6.
- [ ] **UI visuals (design system)** — colour palette, typography, spacing, radius, shadows, focus-ring. Resolved in **Phase 0** (UI prototype) → `docs/design-tokens.md`.
- [ ] **StyleX implementation strategy** — token file layout (single vs split), theming scaffold, per-component convention. Resolved at the **Pre-Phase-2 design review** (immediately after Phase 1, consuming Phase 0's tokens).
- [x] ~~Migration tool.~~ *Resolved 2026-05-15: custom Slonik-based runner copied from reference project. See SPEC.md decision log.*

## How to use this plan

1. Phases are sequential. Tasks within a phase mostly are too — exceptions noted.
2. **Mark each task complete only when its verification step passes.** "Looks right" is not done.
3. **At every checkpoint:** stop, review with the planner, do not skip ahead.
4. If a task feels XL when starting it — **decompose first, code second**. The skill explicitly warns: writing "and" in a task title is a sign it is two tasks. Same for "and" in an acceptance criterion.
5. Open questions are resolved inline at their gating task — not in a separate pass.

---

**Status of this plan:** Foundation. Sized for the MVP scope in `docs/project-plan.md` §6. About 40 tasks across 8 phases. None of them are XL; one or two may turn out to be XL when started, in which case the rule is: stop and decompose, don't push through.
