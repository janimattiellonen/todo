# SPEC — Kanban TODO for Small Teams

> Technical specification grounded in [`docs/project-plan.md`](./docs/project-plan.md).
> Status: Draft · Last updated: 2026-05-15
> Scope is **MVP-as-spec'd in the plan, run locally**. Production hosting is a deliberately deferred next spec phase.
> **Revision 2026-05-15:** Aligned with the reference project at `/Users/janimattiellonen/Documents/Fraktio/Projektit/finfilm/apps/control` on four points: TypeScript strictest preset, custom Slonik-based migration runner (not node-pg-migrate), pnpm as package manager, Pino as logger. Migrations moved from `migrations/` at root to `app/database/migrations/`.

This spec defers to two skill files for the *how*:

- [`.claude/skills/project-conventions/SKILL.md`](./.claude/skills/project-conventions/SKILL.md) — architecture, file organisation, code-style rules. Adopted **verbatim**.
- [`.claude/skills/tests/SKILL.md`](./.claude/skills/tests/SKILL.md) — testing principles and patterns. Adopted **verbatim**.

Anything not stated here defers to those files. If a conflict ever arises, raise it explicitly — don't pick silently.

---

## 1. Objective

Build the multi-tenant SaaS Kanban board described in `docs/project-plan.md`, MVP scope (plan §6), running locally against a Docker Postgres.

