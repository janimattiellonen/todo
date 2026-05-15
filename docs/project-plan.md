# Project Plan — Kanban TODO for Small Teams

> A **non-technical** plan. Captures *what* and *why*, not *how*. Technical specs come next.
> Status: Draft (revised) · Last updated: 2026-05-13
> **Revision note:** Reframed as a personal / portfolio project after proxy validation (see `validation-2026-05-13.md`). Scope retained; product-play framing retired. See Decision Log for the pivot.

---

## 1. Executive Summary

A multi-tenant SaaS Kanban board built to small-team specifications (up to 15 active users per workspace). Auth is email magic-link only, with a simple admin / user role split. The board has one configurable column set per workspace; tasks carry minimal metadata (title, description, assignee, due date, column, archive flag).

**The project is personal / portfolio.** The original product-play framing ("sold to other small businesses, solving an overbuilt-tools pain") was tested against one proxy interview on 2026-05-13 and did not survive — see `validation-2026-05-13.md`. The premise was retired; the scope was deliberately kept so the project remains a fully-realised multi-tenant SaaS portfolio artefact, used in practice by the planner, and capable of supporting real users if validated demand ever emerges.

There is no current monetisation plan. MVP ships free; Stripe integration is retained only as a possible portfolio-completion item, not as a roadmap priority.

## 2. Problem & Motivation

**The original "small teams find existing tools overbuilt" hypothesis was tested and did not survive proxy validation** (see `validation-2026-05-13.md`). It is no longer the project's motivation.

**Current motivation (honest):**
- **Personal use.** The planner wants a Kanban tool they own and use themselves.
- **Portfolio piece.** A fully-realised multi-tenant SaaS — auth, invitations, roles, GDPR posture, EU hosting — is a stronger portfolio artefact than a single-user todo app.
- **Builder's freedom.** Owning the code keeps the option open to extend the tool toward whatever the planner actually needs later.
- **Agentic-development feasibility.** A solo developer using an AI coding agent can credibly ship this scope; that's the economic enabler. Without it, building team-shaped scope for an audience of one would not be defensible.

**Why now:** Nothing structural has changed in the market. The project proceeds because the cost of building it has dropped (agentic dev), not because a customer pain is calling for it.

**Evidence of real external demand:** None. The product-play framing was retired *because* of this — see Decision Log entry for 2026-05-13.

## 3. Target Users

- **Primary user (actual, validated):** the planner. Solo daily use of the board for personal task tracking is the only user scenario currently supported by evidence.
- **Aspirational secondary users (unvalidated, portfolio-shaped):** small businesses, up to 15 active users per workspace, generic / horizontal. The team scaffold (invitations, roles, admin tool, GDPR posture) is built to portfolio standard for this audience *should real demand ever be discovered*. No current evidence supports this audience — that hypothesis was retired in Section 2.
- **Tertiary users:** None. No external collaborators, no read-only guests, no API users. Anyone who needs access becomes a regular team member counted against the 15-user cap.
- **Explicitly not for:**
  - Project management beyond a flat Kanban board (no Gantt, dependencies, sprints).
  - Enterprise / regulated buyers (no SSO, SCIM, audit logs, compliance certs).
  - *(Removed in revision: "personal solo users" is no longer an exclusion — the planner is now exactly that.)*

## 4. Goals & Non-Goals

**Goals (in user voice):**
1. *"My whole team knows what's on its plate without anyone having to ask."* — the board is a single source of truth for shared work.
2. *"Setup took us less than 10 minutes and we never went back to a spreadsheet."* — adoption and time-to-value.
3. *"We're not paying for features we don't use."* — price/feature fit.

**Non-goals (for MVP):**
- Real-time multi-user sync (refresh-on-load is acceptable).
- Native mobile apps (responsive web only).
- Offline mode / PWA install.
- File attachments on tasks.
- Comments / discussion threads on tasks.
- Time tracking / timesheets.
- Reporting, analytics, dashboards, burndowns.
- Public / read-only board sharing links.
- Templates or a template marketplace.
- Third-party integrations beyond email (no Slack, calendar, GitHub).
- Recurring tasks.
- Subtasks, dependencies, checklists.
- Custom fields on tasks.
- Automation rules ("when moved to Done, do X").
- Tags / labels.
- Multiple boards per workspace.
- Advanced search / saved filters.

## 5. Success Metrics

For a personal / portfolio project, "success" is partly qualitative. Metrics below are honest signals — instrumented from day one, measured continuously, no pre-launch numerical targets.

