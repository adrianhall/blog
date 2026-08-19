# Post Ideas: Agentic AI & Software Engineering

Candidate topics for the ongoing "vibe-coding → software engineering" thread, derived
from a gap analysis of everything published in `src/content/posts/2026`.

Ordered by recommended publication sequence. Tiers reflect the size of the gap and
how well the topic fits the existing voice, not difficulty.

## Already covered (for reference)

Do not re-tread these except to deliberately update or retire prior advice.

| Date | Post | Core contribution |
|------|------|-------------------|
| 2026-04-03 | The AI Maturity Model | 6 stages, nano-assistant → squad leader |
| 2026-04-05 | Are we in an AI bubble or an AI revolution? | dot-com parallel, macro take |
| 2026-04-07 | Ten rules for spec-driven design | Spec / Constitution / Work Breakdown |
| 2026-04-09 | Using Jobs-to-be-done | JTBD + CIRCLES tradeoffs vs. PR-FAQ, HPF, user stories |
| 2026-04-11 | Effective prompts for agentic engineering | MoSCoW constitution, GIST work breakdown, process skill |
| 2026-04-19 | Setting up a project for Agentic AI | scaffold, `opencode.jsonc`, reviewer sub-agents, skills |
| 2026-06-07 | Testing in an agentic coding world | "Confirmation-Driven Development", adversarial M/Q/X agents |
| 2026-05-25 | Has AI killed collaboration? | human / social cost |
| 2026-07-25 | The era of API keys is over | agentic reverse-engineering as threat model |
| 2026-08-14 | Setting up a coding project for agentic coding | hand-scaffold, skills, `AGENTS.md`, `.agentignore`, TDD |
| 2026-08-18 | Are we compromising readability? | defensive-code bloat, readability guard rails |

---

## Tier 1 — the big holes

### 1. Context engineering as an engineering discipline

**Thesis:** Context is a budgeted, engineered resource, not a side effect of tooling.

Referenced obliquely in at least five existing posts ("context collapse", `.agentignore`,
atomic step-projects) but never the subject. Natural part 4 of the agentic-engineer series.

- Anatomy of a context window: system prompt → `AGENTS.md` → skill frontmatter → tool
  schemas → file reads → tool output.
- Context rot and lost-in-the-middle; why a 200k window is not 200k of *usable* attention.
- Sub-agents as a **compression** technique, not just a parallelism one.
- `compact` vs. `prune` vs. `clear` — both are enabled in the published `opencode.jsonc`
  and never explained.
- Token accounting as a measurable engineering metric.

### 2. Security of the agentic loop

**Thesis:** The agent is a new, under-modelled attack surface, and the guard rails I
published are unexplained.

Currently one passing mention of "prompt injection". Meanwhile readers are told to
`npx skills add <third-party repo>` — i.e. to run untrusted instructions with `edit: allow`.

- Indirect prompt injection: issue bodies, READMEs, MCP tool output, `node_modules`.
- The lethal trifecta: private data + untrusted content + an exfiltration path.
- Malicious and abandoned skills as a supply chain; slopsquatting hallucinated packages.
- MCP servers as attack surface.
- A **threat-model rationale** for the `opencode.jsonc` permission blocks already published.
- Pairs directly with "The era of API keys is over".

### 3. Brownfield adoption

**Thesis:** Every mechanics post so far starts with `npm create`. Most readers cannot.

The single biggest audience gap — a 300k-line, 8-year-old repo with 12% coverage.

- Spec archaeology: reverse-engineering a spec from code so Rule 10 has something to live in.
- Generating an architecture map as durable, reusable context.
- Characterization tests (Michael Feathers) as the agentic entry point — a natural fit
  for the existing Agent Q / Agent X split.
- Seam-finding; strangler-fig with agents.
- Growing `AGENTS.md` incrementally per-directory rather than one root file.

### 4. Evals for your own agentic setup

**Thesis:** `AGENTS.md`, skills and prompts are code, and code without regression tests rots.

An elaborate pipeline has been published (constitution, skills, three reviewers, M/Q/X)
with no measurement of whether any of it works.