The project is personal / portfolio — see plan §1 and `docs/validation-2026-05-13.md`. The load-bearing assumption of the whole build (plan Risk #2) is that **a solo developer using an AI coding agent can produce maintainable code given a tight spec**. The testing strategy (§5 below) and boundaries (§6 below) exist primarily to make that assumption survive contact with reality.

## 2. Tech Stack

| Layer | Choice | Why (one line) |
|------|-------|----------------|
| Framework | **React Router 7 (framework mode)** | One repo, one deploy, typed loader/action API surface; SSR for snappy first paint and clean auth redirects. |
| Runtime | **Node.js (LTS), single long-lived server** | Postgres-friendly, no edge-runtime caveats, most well-trodden agent path. |
| Language | **TypeScript** — extends [`@tsconfig/strictest`](https://github.com/tsconfig/bases) | Matches the reference project's actual config; full strictness including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. |
| Database | **PostgreSQL** (Docker, host port `5433`) | Multi-tenant relational data; EU residency *when* hosting begins. |
| DB client | **Slonik** | Tagged-template safety, runtime row validation via Zod, no codegen step. |
| Migrations | **Custom Slonik-based runner** (plain SQL files, ordered `001-…`, `002-…`; tracked in `_migrations` table) | Forward-only, no extra dependency, no DSL — the agent reads/writes plain SQL natively. Copies the reference project's pattern. |
| Validation | **Zod** | At every external boundary — form data, URL params, DB row parsing. |
| Styling | **StyleX** (`@stylexjs/stylex` + `vite-plugin-stylex`) | Locked by `project-conventions` skill. **No Tailwind.** |
| Email | **Resend** (EU sending region) | Free tier covers usage indefinitely; EU sending; React-Email templates. |
| Logger | **Pino** (with `pino-pretty` in dev) | Structured JSON logs in prod, readable in dev. Matches reference project. |
| Testing — unit/integration | **Vitest** with **two-project split** (`*.unit.test.{ts,tsx}` parallel, `*.integration.test.{ts,tsx}` sequential + isolated) | Names define behaviour: unit tests have no side effects so they parallelise; integration tests touch the DB so they don't. |
| Testing — E2E | **Playwright** | ~3 happy-path flows only (§5). |
| Linter / formatter | **Biome** | Single tool, fast, fewer agent-misconfig points; matches reference project. |
| Package manager | **pnpm** | Stricter dependency resolution catches phantom-dependency bugs the agent is prone to; matches reference project. |
| Hosting | **Deferred — local only for now.** | Plan's "EU residency" hard constraint binds only when hosting starts. |

## 3. Commands

All commands runnable from project root via pnpm scripts. Script naming follows the reference project's convention.

```sh
# install
pnpm install

# database (Docker)
pnpm run db:start                  # docker compose up -d postgres
pnpm run db:stop                   # docker compose down
pnpm run db:psql                   # psql into the running container

# migrations (custom Slonik-based runner; forward-only, plain SQL files)
pnpm run script:db:migrate         # apply pending migrations against .env DB
pnpm run script:db:migrate:test    # apply pending migrations against .env.test DB

# dev
pnpm run dev                       # react-router dev (vite under the hood)

# build / production
pnpm run build                     # react-router build
pnpm run start                     # react-router-serve ./build/server/index.js

# quality gates (must all pass before declaring a task done — see §6)
pnpm run types                     # react-router typegen && tsc
pnpm run lint                      # biome lint --error-on-warnings .
pnpm run lint:fix                  # same, --write
pnpm run format                    # biome check . --linter-enabled=false
pnpm run format:fix                # same, --write
pnpm test                          # vitest (watch mode for dev)
pnpm run test:run                  # vitest run (CI; all projects)
pnpm run test:run:integration      # vitest run --project 'Integration tests'
pnpm run e2e                       # playwright test
```

**Postgres dev port** is **5433** so it does not collide with a host-native install on `5432`. Test runs use a separate database configured via `.env.test`.

**Forward-only migrations.** The reference project's runner deliberately omits `migrate:down`. Roll back by writing a new migration that reverses the previous one, not by undoing the migration file. This is the safer default for any DB that ever holds real data.

## 4. Project Structure

Single app, no monorepo. Layout follows the `project-conventions` skill and mirrors the reference project's structure where it adds detail the skill doesn't pin.

```
/
├── app/
│   ├── routes/                              # Slim wiring only — loader/action delegate to features
│   ├── features/                            # Vertical slices by domain
│   │   └── <domain>/
│   │       ├── <Domain>Page.tsx                       # feature component(s)
│   │       ├── <domain>Types.ts                       # branded types + toXxx converters
│   │       ├── query<Thing>.server.ts                 # Slonik query functions
│   │       ├── <feature>.unit.test.ts(x)              # pure-function tests
│   │       └── <feature>.integration.test.ts(x)       # DB-touching tests
│   ├── ui/                                  # Shared UI components (prefer these over custom CSS)
│   │   ├── buttons/  forms/  navigation/  feedback/
│   │   ├── primitives/  typography/  display/
│   ├── database/
│   │   ├── pool.server.ts                   # Slonik pool factory
│   │   ├── sql.server.ts                    # sql tag re-export (optional)
│   │   ├── runMigrations.server.ts          # the migration runner
│   │   └── migrations/                      # 001-…sql, 002-…sql (forward-only)
│   ├── scripts/
│   │   ├── migrate.server.ts                # pnpm script:db:migrate entry point
│   │   └── runScript.server.ts              # shared script harness (logger, config)
│   ├── test/
│   │   ├── unit/setup.ts                    # jsdom + globals for *.unit.test.*
│   │   ├── integration/
│   │   │   ├── globalSetup.ts               # runs once: ensure test DB + migrations applied
│   │   │   └── setup.ts                     # runs per file: isolation strategy (see §5)
│   │   ├── mocks/                           # captured-email transport, etc.
│   │   ├── fixtures/                        # factory builders for test data
│   │   └── database/                        # helpers for test DB operations
│   ├── config/                              # env parsing, typed config
│   ├── utils/                               # framework-agnostic helpers (rare; prefer features)
│   ├── types.ts                             # ~/types: `Branded<T, B>` + shared primitives
│   ├── root.tsx, entry.{client,server}.tsx  # React Router 7 defaults
├── e2e/                                     # Playwright tests (3 happy-path flows; see §5)
├── docker-compose.yml                       # Postgres on host port 5433
├── biome.jsonc
├── tsconfig.json                            # extends @tsconfig/strictest; path alias ~/ → app/
├── react-router.config.ts                   # ssr: true
├── vite.config.ts                           # reactRouter() + stylex() plugins
├── vitest.config.ts                         # two projects: Unit tests / Integration tests
├── playwright.config.ts
├── package.json
├── pnpm-lock.yaml
├── .env.example, .env.test.example
├── SPEC.md
└── docs/
    ├── project-plan.md
    ├── implementation-plan.md
    └── validation-2026-05-13.md
```

**Path alias:** `~/` → `app/`. All imports inside `app/` use `~/...`. Configured in `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, and `vite-plugin-stylex` aliases (per reference project).

## 5. Testing Strategy

Adopt `.claude/skills/tests/SKILL.md` verbatim. The strategy below names the *split* — the skill names the *how*.

### Vitest project structure

Two Vitest projects (per reference project), distinguished by filename. The agent must put new tests in the right file:

| Project | File pattern | Runtime | Parallelism | Isolation |
|---------|-------------|---------|-------------|-----------|
| Unit tests | `*.unit.test.{ts,tsx}` | jsdom | parallel | none needed (no side effects) |
| Integration tests | `*.integration.test.{ts,tsx}` | node | sequential | per-file isolation, real Postgres |

Run with `pnpm test:run` (both) or `pnpm test:run:integration` (DB-touching only).

### Layers

1. **Unit (Vitest).** Pure functions: validators, derivations, mappers, branded-type constructors, anything in `app/features/<domain>/` that does not touch a side effect. Co-located: `thing.ts` + `thing.unit.test.ts`. **This is where most behaviour gets covered**, because slim routes + thin loaders push logic into pure functions (per `project-conventions` skill).

2. **Integration (Vitest + real Postgres).** Test `query*.server.ts` functions and feature-level functions that combine queries. **No mocking of the DB.** Tests run against the Docker Postgres on `5433`, against the test DB configured by `.env.test`. A dedicated test database is migrated once at globalSetup and reset between tests via transaction rollback (default) or truncate-and-reseed (fallback). This is the most cost-effective guard against Risk #2 — agent-written SQL hits real types, real constraints, real Postgres behaviour.

3. **E2E (Playwright).** Exactly three flows, mirroring plan §9:
    - Flow A — first-time signup → workspace created → empty board visible.
    - Flow B — admin invites → invitee clicks link → lands on workspace board.
    - Flow C — user creates a task → moves it across columns via drag and via menu → archives it.

    E2E tests run against a real local dev server + Docker Postgres. **No more than three flows** without explicit decision — maintenance tax compounds fast.

### What is *not* required

- Exhaustive component tests. Component tests are written when they earn their keep (complex state, validation forms); not for trivial render-shape components. The skill's "co-locate `Component.tsx` + `Component.test.tsx`" rule applies **when a test exists**, not as a mandate that every component must have one.
- 100% line coverage as a target. **Coverage is a diagnostic, not a goal.** If a non-trivial piece of behaviour has no test, that is a bug; the coverage number is an indicator, not the metric.

### Multi-tenant isolation testing

Every multi-tenant table query is required by the boundaries (§6) to include a `workspace_id` predicate. **At least one integration test per such query must assert this.** Concretely: run the query in workspace A's context, attempt to access workspace B's data, assert empty result. This is a *property* test, not a one-off — it directly hardens Risk #4 (multi-tenant data leak) and the related invitation-privacy property.

## 6. Boundaries

The two mechanical guards against Risk #2 are the testing strategy (§5) and these boundaries. The agent must follow them.

### Always do

- Follow [`project-conventions`](./.claude/skills/project-conventions/SKILL.md) and [`tests`](./.claude/skills/tests/SKILL.md) skills verbatim.
- Before declaring any task done: `pnpm run types` && `pnpm run lint` && `pnpm run test:run` && (where applicable) `pnpm run e2e` — **all must pass**. No green = not done.
- Validate every external input with Zod at the boundary (form data, URL params, DB row parsing). No raw `unknown` flowing inward.
- Type loader/action return values explicitly. No inferred return types on exported boundaries.
- Use Slonik tagged templates exclusively. SQL is never assembled from strings.
- Every query against a multi-tenant table includes a `workspace_id` predicate. **Tested per §5.**
- Use branded types (`UserId`, `WorkspaceId`, `TaskId`, etc.) for all domain IDs. Never pass a raw `string` where a branded type is expected (per `project-conventions`).
- Use explicit transaction boundaries (`pool.transaction`) for any operation that mutates more than one row in more than one table (per `project-conventions`).

### Ask first

- Adding a new top-level npm dependency.
- Schema migrations — show the proposed migration SQL before running it.
- Anything touching the auth / session / magic-link flow.
- Anything touching the invitation flow (privacy rule: one outbound email per recipient — plan §6, Risk #4).
- Refactors spanning >5 files.
- Adding a new external service or vendor.
- **Creating a new UI component, or significantly modifying an existing one.** Surface a proposal first — what it looks like, what it does, its props API — and wait for explicit approval before writing the component. Applies to both shared `app/ui/` primitives and feature-local components. Trivial edits (typos, missing aria-labels, token swaps) are exempt.

### Never do

- `git push --force` to main, or `git reset --hard` on anything not exclusively yours.
- Skip, disable, or `.skip` a failing test to make CI green.
- Use `any` to silence a type error. Use `unknown` + a narrow if you genuinely don't know.
- Return raw row objects from loaders/actions. Explicit field selection only (per `project-conventions` "Explicit field selection over the wire").
- Add billing / Stripe / payment code (out of scope per plan §6; explicitly deprioritised per plan §7).
- Add analytics, telemetry, or third-party tracking scripts (out of scope per plan §11).
- Send an email with multiple recipients in To/Cc — one outbound email per recipient, always (plan Risk #4, locked architecturally).
- Bypass `workspace_id` isolation in any query, even "temporarily for testing."

---

## 7. Decision Log

| Date | Decision | Why | Alternatives rejected |
|------|----------|-----|-----------------------|
| 2026-05-13 | React Router 7 in framework mode | One deploy, typed loader/action surface, SSR for auth redirects and snappy first paint | Library mode (rejected — two deploys, CORS, duplicated auth); Next.js / Remix (Remix is the predecessor, would be the same project; Next preferred only if reference projects used it — they don't) |
| 2026-05-13 | Node.js, single long-lived server | Postgres-friendly, no edge-runtime caveats, most well-trodden agent path | Bun (faster locally, less training data for the agent); edge runtime (Postgres connection plumbing hostile, no benefit for EU-only 15-user app) |
| 2026-05-13 | Slonik (not Drizzle / Prisma / Kysely) | Planner's preference; tagged-template safety; aligns with `project-conventions` skill | ORMs reduce drift between schema and code at compile time; Slonik trades that for runtime Zod validation and simpler operational model |
| ~~2026-05-13~~ | ~~node-pg-migrate for migrations~~ | — | **Superseded 2026-05-15** by the reference project's custom Slonik-based runner — see row below. |
| 2026-05-13 | Resend for email | EU sending region, free tier indefinitely sufficient, React-Email templates | Postmark ($15/mo floor breaks the near-zero budget); AWS SES (heavy IAM setup, no template helpers) |
| 2026-05-13 | Hosting deferred — local only for now | Shortens feedback loop, defers EU-residency plumbing until it matters | Pick a host now (rejected — premature commitment; risk of stalling pre-launch on infra) |
| 2026-05-13 | Vitest unit + integration (real Postgres) + Playwright (3 flows) | Most cost-effective guard against Risk #2; integration tests against real Postgres catch SQL bugs unit tests can't | Mocked DB (rejected — hides exactly the failures we're trying to catch); exhaustive component tests (rejected — agent rewrites components freely, locking impl is friction); no E2E (rejected — wiring bugs go uncaught) |
| ~~2026-05-13~~ | ~~TS strict-only, no extra strictness flags~~ | — | **Superseded 2026-05-15.** Earlier answer was based on a partial reading of the reference project — see row below. |
| 2026-05-13 | Biome (not ESLint + Prettier) | Matches reference project; one tool, less plugin sprawl | ESLint + Prettier (rejected — reference project moved away from it; more config surface) |
| 2026-05-13 | StyleX (no Tailwind) | Locked by `project-conventions` skill and planner preference | Tailwind / CSS Modules / vanilla-extract — rejected by planner |
| 2026-05-13 | Single app, no monorepo | No second package to extract; solo + agent overhead | pnpm workspaces / Turborepo (rejected — pure overhead at this scale) |
| ~~2026-05-13~~ | ~~`migrations/` at repo root~~ | — | **Superseded 2026-05-15** by `app/database/migrations/` — runner lives in the app, files live with it. |
| 2026-05-15 | TypeScript extends `@tsconfig/strictest` (not just `strict: true`) | Aligns with the reference project's actual config. Earlier decision was based on a partial reading. Calibration value of consistency with the reference outweighs the friction from `exactOptionalPropertyTypes` etc. | Stay with `strict: true` only (rejected — leaves agent calibrated to a different strictness level than the reference) |
| 2026-05-15 | Custom Slonik-based migration runner (forward-only, plain SQL files in `app/database/migrations/`, tracked in `_migrations` table) | Copies the reference project's ~70-line runner. One fewer dependency; SQL files the agent reads/writes natively; same toolchain as the reference; forward-only is the safer default | node-pg-migrate (rejected — extra dep, DSL the agent doesn't natively read); dbmate (rejected — Go binary, calibration drift) |
| 2026-05-15 | pnpm as package manager | Stricter dependency resolution catches phantom-dependency bugs; matches reference project | npm (rejected — looser resolution, calibration drift from reference) |
| 2026-05-15 | Pino logger (with `pino-pretty` in dev) | Structured logs help spot agent failure modes; matches reference project | No structured logger (rejected — agent debugging is harder); console.log (rejected — same) |
| 2026-05-15 | Vitest two-project split with `*.unit.test.*` / `*.integration.test.*` filename convention | Names define behaviour: unit tests parallelise, integration tests don't. Matches reference; clearer than a runtime config flag | Single-project Vitest with tagged tests (rejected — convention easier to enforce mechanically than tags) |
| 2026-05-19 | Integration test isolation via per-test **truncate-and-reseed** | Business logic uses explicit `pool.transaction()` blocks (per `project-conventions`). Wrapping each test in an outer transaction would force the production transactions into savepoints — extra complexity for marginal speed gain at this scale (15-user EU app). Truncate is what the reference project uses. | Per-test transaction rollback (rejected — savepoint complexity, drift from reference); schema-per-test (rejected — overkill, slower than truncate at this table count) |
| 2026-05-20 | StyleX tokens **split** across `app/ui/tokens/{colors,typography,spacing,radius}.stylex.ts` | Easier to find a single token, smaller per-file diffs when palette / scale changes, mirrors the §1–§6 structure of `docs/design-tokens.md`. Each file is small and reads top-to-bottom against the doc. | Single `app/ui/tokens.stylex.ts` (rejected — file grows alongside the design system and becomes a grep-heavy seam) |
| 2026-05-20 | Theming via `stylex.defineVars` — light values defined, dark deferred | The `defineVars` scaffold means dark mode is later added via `stylex.createTheme(colors, {...})` overrides — no rename, no restructure. Matches `docs/design-tokens.md` §2 / §8 intent. | Plain stylex.create constants (rejected — adding dark mode later would force a rewrite through every token reference) |
| 2026-05-20 | UI primitives grown **just-in-time**, not stubbed | Each component (Button, Stack, Heading, Text, …) ships with the first feature PR that needs it, paired with the pre-implementation checkpoint per SPEC §6 / [[feedback-ui-component-checkpoint]]. Avoids speculative API choices before any feature exercises the component. | Stub `<Heading>` / `<Text>` / `<PageHeading>` now (rejected for this PR — design-tokens §2A still mandates the three typography components when Phase 2 renders text; they ship with the first such PR, not pre-emptively) |
| 2026-05-20 | UI-component checkpoint codified in SPEC §6 (Ask first) | The "every new UI component requires a visual + props-API proposal first" rule is now visible to humans reading SPEC.md, not just resident in agent memory. Mirrors the existing [[feedback-ui-component-checkpoint]] memory; trivial edits (typos, aria-label fixes, token swaps) exempt. | Memory-only (rejected — invisible to anyone reading SPEC.md without the agent's memory layer) |
| 2026-05-21 | Email templates as hand-rolled HTML strings in `app/features/email/templates/` | Plain TS functions returning `EmailMessage`. Zero new deps. Mail clients strip `<style>` blocks anyway, so inline styles either way. First template (magic-link) is ~40 LoC and reads cleanly. | React-Email components (rejected — 1-2 MB of new deps, slower test runs, and at MVP scale the only template is one sign-in email) |
| 2026-05-21 | Magic-link `/auth/request` uses **async fire-and-forget dispatch** so response time is constant whether or not the email matches an account | Synchronous path is parse + rate-limit + return. The DB lookup, token INSERT, and email send run detached. Closes a timing side-channel that would otherwise let an attacker probe email existence by measuring response time. Tests use a `flushPendingWork()` hook to await the detached work. | Same work on both paths (rejected — bookkeeping-heavy to keep timings truly equivalent); random sleep (rejected — raises noise floor only, doesn't actually close the leak) |

## 8. Open Questions

Items that genuinely remain undecided. Each is answerable when the relevant work begins; none block writing code today.

- [ ] **Workspace naming semantics.** Asked for at signup? Auto-derived from email domain? Set later in settings? *(Open Q carried from plan §13.)* Recommended: ask for a workspace name at signup, default to "<email-localpart>'s workspace", editable later.
- [x] ~~**Test database isolation strategy.**~~ *Resolved 2026-05-19: per-test **truncate-and-reseed** via `app/test/database/truncateAllTables.ts`, called from a `beforeEach` in `app/test/integration/setup.ts` once the first domain table lands. Vitest project config uses `isolate: true, fileParallelism: false`, matching the reference. Per-test transaction rollback was rejected because business logic uses explicit `pool.transaction()` blocks (per `project-conventions`) — wrapping each test in an outer transaction would force those into savepoints, adding complexity for little benefit. See Decision Log row 2026-05-19.*
- [ ] **Hosting vendor (and EU region).** Re-opens when "local-only" no longer suffices. Plan §13 already lists this.
- [x] ~~**Email-template authoring**~~ *Resolved 2026-05-21: hand-rolled HTML strings. Each template is a plain TS function returning `EmailMessage`. Templates live in `app/features/email/templates/`. Zero new deps; inline styles only (mail clients strip `<style>` blocks). React-Email rejected for MVP — adds 1-2 MB of deps and slower test runs for a 15-user app whose only template right now is the magic-link sign-in mail. See Decision Log row 2026-05-21.*
- [ ] **Error tracking** (Sentry et al.). Plan §12 Risk #8 — accepted as a known cut for MVP, **but worth re-evaluating once the project escapes "local only".**
- [ ] **Drag-and-drop library.** Native HTML5 DnD vs `dnd-kit` vs `react-aria` drop-zones. Decide when implementing Flow C; `dnd-kit` is the default recommendation (well-maintained, accessible, supports keyboard).
- [ ] **UI visuals (design system).** Concrete colour palette (primary / surface / text / semantic / state), typography scale (font family, sizes, weights, line heights), spacing scale (typically 4 or 8 px grid), border radius scale, shadow scale, focus-ring style. Light theme minimum; dark theme deferable. **Resolved in Phase 0** (UI prototype) of `docs/implementation-plan.md` → output `docs/design-tokens.md`.
- [x] ~~**StyleX implementation strategy.**~~ *Resolved 2026-05-20: token files split across `app/ui/tokens/{colors,typography,spacing,radius}.stylex.ts`; theming via `stylex.defineVars` (light values defined, dark deferred); per-component `stylex.create` placement bottom-of-file per `project-conventions`; primitives grown just-in-time alongside the first feature PR that needs each one. See Decision Log rows 2026-05-20.*
- [x] ~~Migration tool.~~ *Resolved 2026-05-15: custom Slonik-based runner, copied from reference project. See Decision Log.*

## 9. Next Steps

1. **Confirm this spec with the planner.** Until then, no code.
2. After confirmation, move to **planning-and-task-breakdown** for MVP — decompose into ordered, verifiable tasks against this spec.
3. **Resolve open questions inline** as their corresponding work surfaces (workspace naming when Flow A is built; test-isolation strategy when the first integration test is written; etc.) — do not run a separate `/project-plan` or `/spec` pass on them.
4. **Mid-build motivation checkpoint** still applies (plan §15.4). Halfway through MVP, the planner asks honestly whether they will still use this. If no — stop. Portfolio value alone is not enough.

---

**Status of this spec:** Foundation. Sufficient to begin task breakdown and implementation against the MVP scope in `docs/project-plan.md` §6. Hosting and any decisions downstream of it (EU region, Postgres provider, backup strategy, error tracking) are explicitly out of scope here and become the next spec phase when the local build is sufficiently real.