| Signal | Why it matters |
|--------|----------------|
| **Consecutive weeks of personal use by the planner** (target: ≥8). | The product earns its right to exist by being something the planner actually uses. Anything less means the project failed at its primary goal. |
| **Median time from cold-cache load to seeing the board** on any device. | Proxy for the "snappy / lightweight" feel that originally motivated the cuts in Section 4. |
| **Codebase still feels maintainable 6 months in** (subjective: can planner + agent add a non-trivial feature in under one day?). | Tests the load-bearing Section 10 assumption that agentic dev produces maintainable code. |
| ~~Trial → paid conversion~~ | **Retired.** No monetisation planned. |
| ~~% of workspaces with ≥2 active users~~ | **Retired** as a primary signal — no real external users to measure. Re-instate only if invitations start being sent in earnest. |

## 6. Scope — MVP

- **Multi-tenant SaaS.** Each business = one workspace. Workspaces are fully isolated.
- **Self-serve magic-link signup.** Visitor enters email → magic link → workspace is created with them as the sole admin. Default columns ("To do", "In progress", "Done") are pre-populated. They land directly on the empty board.
- **Workspace size:** Up to **15 active users**. "Active" = signed in within the last 30 days.
- **Roles:**
  - **Admin:** everything a user can do, plus invite users, remove users, change user roles, edit workspace name, manage columns (add / rename / reorder / delete), manage billing (when billing exists).
  - **User:** view the board, full CRUD on **any** task (including ones others created), assign tasks to any team member, view the user list (read-only).
  - Note: users can edit or delete any task. This is a deliberate "small-team trust" choice. The archive state (below) softens this.
- **Tasks** have exactly these fields:
  - `title` (required, single line)
  - `description` (optional, plain text — no markdown rendering)
  - `assignee` (optional, single user from the workspace)
  - `due date` (optional, date only — no time of day)
  - `column` (required — the board column the task is in)
  - `archived` (boolean — archived tasks are hidden from the main board, viewable in an Archive view, restorable)
- **Moving tasks:**
  - **Drag-and-drop** on desktop (across columns and within a column for reorder).
  - **Tap-to-menu** ("Move to → [column]") on mobile / touch.
  - **Keyboard-accessible** alternative for screen-reader users (required).
- **Reorder within column:** Manual drag. New tasks appear at the bottom of the column. The user-set order is the truth — no automatic sort.
- **Columns:** Configurable per-workspace, admin-only. Add / rename / reorder / delete. Delete is only available (UI hidden or disabled) for columns with **no tasks** — including non-archived tasks. To delete a non-empty column the admin must first move or archive its tasks.
- **Invitations:**
  - Admin enters one or more email addresses (comma- or newline-separated). One outbound email **per address** — no batched recipient lists. **Each invitee email must be personalised and must not reveal who else was invited.**
  - Invitation links **expire after 5 days**. Admin can re-send. UI shows pending state per invitee.
  - Clicking an invitation auto-creates the account and signs the recipient in.
- **Removing a user:** Tasks they were assigned to become unassigned (stay on the board). A confirmation prompt names the count ("3 tasks will be unassigned"). **The last remaining admin cannot be removed; the UI blocks the action with an explanation** ("you must promote another user to admin first").
- **Email events (only three for MVP):**
  1. Magic-link sign-in.
  2. Invitation.
  3. Task assigned to you (user-facing — can opt out in settings).
- **Email bounce / spam handling:** Log entries only. No admin-facing surface in MVP.
- **Session length:** 30-day sliding window. Each visit refreshes the expiry. New device or browser requires a fresh magic link.
- **Billing:** None. Free during beta, capped at 15 users per workspace.

## 7. Scope — Later