- A golden task suite; first-pass rate, rework rate, cost per feature.
- Running the same work breakdown across three models as differential review.
- A/B a guard rail *before* adopting it.
- Hook: the readability post reports the agent pushing back on its own guard rails —
  did they actually improve the output? Currently unknown. That is the post.

### 5. Human review at agentic throughput

**Thesis:** "You become the code reviewer" is stated three times and never examined.

- Diff review does not scale to 5k-line PRs; automation bias makes rubber-stamping default.
- Review the plan, not the diff.
- Risk-tiered review: which files ever actually need human eyes.
- PR-size limits as a constitution rule.
- Reviewing the *test* as a cheaper proxy for reviewing the code.
- When three parallel reviewer agents produce false confidence.

---

## Tier 2 — differentiated by platform expertise

### 6. Skill vs. sub-agent vs. command vs. MCP server — a decision matrix

All four are used across existing posts; the choice between them is never explained.
Plus how to actually *write* a skill: the frontmatter description is a retrieval key, so
a weak description means the skill silently never loads. Progressive disclosure. Testing a
skill. "Don't build god skills" gets one line in the Aug 14 post and deserves a whole one.

### 7. Unit economics of agentic engineering

"Billing model changes" appears once; "$2.55 in tokens" once. A post with real numbers:
model routing (haiku for mechanical, opus for planning — done, never justified), prompt
caching, cost per merged PR, and why a 3-week spec that builds in 2 days is a *cost*
argument and not only a quality one.

### 8. Long-running and async agents on durable infrastructure

Uniquely available given the Workflows / Queues / Durable Objects posts. The shift from
interactive terminal sessions to fire-and-forget: checkpointing, resumability, human
approval as an explicit workflow step, orchestrator fan-out/fan-in. The maturity model
teases "leave the agent squad to it over the weekend" and never shows how.

### 9. Parallelism mechanics

Worktrees and tmux are repeatedly presented as solved; they are not. Merge-conflict
economics, interface-first decomposition as the *enabler* of parallelism (the Apr 11
"indicate parallelization" instruction assumes the hard part is already done), why agents
thrash on shared files, and when parallel is measurably slower.

### 10. The memory hierarchy — ADRs as agent infrastructure

Why does the agent keep reintroducing the pattern deleted last week? What belongs in
`AGENTS.md` vs. a skill vs. an ADR vs. the spec vs. a code comment — and the write-down
discipline that makes Rule 10 actually function.

---

## Tier 3 — contrarian and long-tail

### 11. When *not* to use an agent

Honest triage: tiny diffs, perf work needing measurement, novel algorithms, crypto,
ambiguous product discovery. High shareability, and credible from this author specifically.

### 12. Debugging code you didn't write

Named as a pain in the readability post, never solved. Structured logs as the agent's
eyes, repro-as-failing-test first, agent-assisted bisect. Ties to the Cloudflare
observability constitution rule.

### 13. Team and organizational adoption

Everything published so far is single-practitioner. Who owns the constitution across 20
engineers? Provenance, licensing, and the junior-engineer pipeline question that the
readability post *raises* and leaves unanswered.

### 14. "Your code is a build artifact of your spec"

Spec-drift detection, spec repos, regenerating rather than patching. A provocative thesis
post that closes the loop on Rule 10.

### 15. Model portability

Model IDs are hard-coded throughout the published configs. Capability drift on model
updates, pinning vs. autoupdate, and whether a spec survives a model swap.

### 16. Agentic refactoring vs. codemods

When to have the agent write a deterministic script instead of doing the work itself.
Consistent with the existing "prefer deterministic tools" stance.

### 17. Visual and frontend verification

Agents cannot see. Screenshot loops, design system as constitution, Storybook as the spec
surface (one mention in the Aug 14 post).

---

## Outstanding promises from published posts

These are commitments already made to readers.

- **An AI-first repo template.** The Apr 11 post closes with: *"the 'Cloudflare dev
  platform AI repository' template can be created and then modified on a per-organization
  basis. But that's something for another time."* A publishable template is an outstanding
  promise and likely high-traffic.
- **Stage 7.** The maturity model says *"I don't know if there will be another stage"* — a
  natural anniversary revisit, strongest if idea #4 (evals) has produced data by then.
