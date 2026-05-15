# Project Plan — &lt;project name&gt;

> A **non-technical** plan. Captures *what* and *why*, not *how*. Technical specs come next.
> Status: Draft · Last updated: &lt;YYYY-MM-DD&gt;

---

## 1. Executive Summary

One short paragraph. Anyone — engineer, designer, stakeholder — should be able to read this and know what is being built, for whom, and why now.

## 2. Problem &amp; Motivation

- **The pain:** What problem does this solve? Be specific about the situation users are in today.
- **Why now:** What has changed, or what cost is being paid by not solving it?
- **Evidence:** Anything we know to be true (user feedback, observed behaviour, market signal). Mark items as *assumed* if not verified.

## 3. Target Users

- **Primary user(s):** Role, context, scale (one user / small team / large org).
- **Secondary users:** If any (admins, invited collaborators, integrators).
- **Explicitly not for:** Who this is *not* trying to serve right now.

## 4. Goals &amp; Non-Goals

**Goals** — outcomes we are trying to achieve, in plain language.
- &lt;goal 1&gt;
- &lt;goal 2&gt;

**Non-goals** — things we will deliberately *not* pursue in this version, even if tempting.
- &lt;non-goal 1&gt;
- &lt;non-goal 2&gt;

## 5. Success Metrics

How will we know this worked? Prefer measurable signals over feelings.
- &lt;metric 1 — e.g. "an invited user can create their first task within 2 minutes of receiving the invitation email"&gt;
- &lt;metric 2&gt;

If no metric is realistic at this stage, say so and capture the qualitative signal we'll watch instead.

## 6. Scope — MVP

The smallest version that delivers the core value. Bullet list of capabilities, not features-as-jargon.

- &lt;capability 1&gt;
- &lt;capability 2&gt;

## 7. Scope — Later

Things we want eventually but are deliberately deferred past MVP. Capture them so they aren't forgotten — and so the MVP stays small.

- &lt;deferred item 1&gt;
- &lt;deferred item 2&gt;

## 8. Out of Scope

Things we will **not** build, at all, in the foreseeable horizon of this plan. Naming them prevents scope creep later.

- &lt;out-of-scope item&gt;

## 9. Key User Flows

Walk through the most important end-to-end journeys in prose or short numbered steps. One per flow.

### Flow: &lt;name, e.g. "First-time user onboarding"&gt;
1. &lt;step&gt;
2. &lt;step&gt;
3. &lt;step&gt;

### Flow: &lt;name&gt;
1. ...

## 10. Constraints &amp; Assumptions

- **Time / deadline:** &lt;or "none stated"&gt;
- **Budget:** &lt;or "none stated"&gt;
- **Team / capacity:** &lt;who's building, at what capacity&gt;
- **Hard constraints:** Legal, regulatory, contractual, accessibility, data residency, etc.
- **Working assumptions:** Things we're treating as true to make progress, that may need validation.

## 11. External Dependencies

Third-party services, APIs, or integrations the plan relies on. For each, note *what it gives us* and *what breaks if it disappears or changes pricing*.

- &lt;service / API&gt; — &lt;role&gt; — &lt;fallback or impact if it goes away&gt;

## 12. Risks &amp; Unknowns

The honest list. Include risks the team has dismissed if you (as planner) still think they're real — flag the disagreement.

- **&lt;risk&gt;** — likelihood / impact — mitigation or "accepted"

## 13. Open Questions

Things still genuinely undecided. Each item should be answerable later — don't use this section as a dumping ground for vague concerns.

- [ ] &lt;question&gt;
- [ ] &lt;question&gt;

## 14. Decision Log

Decisions reached during planning, with the reason. Future readers (and future-you) need the *why*, because the *what* will already be in the doc.

| Date | Decision | Why | Alternatives considered |
|------|----------|-----|-------------------------|
| YYYY-MM-DD | &lt;decision&gt; | &lt;reason&gt; | &lt;what we rejected and why&gt; |

## 15. Next Steps

What happens after this plan is accepted. Usually one of:

- Move to **spec-driven-development** for the MVP scope.
- Another **grill-me** round on a specific area that stayed thin (name which).
- A short **prototype** or **spike** to de-risk a specific unknown.

State the recommended next step explicitly, and which open questions need answering before that next step can start.