**Top priorities post-MVP** (motivated by the planner's own use; portfolio value secondary):
1. **Due-date reminder emails.** First feature the planner will hit pain on once their own tasks accumulate.
2. **Multiple boards per workspace.** Addresses the known day-one constraint of running multiple personal projects on one board.
3. **TBD — determined by actual use.** No clear third priority pre-launch; will emerge from real friction in the planner's own workflow.

**Stripe / billing integration** is retained as a possible portfolio-completion item (demonstrates SaaS billing competency) but is **no longer a roadmap priority**. Its original motivation (turning the product into a business) was retired with the product-play framing. If implemented, it would run in test mode only — no live monetisation.

**After the priorities above, unordered:**
Comments on tasks · File attachments · Tags / labels · Recurring tasks · Subtasks / checklists · Daily digest email · Real-time multi-user sync · Reporting / analytics · Templates · Third-party integrations (Slack, calendar) · Automation rules · Per-column permissions · Localisation.

## 8. Out of Scope

These are **not** on the roadmap at any horizon.

- **Native mobile apps** (iOS / Android binaries). Responsive web only.
- **Time tracking / timesheets / billable hours.**
- **Gantt charts, task dependencies, sprint / iteration planning.**
- **Custom fields on tasks.**
- **Public read-only board sharing links** (anonymous URL viewers).
- **A public API for third-party developers.** Internal API is for our own clients only.

## 9. Key User Flows

### Flow A — First-time signup → workspace creation

1. New visitor lands on the marketing page → clicks "Get started" → enters email.
2. Magic link emailed to that address.
3. They click the link → a workspace is created with them as sole admin.
4. The empty board is displayed, pre-populated with "To do", "In progress", "Done" columns.
5. Two prominent actions on the empty state: "Create your first task" and "Invite teammates".

### Flow B — Inviting a teammate

1. Admin opens the workspace's user panel → enters one or more email addresses (comma- or newline-separated).
2. System sends one personalised email per address. No invitee sees the other addresses (no CC, no batched recipient lists, no "you and others were invited" copy).
3. Invalid addresses are reported inline ("3 of 5 sent; 2 invalid: alice@…, bob@…"). Valid addresses are queued.
4. Each invitation link is valid for **5 days**. Invitee UI in the user panel shows pending state.
5. Recipient clicks the link → account auto-created → lands on the same workspace's board.
6. Admin can re-send an invitation that has expired or not yet been clicked.

### Flow C — Daily use: task lifecycle

1. Any user (admin or user) clicks "Add task" in any column.
2. They enter at minimum a title; optionally description, assignee, due date.
3. The task appears at the bottom of the chosen column.
4. They can drag (desktop) or use the menu (mobile) to move the task across columns or reorder within a column.
5. They can edit or delete any task in the workspace.
6. When work is done, they move the task to whichever final column the admin has configured (default: "Done").
7. If a task is no longer relevant but worth keeping for reference, they archive it (it disappears from the board, remains in the Archive view, can be restored).

### Flow D — Returning user sign-in

1. Existing user revisits the site → enters email.
2. Magic link emailed.
3. They click the link → lands on the workspace board.
4. Session lasts **30 days sliding** — refreshed on each visit. After 30 days idle, magic link required again. New device / browser also requires a new link.

## 10. Constraints & Assumptions

- **Time / deadline:** None. Calendar is flexible.
- **Budget:** Near-zero. Target monthly burn below ~€50 until paid users exist. Free / cheap tiers for all services.
- **Team / capacity:** One human, building part-time, using an agentic toolchain (e.g. Claude Code) for most of the actual coding work.
- **Hard constraints:**
  - **GDPR basics from day one.** Privacy policy, lawful basis = contract, processor agreements with vendors, data-subject rights honoured manually (a written request → admin handles via DB).
  - **Terms of Service** required (v0.1, template-based, marked as revisable).
  - **EU data residency.** Database and primary app hosting in the EU.
  - **No cookie banner** in MVP because no non-essential cookies / analytics will be added.
  - **Accessibility:** WCAG 2.1 AA as a *goal, not a launch gate*. Keyboard navigation and basic screen-reader friendliness are non-negotiable (keyboard-accessible task movement is mandatory).
  - **No SOC 2, ISO, SSO/SCIM, or audit logs** — these are enterprise-sales asks and are excluded.
- **Working assumptions** (flagged so future-you knows when reality has diverged from them):
  1. Target users are on modern evergreen browsers (Chrome / Edge / Firefox / Safari, latest two versions).
  2. English-only UI for MVP. Localisation deferred.
  3. Users are online. Offline mode is excluded.
  4. Magic-link friction is acceptable to the target persona. *(Not validated.)*
  5. Email deliverability is solvable with a reputable transactional provider; we won't run our own SMTP.
  6. Workspace data volume is small (≤15 users × low hundreds of tasks). No need to optimise for thousands of tasks per board.
  7. **Agentic development produces maintainable code with a single human reviewer.** This is the load-bearing assumption of the whole project — its falsification would invalidate the project's economics.

## 11. External Dependencies

| Dependency | Role | Impact if lost / repriced |
|------------|------|---------------------------|
| Transactional email provider (Postmark / Resend / AWS SES — vendor TBD) | Sends magic-link, invitation, assignment emails. | Product becomes unusable (no auth, no invitations). Mitigate via provider-agnostic abstraction; switching takes ~a day. |
| Cloud hosting (EU region) — managed services preferred | Runs the app and database. | Migration cost. Use commodity infra (containers / managed Postgres / object storage) so migration is mechanical, not architectural. |
| Domain registrar + DNS | Domain ownership. | Trivial — no lock-in concern. |
| Agentic development toolchain (Claude Code or similar) | Dev-time productivity. | Development slows materially. This is the load-bearing assumption from Section 10; if the toolchain becomes inaccessible, the project's economics shift. |

**Deliberately *not* dependencies in MVP** (each is a known cut):
- **Stripe / payments** — no billing in MVP.
- **Analytics SaaS** — no analytics; lightweight in-app logging only.
- **Error tracking SaaS (Sentry et al.)** — cut for MVP. Flagged as **deliberate-but-arguable**; reasonable people would consider this table stakes. Add early in the post-MVP cycle if blind debugging becomes painful.

## 12. Risks & Unknowns

| # | Risk | Likelihood / Impact | Treatment |
|---|------|---------------------|-----------|
| 1 | ~~Section 2's "pain" is entirely hypothesis-based.~~ | — | **Retired** after the 2026-05-13 proxy validation. The product-play premise was abandoned; the project is no longer betting on this hypothesis being true. See `validation-2026-05-13.md`. |
| 1b | **Personal/portfolio scope creep.** Building team-shaped scope for an audience of one is a lot of plumbing without external pull. Risk of stalling mid-MVP. | Medium / High | New top risk after the pivot. Mitigation: set a personal mid-build checkpoint (Section 15 #4) — be willing to abandon if motivation drops. |
| 2 | **Solo dev + heavy AI use produces code that "looks right" but can't be maintained.** | Medium / High | Load-bearing assumption (10.7). Mitigate by spot-reading non-trivial agent output before merging; informal track of time-to-debug. |
| 3 | **Email deliverability problems break auth.** Magic-link in spam = user locked out and can't recover without admin help. | Medium / High (per-affected-user) | Use reputable provider, configure SPF/DKIM/DMARC correctly, monitor bounce rates from day one. Operational concern, not a one-time setup. |
| 4 | **Invitation privacy breach** — accidentally exposing other invitees' addresses. | Low / High | Architecturally locked: one outbound email per address, no batched recipient lists. Add a test that asserts this property. |
| 5 | **Single-board-per-workspace is too tight.** Teams running two projects bounce. | Medium / Medium | Accepted for MVP. On v1.1 roadmap as priority #3. |
| 6 | **No real-time sync** — two users editing the same board produce stale-data surprises. | Medium / Low | Accepted (Section 4 non-goal). Last-write-wins is fine for 2–15 person teams. Revisit if users complain. |
| 7 | **Any user can delete any task.** Risk of internal disputes. | Low / Low | Accepted (small-team trust). Archive state softens this (recoverable). Soft-delete with N-day recovery is a cheap future mitigation. |
| 8 | **No error tracking in MVP** — production debugging is slower. | Medium / Medium | **Planner accepted; the planning process rates this higher than the conversation has.** Free-tier Sentry would close this for near-zero cost. |
| 9 | **15-user cap with no upgrade path** — teams that grow leave silently. | Low / Medium | Acceptable in beta; revisit when the first team hits the cap. |
| 10 | **GDPR subject-rights handled manually.** Doesn't scale past ~50 workspaces. | High (eventual) / Medium | Accepted for MVP. Flag for automation when active workspaces approach ~50. |
| 11 | **Agentic toolchain price / availability shift.** | Low / High | Listed in Section 11. No real mitigation. Accept as part of the bet. |

## 13. Open Questions

Most questions raised during planning were resolved during the session (active-user definition, invitation expiry semantics, last-admin removal behaviour, archive state, column-delete affordance, invite-acceptance notifications, bounce/spam handling, pricing tiers). Genuinely-still-open items below.

- [x] ~~Will the single proxy validation conversation support the premise?~~ *Resolved 2026-05-13: it did not. Project reframed as personal/portfolio. See `validation-2026-05-13.md`.*
- [ ] Specific email-provider vendor (Postmark / Resend / AWS SES / other). Picked in the technical spec phase, not here.
- [ ] Specific cloud-hosting vendor and topology. Picked in the technical spec phase.
- [ ] Workspace naming / branding semantics. Is the workspace name asked for at signup, auto-derived from email domain, or set later in settings? Not discussed in detail.
- [ ] **Mid-build motivation checkpoint.** Will the planner still want to use this when MVP ships, or will interest have faded under the weight of plumbing work? Section 15 #4 commits to checking honestly at the midpoint.

## 14. Decision Log

| Date | Decision | Why | Alternatives considered |
|------|----------|-----|-------------------------|
| 2026-05-13 | Product is sold to other small businesses, not used internally | The features named (invitations, multi-user admin, roles) only earn their keep when serving *many* small teams; this also commits us to multi-tenancy, T&Cs, GDPR | (b) internal tool — would have eliminated most of the planned scope |
| 2026-05-13 | Target = small teams of 2–15; solo user is the degenerate case | Almost every feature the prompt named only matters with ≥2 people; building for "solo" first then bolting on team usually means rebuilding | Solo-primary (rejected — would mean rebuilding onboarding/permissions/data ownership later); larger teams (rejected — needs richer permissions and would betray the "stripped-down" pitch) |
| 2026-05-13 | Multi-tenant SaaS, not self-hosted | Default for product-play category and required by the buyer profile (small businesses do not run their own servers) | Self-hosted (rejected as inconsistent with product-play framing) |
| 2026-05-13 | Single board per workspace in MVP | Multiple boards is a sizeable scope addition; can be added cleanly as v1.1 once one-board pain is observed in real use | Multi-board MVP (rejected — too much extra scope at the time most teams have only one project anyway) |
| 2026-05-13 | Auth = email magic link only; 30-day sliding session | Eliminates password complexity (recovery, rotation, leaks). 30-day session makes the email friction tolerable for B2B daily use | Password auth (rejected — extra UX, security, and recovery surface); shorter session (rejected — too much friction for daily users) |
| 2026-05-13 | No billing in MVP — free during beta, capped at 15 users | Stripe / pricing / tax / invoices / dunning is a large surface area that doesn't matter until real demand exists; 15-user cap caps cost exposure | Day-one Stripe (rejected — over-investment pre-validation); free forever (rejected — inconsistent with "product play") |
| 2026-05-13 | Drag-and-drop on desktop + tap-menu on mobile + keyboard-accessible | Drag-only is a usability dead-end on phones and inaccessible; menu-only feels lifeless on desktop. The dual-path cost is accepted | Drag-only (rejected — mobile & a11y); menu-only (rejected — desktop UX) |
| 2026-05-13 | Any user can edit / delete any task; archive added as the recoverable softer state | Per-task ownership permissions add complexity small teams do not want; archive gives a soft-delete alternative for the cautious | Owner-only edits (rejected — too restrictive for 2–15 person teams); no archive (rejected — would leave delete as the only de-clutter mechanism) |
| 2026-05-13 | Three email events only (magic-link, invitation, task-assigned) | Each email is a permanent piece of copy, deliverability concern, and preference surface; more emails train users to ignore the legitimate ones | Including due-date reminders (deferred to v1.1); including digest emails (deferred indefinitely) |
| 2026-05-13 | EU data residency + GDPR basics from day one; no SOC 2 / ISO / SSO | GDPR applies whether we want it or not; doing the basics is cheap; enterprise certs are mid-six-figure investments the target users don't ask for | "Skip GDPR for now" (rejected — illegal); "Pursue SOC 2" (rejected — wrong customer segment) |
| 2026-05-13 | **Pivot from "product sold to small businesses" → "personal / portfolio project"** | One proxy validation conversation produced two negative signals: planner would still build their own even with acceptable market alternatives (Linear), and could not name a single concrete prospective customer. Product-play framing retired. Scope retained for portfolio value and personal use. See `validation-2026-05-13.md` | Continue with product-play framing (rejected — no real customer evidence); kill the project entirely (rejected — personal use and portfolio value are still real); pivot to self-hostable / forkable Kanban (rejected — different product, more work) |

## 15. Next Steps

1. ~~One validation conversation, planner-as-proxy.~~ **Done 2026-05-13. Result: premise retired. See `validation-2026-05-13.md`.**
2. **Invoke `spec-driven-development`** with this revised plan as input. The spec will pick the email provider, pick a hosting vendor, define the data model, lay out routes / pages, and produce acceptance criteria.
3. **Parallel with the spec, resolve any remaining MVP-blocking questions** that surface during specification work — without re-running `/project-plan`.
4. **Set a personal mid-build motivation checkpoint.** Halfway through MVP implementation, the planner asks themselves honestly: *"Am I still going to use this when it ships, or have I lost interest?"* If the answer is *lost interest*, **stop**. Sunk cost is sunk. Portfolio value alone is not enough to push through a long tail of UI polish.
5. **Do not write production code** until both this plan and the spec are accepted. The load-bearing assumption ("agentic dev produces maintainable code") only holds when the agent has a tight spec to work against.

---

**Status of this plan:** Foundation, not ship-ready. The original premise was tested and retired; the project continues on a personal / portfolio motivation. The most likely failure mode now is mid-build motivation collapse (Risk 1b) — guarded by Next Step #4.
