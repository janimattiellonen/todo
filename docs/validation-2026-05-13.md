# Validation — Proxy Conversation, 2026-05-13

> Output of Section 15 Next Step #1 of `docs/project-plan.md`.
> Single proxy interview. The planner sat in the customer chair. Bias flagged from the start: planner ≠ independent respondent; this is a self-interview, not a market signal.

## Format

Four discovery questions, Mom-Test-style (past behaviour over future intent, specifics over generalities, no pitching from the interviewer side).

## What we heard

| # | Question | Answer |
|---|----------|--------|
| 1 | How do you track team work today? | Jira. Feels bloated, pricey, too many unused features. Use filters to see what's delegated to whom. |
| 2 | Have you ever tried to leave Jira? | Yes — evaluated Linear, "felt pretty good." Chose to build own anyway, for ownership / "freedom to design toward future needs." |
| 3 | Pre-decision: would you have *paid* a third party for a small-business-focused Jira alternative? | "Most likely still gone with the choice of creating our own." |
| 4 | Name one concrete small business you believe would pay for this product. | "Have no candidates to name at the moment." |

## Findings

1. **The user-level pain (Jira bloat / pricing) is real and remembered.** Q1 produced a concrete, unprompted complaint. There is *a* pain in the space.

2. **The pain has a market solution already (Linear), and it was acceptable.** Q2 collapses the original Section 2 premise that "existing tools are overbuilt for small teams" — at least one existing tool was found to be fine.

3. **The proxy is not a customer of the product being planned.** Q3 was an explicit falsification: even with no ownership-bias in the question framing, the proxy would still build their own rather than pay a third party. The planner and the proxy share this trait, which means we are designing a product for ourselves but pitching it to "other small businesses."

4. **The planner cannot currently name a real prospective customer.** Q4 produced no concrete prospect. This is not a fatal finding by itself, but combined with #3 it means the entire target-user description (Section 3) is currently a model in the planner's head with no real-world referent.

## Implications for the plan

- **Section 2 (Problem & Motivation) is partially refuted.** The "overbuilt" pain is real, but the market solution exists. The differentiator hypothesis ("strip it down further") does not survive a single proxy contact who was happy with Linear.
- **Risk #1 ("premise unvalidated") was rated Medium/High. After this conversation it should be raised to High/High** until independent prospects are identified.
- **The Section 2 stated "why now" (ownership + agentic dev) is internally consistent but is a *builder's* motivation, not a *buyer's* pain.** A product-play depends on the buyer's pain, not the builder's preference.
- **The Section 15 next-step plan was: validate, then move to spec-driven-development.** That sequencing should change. The honest current state does not justify spec work yet.

## Recommended decision

Pick one of these *before* any further build:

1. **Reframe as a personal / portfolio project.** Drop the "sold to other small businesses" framing (Section 3, Section 7 billing roadmap). Build it because *you* want to own it. The plan still works, but with substantial scope reduction (no billing, no support, no T&Cs urgency, no multi-tenancy isolation as a hard requirement).
2. **Keep the product-play framing, but pause planning until at least 5 independent prospects are interviewed.** No spec, no code, until either (a) 5 non-proxy conversations confirm the pain *and* willingness to pay, or (b) one real prospect agrees to be a design partner.
3. **Pivot the premise.** If the planner finds the "builder's freedom" motivation genuinely the real driver, the product might better be framed as "self-hostable / forkable Kanban for businesses that want to own their stack" — which is a different product, a different audience (technical founders), and a different motion (open source + paid hosting? Per-instance license?). Would require a fresh Section 2.

## Honest framing of this note's weight

One proxy conversation cannot validate or invalidate a product premise on its own. What it *can* do is produce **disqualifying signals cheaply** — and that's what happened here. The findings above should be treated as a *gate*, not a *verdict*: the gate has not been passed, so further investment is paused. The verdict requires real, independent users.
