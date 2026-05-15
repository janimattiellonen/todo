---
name: project-plan
description: Turn a rough initial product prompt into a solid non-technical project plan via a structured grilling session. Use when the user wants to refine an idea into a plan, says "let's plan this", asks for a project plan, or hands over a one-shot product description that needs interrogation before any spec or code work.
---

# Project Plan

Take a raw initial prompt — vague or detailed — and produce a non-technical project plan at `docs/project-plan.md` that is solid enough to serve as the foundation for the next phases (spec, technical design, implementation).

The plan is produced **with** the user, not **for** them. The deliverable is a document; the value is the conversation that shaped it.

## Tone

- Be honest. Do not flatter the prompt. If something is missing, contradictory, or unrealistic, say so.
- Do not invent requirements the user did not state. If something is unclear, ask. If something is unstated, mark it as an open question — do not silently fill it in.
- Respect that a short initial prompt may be deliberate. The user often wants a solid first draft they can iterate on, not an interrogation that prevents them from getting started. Offer to stop at every section boundary.
- For every question, provide your own recommended answer with a short rationale. Don't ask open questions in a vacuum.

## Phase 1 — Capture and analyze

1. **Locate the initial prompt.** Either the user supplied it as an argument to the skill, or it is in the most recent user messages. If neither, ask the user for it before continuing.

2. **Read [TEMPLATE.md](./TEMPLATE.md)** to load the section structure.

3. **Map prompt → template, privately.** For each section of the template, note what the prompt already covers and what is missing, vague, or contradictory. Do not ask anything yet.

4. **Surface assumptions and gaps to the user, before grilling.** Output a single block:

   ```
   INITIAL READING

   What the prompt is clear about:
   - <bullets>

   What is missing or vague (will grill on):
   - <bullets>

   Inconsistencies / things I want to push back on:
   - <bullets>

   Assumptions I'd default to if you don't correct me:
   - <bullets>

   I'll now walk the template section by section. After each section,
   you can continue, skip, or stop and synthesise what we have.
   ```

   Wait for the user to react. They may correct assumptions, narrow scope, or tell you to skip ahead. Honour that.

## Phase 2 — Grill section by section

Walk the template sections **in order**. For each section:

1. **Ask one question at a time.** Never batch. Wait for the answer before asking the next.

2. **Each question must include your recommended answer** and a one-line reason. Format:

   > Question: <specific question>
   > Recommended: <your default>
   > Why: <one line — a tradeoff, a risk avoided, or a known pattern>

3. **Push back when warranted.** If the user's choice has a clear downside, name it and propose an alternative. Accept their decision after they've heard the downside.

4. **Cross-reference earlier answers.** If something the user just said contradicts an earlier answer or the original prompt, flag it immediately — do not paper over it.

5. **Skip a question if it can be answered by reading the prompt or earlier answers.** Do not ask the user for things they already told you.

6. **At the end of each section, offer the exit.** Use a short check:

   > Section "<name>" done. Continue / skip next section / stop and synthesise?

   If the user says stop or skip, mark remaining items in that section as **open questions** in the final plan — don't fabricate answers.

7. **If `/grill-me` is available as a skill**, you may invoke it to handle the questioning loop. Otherwise, run the loop yourself following the rules above. Either way, the section-boundary stop check is your responsibility.

## Phase 3 — Synthesize the plan

Once the user signals "done" (either by completing all sections or stopping early):

1. **Write `docs/project-plan.md`** using the structure in [TEMPLATE.md](./TEMPLATE.md). Create the `docs/` directory if it does not exist.

2. **Fill what you have. Leave what you don't as explicit open questions.** Do not invent content to fill gaps. An honest "TBD — see Open Questions" beats a plausible-sounding fabrication.

3. **Populate the Decision Log** with key decisions reached during grilling and the *why* — not just the *what*. Future-you needs the reasoning.

4. **List Risks & Unknowns honestly.** Include risks the user dismissed but that you still think are real — flagged as such ("User considers this low risk; I rate it medium because <reason>"). One paragraph, not a lecture.

5. **Recommend the next phase.** Usually `spec-driven-development` for the MVP scope, or another `/grill-me` round on a specific area that stayed thin.

## Phase 4 — Final read-back

After writing the file:

1. Print a short summary: where the file was written, how many open questions remain, and which areas are thinnest.

2. List the top 3 things that, if changed, would meaningfully reshape the plan — so the user knows where future iteration has the most leverage.

3. Do **not** claim the plan is "complete" or "ready to ship". It is a foundation. Say so plainly.

## Failure modes to avoid

- Asking ten questions in one turn instead of one at a time.
- Filling unanswered sections with confident-sounding guesses.
- Agreeing with every user answer instead of pushing back when the answer has a known downside.
- Treating the template as a checkbox exercise rather than a conversation framework — if a section genuinely doesn't apply (e.g. no external dependencies), say so and move on rather than manufacturing content.
- Forgetting to offer the user the exit at each section boundary.
- Re-asking things the prompt already answered.
