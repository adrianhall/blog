# Agent Series: Proposed Articles

A seven-part series, published on successive Fridays, that builds an agentic coding environment on
Cloudflare one piece at a time. Each part adds one capability to the same agent. The series stops at
the agentic coding environment. PiHarness and OpenCodeHarness are a later topic.

> **Revision note (2026-10-28).** This is the second version of the plan. All seven parts are now
> built, deployed to a test account, verified by hand, and tagged `coding-agent/part-1` to
> `coding-agent/part-7` on the internal remote (`origin`). Nothing has been pushed to the public
> GitHub repo. The original plan is kept wherever it still holds. Everything that changed while the
> code was written is marked **Changed from the earlier plan**, and the section "What changed from
> the earlier plan" lists every change in one place so a reviewer can check them quickly.

## Series goal

Show how an agent differs from a chatbot. The difference is the ability to act (tools) inside a
multi-step loop that carries memory from one step to the next. By the end, the reader has a working
agent that can understand and change a repository.

## Conventions

- Each part that has code ends with a Git tag so readers can diff one part against the previous. The
  repo already uses slash-style tags (`astrojs/link`, `cf/tooling`), so the series follows suit:
  `coding-agent/part-1`, `coding-agent/part-2`, and so on. The number is the article number. Every
  part has a tag, and Part 1's tag marks the non-agent baseline app. Each article links to the
  GitHub compare view for its tag pair, for example
  `https://github.com/adrianhall/cf-demos/compare/coding-agent/part-2...coding-agent/part-3`. Part
  1's article links to the tree at its tag, because there is nothing earlier to compare with.
- **Scope the diff to more than the demo directory.** A part's changes aren't all under
  `flue-demos/coding-agent`. New packages change the root `pnpm-lock.yaml`, and beta packages need
  entries in `minimumReleaseAgeExclude` in `pnpm-workspace.yaml`. A path-limited diff should include
  those files, and the article should call out any root-level change so readers don't miss it. What
  actually changed at the root: Phase 0 (before Part 1) added the `flue-demos/*` workspace glob, the
  `allowBuilds` denials for `@google/genai` and `protobufjs`, a `minimumReleaseAgeExclude` entry,
  and the `AGENTS.md` edits that created the `flue-demos/` family. Parts 1, 2 and 3 each touched
  `pnpm-lock.yaml` and nothing else outside the demo. Part 4 touched `pnpm-lock.yaml` and
  `flue-demos/AGENTS.md` (the recorded `server.accept()` exception). Parts 5, 6 and 7 touched
  nothing outside `flue-demos/coding-agent` and `specs/`. No part after Phase 0 changed
  `pnpm-workspace.yaml`, so no release-age exclusion was needed. Part 1's article calls out the
  Phase 0 changes (see "Demo repository").
- **Publish tags on the Friday, not before.** GitLab is private staging and GitHub is public.
  Develop the parts on GitLab, then push each tag to GitHub on its publication day. Push named tags
  only (`git push github coding-agent/part-3`), never `git push github --tags`, because that would
  also publish the unrelated internal tags. The `github` remote currently holds none of the series.
- **Fix forward, never retag.** Once a tag is public and linked from an article, readers rely on it.
  If a published part has a bug, fix it in a later commit and mention it in the next article, or add
  a `-fix` tag. Don't move the tag. **This now matters in practice.** Two bugs in Part 5's code were
  found after the Part 5 and Part 6 tags and fixed in commits that are only in the Part 7 tag (see
  Part 5, "Found after the tag"). The articles for those parts should say so and link to the fix
  commits.
- The loop file should change as little as possible between parts. Each part adds one seam: a tool,
  a sandbox binding, a memory store, a skills directory, or an MCP connection. This held, with one
  exception that the Part 6 article should own up to: Part 6 changed the sandbox's working
  directory, which is a change to the Part 4 seam.
- **Each part adds one inspector tab to the UI** (Context in Part 1, Tools in Part 3, Terminal in
  Part 4, Memory in Part 5, Skills in Part 6, MCP in Part 7). Part 2 adds no tab. It swaps where the
  data comes from. The UI skeleton is built once in Part 1 so later parts only add a tab and a few
  context-segment colours. **Changed from the earlier plan:** the tab strip reads Context, Tools,
  Memory, Skills, MCP, Terminal in the Part 7 tag. Terminal is deliberately last, because it is a
  place to work and not something to read, so it stays at the end however many reading tabs a part
  adds. Parts 4 to 6 show it earlier, because the rule came after those tags.
- **Parts 1 and 2 are a before-and-after pair.** Part 1 is a Worker app that makes one model call
  per message and keeps the conversation in the browser. Part 2 moves it into an agent. The Part 1 →
  Part 2 diff is the article's main exhibit, so keep Part 1 free of agent-shaped code that Part 2
  would only rename.
- Each part ends with a transcript excerpt that shows the new capability in use.
- Stack: Cloudflare Workers, Durable Objects (SQLite), Flue for the agent framework, Workers AI
  through AI Gateway for models, Terraform for infrastructure, and Vue 3 / Vuetify / Pinia for the
  UI (the demos repo's UI stack).
- **Pin versions in each part** and record them in the article, because Flue and the Agents SDK
  change quickly. The pins in the Part 7 tag, all taken on 2026-10-26 to 2026-10-27, are:
  `@flue/runtime`, `@flue/sdk`, `@flue/vite` and `@flue/cli` 2.3.0; `@cloudflare/vite-plugin`
  1.65.0; Wrangler 4.152.0; `vite` 8.3.4; `@cloudflare/vitest-plugin` 1.4.3;
  `@cloudflare/workers-types` 5.20261019.1; `@cloudflare/sandbox` 1.0.3 (Part 4); `@xterm/xterm`
  6.0.0 and `@xterm/addon-fit` 0.11.0 (Part 4); `@valibot/to-json-schema` 1.8.0 (Part 3);
  `@adrianhall/cloudflare-toolkit` ^2.7.0; and, for the Part 6 install command only, the `skills`
  CLI at 1.7.4. If the articles are published after these versions move, re-check them the day each
  part starts, and say in the article that the tag still builds with the pins it was written
  against.
- **Where each part's tag sits.** Part 1 `c03eef2`, Part 2 `9ee38ec`, Part 3 `41f4316`, Part 4
  `42df87a`, Part 5 `14ee3f2`, Part 6 `617ab53`, Part 7 `15bc50e`. A part's tag includes its
  operator-check commits, so a reader who checks out a tag gets the code and the recorded results.
- **Two README rules the series follows,** because the articles quote the README. It states only
  what the project does, what each part adds with its tag, prerequisites, commands, how to run
  locally, deploy, tear down and test. It carries no history, no measured figures, no limits, no
  security or retention sections, no versions list, and no known-issues section. Anything the
  article wants to say about those goes in the article and in `specs/coding-agent/`, not the README.

## Demo repository

All code lives in the demos repo as a new demo, `flue-demos/coding-agent`, in a new `flue-demos/`
family that sits beside `cf-terraform-demos/`, `vinext-demos/` and `wrangler-demos/`. The repo is
developed in `~/gitlab/demos` (private staging, `origin` on GitLab) and published to the public
GitHub repo `https://github.com/adrianhall/cf-demos` (the `github` remote), which is what readers
see. The engineering specification and phased plan are in `specs/coding-agent/` in that repo:
`01-specification.md` (what is built), `02-implementation.md` (the phases), the two spike write-ups,
`03-gateway-attribution.md` and `04-part-5-open-issues.md`. The repo's `AGENTS.md` files apply in
full, and `flue-demos/AGENTS.md` records the one thing that differs. The rules that most shape this
series:

- **pnpm only. `cf` is strongly preferred, but not required in this family.** Flue's Cloudflare
  target is documented around Vite and Wrangler: an authored `wrangler.jsonc`, author-owned Durable
  Object migrations, and `wrangler deploy`. Flue does not generate or consume a
  `cloudflare.config.ts`. So this demo deploys with `vite build` then `wrangler deploy`, with
  `wrangler.jsonc` generated from a committed `wrangler.jsonc.tpl` and never committed. A reader who
  copies the demo copies what Flue documents. This is a statement about Flue's current support, not
  a judgement against `cf`, and the README and `flue-demos/AGENTS.md` say so. Phase 0 moved the "you
  must use `cf deploy`" rule out of the repo root and into the `cf-terraform-demos` and
  `vinext-demos` family files, so the root only states a preference.
- **Terraform owns infrastructure; Wrangler owns code and bindings.** Lifecycle is
  `terraform apply → outputs.json → generate-wrangler → vite build → wrangler deploy`. **Changed
  from the earlier plan:** teardown now runs five steps in this order: `teardown:containers` (delete
  the container application), `teardown:images` (delete every tag of the sandbox image),
  `teardown:worker`, `teardown:infra` (`terraform destroy`), then `teardown:clean` (remove generated
  files). The image step is new. `destroy-containers` deletes the application but leaves its
  registry image tag behind (found in Part 4, fixed in Part 6; see Part 4). This is the pattern
  `wrangler-demos/review-agent` proved, rebuilt on the repo's current standards.
- **Four tiers** (UI → API → application → infrastructure), with Hono routes kept thin and storage
  behind a port. The agent file is a thin adapter: a tool's `run()` calls an application use case.
  Because the agent module cannot import the composition root, tools and memory tools reach it
  through small registration seams (`registerTools()` and `registeredTools()`, and
  `registerMemoryTools()`), and the model provider through `registerModelProvider`.
- **Cloudflare Access in front of everything. This is a corporate requirement for every
  web-accessible property, and it holds from the first commit of Part 1.** There are three layers
  from one shared policy list: a Terraform-owned Access application over the whole hostname, the
  toolkit's `cloudflareAccess()` middleware (through `@demos/worker-common`) validating the JWT, the
  audience and the specific identity inside the Worker, and the toolkit's `cloudflareAccessPlugin()`
  Vite plugin emulating Access locally. There is no public route, no health-check bypass, and no
  `workers.dev` hostname. Use `@demos/worker-common` for the middleware, `/api/me`, body limits, and
  `upgradeRequired()`. Parts 2 to 7 add routes, and none adds a hostname or an Access exception.
- **Five required scripts** (`start`, `check`, `fix`, `deploy`, `teardown`), complete JSDoc,
  Oxfmt/Oxlint, finite integration-test timeouts, and no `.dev.vars`. Workers-runtime tests use
  `@cloudflare/vitest-plugin`. `pnpm check` never writes a file: in Part 1 it runs against a
  temporary copy. From Part 4, **Docker must be installed and running locally**, because
  `wrangler deploy` builds the sandbox image. Nothing checks for it, and the README lists it as a
  prerequisite.
- Root `README.md` gets a new entry for the family and the demo.

## What the spikes found

The original plan listed six things to verify before writing code. Each could change the code or the
article. Two were run locally before Phase 0, and the rest were settled in the phase that needed
them. The evidence and the copy-pasteable recipes are in `specs/coding-agent/SPIKE_FINDINGS.md`. The
list below keeps the original order and says how each one ended.

1. **Flue with `cf` (was: blocks Part 2).** Resolved differently from the plan, and it held through
   all seven parts. Flue's Cloudflare target is built on `flue()` plus `@cloudflare/vite-plugin` and
   Wrangler, and it expects an authored `wrangler.jsonc` with the Durable Object migrations written
   by the author. Forcing the `cf` toolchain onto it would have made the demo teach a workaround
   instead of Flue. So the demo lives in a new `flue-demos/` family and follows Flue's documented
   path. Three facts the article should state: the Vite plugins are
   `[flue(), cloudflare({ config: flueWorkerConfig() })]` (plain `cloudflare()` fails with a
   `[flue]` error), Flue merges its configuration in memory and writes no files, and Durable Object
   migrations use `migrations` only, never `exports` (they are mutually exclusive, and Flue needs
   `migrations`). The Part 4 sandbox class is declared the same way, which the spike had not
   confirmed and the deployment did.
2. **Context viewer data source (Part 2).** Resolved as planned. A module-scope `observe()` writes a
   compact snapshot **synchronously** into the agent's own Durable Object SQLite, and methods added
   with `extend({ base })` read it over RPC. An un-awaited write to a separate object was rejected
   as loss-prone. A `kill -9` mid-turn did not lose the snapshot. Verified facts worth a sentence
   each: writes must be idempotent (a hot reload delivers events from both the old and the new
   isolate), reasoning blocks are replayed to the model and count toward context, and redaction is
   by pattern only, so a secret that matches no pattern is stored. **Changed from the earlier
   plan:** the extension grew from two methods to three. Part 5 added `attachedRepository()`, so the
   Worker can find which repository a conversation has. It still overrides none of `fetch`,
   `onRequest`, `onFiberRecovered` or `alarm`.
3. **Sandbox SDK version (Part 4).** Decided from the 1.x documentation, then confirmed on a
   deployment. The demo uses `@cloudflare/sandbox` 1.0.3 and never 0.x, including the 0.11.x that
   Flue's own blueprint text still names. The 1.x package has no `Sandbox` class and no
   `getSandbox()`. The demo writes its own `Sandbox` Durable Object over `container.exec()` and
   `Files`, and Flue's sandbox adapter accepts it structurally (checkpoint C6, confirmed). The
   terminal is Cloudflare's tmux-over-`container.exec()` design (C9, confirmed).
4. **Agent Memory (Part 5).** **Changed from the earlier plan: not used.** Access to the private
   beta could not be assumed for readers, so the part was rebuilt on a SQLite-backed Durable Object
   with FTS5 keyword search. Checkpoints C11 and C12 were re-defined and both resolved. There is no
   null adapter and no optional binding, because nothing is optional any more. See Part 5.
5. **MCP Server Portal (Part 7).** Decided: no portal, and it held. A portal is protected by
   Cloudflare Access, and a Worker cannot present an Access service token to it, so a portal cannot
   be used non-interactively from this demo. The agent connects directly to the public Cloudflare
   documentation MCP server, which needs no credential, no Terraform, and adds no web-accessible
   property. The article presents the portal as the production step.
6. **Code Mode through Flue (Part 3).** **Changed from the earlier plan: not shipped anywhere in the
   series.** The spike showed Code Mode can be mounted from Flue with each tool defined once and the
   authorization boundary on the host side, but across 80 conversations it used 125 model turns
   against 110 for direct calling. The first revision shipped it as a second mode in Part 3. It was
   then moved to Part 7 as a way to improve MCP access, and finally dropped (decision 2026-10-27),
   because a tool mounted by `useMcpConnection` has a `run()` that throws and calls through a
   private Flue adapter, so a Code Mode script cannot call it. The numbers survive as a sidebar. See
   Part 3 and "What changed from the earlier plan".

How the checkpoints ended. Resolved: C1 to C4 (Spike 01), C5 (Part 3), C6 to C10 and C17 (Part 4;
C17 for the container application, and its image tag became C22), C11 and C12 (Part 5), C13 and C22
(Part 6), C14, C15 and C21 (Part 7), and the first half of C23 (the Worker connects to the MCP
server). Withdrawn: C19 and C20 (no Code Mode). Still open: C16 (local inference, settled by an
accepted fallback), C18 (three Part 2 gaps), and the second half of C23 (whether the model chooses
between the MCP search and `fetch_doc` sensibly). See "Open questions".

## Proposed articles

### Part 1: What makes an agent an agent

A concepts article that ships with a working baseline: a chat app on Cloudflare that is deliberately
**not** an agent. It gives the reader something to compare the agent against. Tag:
`coding-agent/part-1` (`c03eef2`). Covers:

- The loop and its stop condition
- Short-term memory (the transcript) versus long-term memory
- The harness landscape at a high level (Pi Durable, OpenCode, build-your-own), with a note that the
  harnesses get their own article later
- Why Durable Objects suit agents: per-agent state, SQLite storage, and recovery after eviction
- A tour of the baseline app, ending with the three things it can't do: remember across a reload or
  a device, act on anything, or take more than one model call per answer

Code: _Set up a UI and basic Terraform so the reader can see the difference between a "worker app"
and an "agent with a chat interface"._

This is the largest piece of code in the series, because it builds the app shell, the Access stack,
and the infrastructure that every later part reuses.

**The rule for this part:** the Worker makes exactly one model call per message and keeps nothing
between requests. The whole conversation lives in the browser. That is what makes it the "before"
picture, and it is what Part 2 changes. Part 1 has no Flue dependency, no `flue.config.ts`, and no
`src/agents/`. Its Worker is a plain Hono app and is the Worker entry. It uses `cloudflare()` alone,
with no `flue()` plugin.

**Infrastructure (`infra/`)**, following the repo layout:

- `providers.tf`: providers, dotenv data source, shared locals. The demo name, Worker name, gateway
  id and hostname are derived here and not added to the shared `.env`.
- `access.tf`: one self-hosted Access application over the **whole hostname**, with one `allow`
  policy that includes only `ADMIN_EMAIL` (not `everyone`). Part 4 gives the admin a root shell in a
  container, and the demo spends inference budget, so it is admin-only from the first commit.
- `ai-gateway.tf`: a Terraform-managed AI Gateway with every server-defaulted field pinned, copied
  from `wrangler-demos/review-agent`.
- `coding-agent.tf`: the Worker registration with observability set, a bootstrap version and
  deployment (`ignore_changes = all`), and the custom domain. The Worker registration disables
  `workers.dev` and preview URLs, because a `workers.dev` hostname would bypass a custom-domain
  Access application.
- `outputs.tf` (scalar, described outputs) and a committed `local-outputs.json` of placeholders, so
  `start`, `check` and tests never read live Terraform state.

`wrangler.jsonc.tpl` is committed and filled from the Terraform outputs by `generate-wrangler`. Its
observability block mirrors `coding-agent.tf` literally, because `wrangler deploy` resets a Worker's
observability to disabled when its configuration carries none.

No Durable Objects, no storage resources. **This held, and the article can make a point of it:**
`infra/` is byte-for-byte unchanged from Part 1 to Part 7.
`git diff coding-agent/part-1 coding-agent/part-7 -- flue-demos/coding-agent/infra` is empty. Every
later binding went into `wrangler.jsonc.tpl`. The original plan allowed for a possible Agent Memory
resource in Part 5, which did not happen.

**Access, built first.** Before any feature code, build and test the Access stack so every later
route is born protected: `src/access-policies.ts` exports one `buildAccessPolicies(audience)` list
used by both Vite and the Worker, the Worker mounts `createAccessMiddleware` first (with
`defaultAction: 'block'`) followed by a `requireAdmin` check, and `cloudflareAccessPlugin()` is the
first Vite plugin with two selectable local identities, one of which is not `ADMIN_EMAIL`, so the
admin check can be seen to reject it. The article shows that Access is emulated locally and never
disabled, so the local and deployed authorization paths are identical. (In the shipped demo the
locals are `admin@example.com` and `visitor@example.com`.)

**Worker (`src/worker/`)**, in tiers:

- API: Hono routes. `/api/me` and `POST /api/chat`, behind the Access middleware from
  `@demos/worker-common`.
- Application: a chat service that validates and bounds the transcript the client sends. Only `user`
  and `assistant` roles are accepted, because a client must never be able to inject a `system`
  message. It also enforces a maximum message count and total size. The system prompt lives on the
  server. The default 8 KiB body limit is too small for a transcript, so the route passes an
  explicit limit and documents why, as the repo rules require.
- Infrastructure: a single module that is the only caller of the `AI` binding, and always goes
  through AI Gateway. **Changed from the earlier plan:** the plan said each request is attributed to
  the verified identity in gateway metadata. Part 1 does this (its gateway logs carry the user and
  the part). Part 2 cannot, and the article for Part 2 should say so (see Part 2, "Gateway
  attribution"). The one-call-site pattern is `playground`'s, with a build-failing isolation test
  (`check:gateway`). It is demo-local code in `playground`, not part of `worker-common`, so copy the
  pattern and don't import it.

**Model.** One constant, used by every part: `@cf/moonshotai/kimi-k2.6` (as
`cloudflare/@cf/moonshotai/kimi-k2.6` for Flue's `useModel`), in `src/shared/model.ts`. Part 3 needs
tool calling, so it is chosen once, here. **It held:** Part 3's transcript confirmed Kimi K2.6 calls
tools reliably through Flue (C5), so the constant never changed. The alternate is
`@cf/zai-org/glm-5.3-flash`.

**Context inspector.** A shared `ContextSegment` discriminated union (in `src/shared/`) with a
`kind` per colour. Part 1 ships these kinds: `system`, `history-user`, `history-assistant`, `user`
(the current prompt), and `assistant`. Later parts only add kinds, and adding one fails the client
build until the legend and colour map handle it (an exhaustive `switch` with a `never` check). The
full set in the Part 7 tag is eleven: the five above plus `tool-definition`, `tool-call`,
`tool-result` (Part 3), `memory` (Part 5), `skill-catalog` (Part 6) and `mcp-definition` (Part 7).
The UI shows a stacked bar of segment sizes, a legend driven by `kind`, and a segment list with the
text. Token counts per segment are estimates from `gpt-tokenizer` and are labelled as estimates. The
legend and list repeat the labels, so colour is never the only carrier of meaning.

The inspector reads from a small `ContextSource` port. In Part 1 the Worker knows exactly what it
sent, so it returns the segments alongside the reply. Part 2 replaces the source, not the component.

**Usage and cost.** A bar showing tokens in/out and the billed cost, plus a **model calls** counter
that reads "last answer of total". The counter reads 1 for every response in Parts 1 and 2, and it
is what moves in Part 3. Token counts come from the Workers AI response, and the billed cost comes
from the AI Gateway log lookup, behind a `CostSource` port that fails soft: a failed lookup shows
tokens without cost and never an error. The gateway writes its log a little after the answer, so the
cell says "Waiting for the gateway log…" until the lookup resolves. Label any figure that is an
estimate.

**Chat UI.** A Pinia store holds the messages in memory and sends the whole transcript with every
request, then streams the reply into the list as NDJSON frames. The inspector is the first (and for
now only) tab in an inspector panel, so later parts add tabs and don't restructure the page. A page
reload clears the conversation. That is intentional, and the article shows it.

**Tests.** Unit tests for the segment builder and for transcript validation, including a rejected
`system` role and the size bounds at and either side of each limit. The gateway-isolation test.
Component tests for the store and inspector. Access tests: a policy-coverage test that every route
registered on the Hono app is matched by an authenticating policy, a test that a path matching no
policy answers `401`, a test that the Access middleware is the first middleware, a contract test
over `infra/access.tf` (whole hostname, no bypass, `ADMIN_EMAIL` and not `everyone`), and a guard
that fails the build if the template enables `workers_dev` or `preview_urls`. Workers-runtime tests
(on `@cloudflare/vitest-plugin`) for authorization **outcomes**: no token is `401`, a token for the
wrong audience is `401`, a valid token for a non-admin identity is `403`, a valid admin token
succeeds, and a development token in a production-mode build is `401`. All integration projects have
a finite timeout.

**Local development, and what the checkpoint became (C16).** Workers AI has no local simulator, so
the `ai` binding is remote under `pnpm start`. The remote binding still returned Workers AI error
1050 from a developer machine, while direct REST calls with the same token worked, and the cause was
never found. **The accepted fallback is what shipped, and it stayed:** `pnpm start` runs the UI and
the Access emulation against a **clearly labelled fake model**, selected only under
`import.meta.env.DEV` and statically absent from a production build (a `production` test project
checks both facts). Every fake reply starts `[local development: no model was called]`. Real
inference runs only on a deployment, and the README says so. The article for Part 1 must not imply
`pnpm start` runs real inference. The fake grew in later parts: from Part 3 it follows a fixed rule
on the user's words (`time` calls `get_current_time`, `fetch_doc /kv/` calls `fetch_doc`,
`search_docs <query>` calls the MCP tool), so the tools can be tried offline. The spike's local REST
shim never shipped.

**Done when:** `pnpm check` and `pnpm test` pass, `pnpm start` works from a clean checkout, a
multi-turn conversation works, the inspector and usage bar update after every turn, an
unauthenticated request to `/` and `/api/me` is challenged at the edge on the deployed hostname, the
`workers.dev` hostname does not resolve to the Worker, a signed-in identity that is not
`ADMIN_EMAIL` receives `403` from the API, and `pnpm deploy` then `pnpm teardown` leaves the account
clean. All of this was met. Workers types were bumped to 5.20261019.1 in this part, because the peer
range of Wrangler 4.152.0 needs it.

### Part 2: The basic loop

Moves the conversation from the browser into an agent. A minimal agent on a Durable Object, built
with Flue. No tools yet. The server now owns the transcript, which is persisted in DO SQLite so it
survives a reload, a new device, and eviction. Tag: `coding-agent/part-2` (`9ee38ec`).

The article's job is the diff from `coding-agent/part-1`. In Flue the harness owns the loop, so the
article also makes the loop visible two ways: the context inspector, and a short standalone loop
(about 60 lines, in the post only, not in the repo) that calls Workers AI directly.

> **Changed from the earlier plan:** this used to say "builds the loop by hand". That doesn't fit a
> Flue-based demo, so the hand-built loop is a sidebar in the article. **Be honest in the article:**
> with no tools, the agent still makes one model call per answer. What changes in Part 2 is where
> the state lives and who owns the transcript. The loop itself only becomes visible in Part 3, when
> the model-calls counter goes above 1. The article should say that plainly and not oversell Part 2.

**What changes from Part 1** (this is the diff the reader sees):

- **Worker, removed:** `POST /api/chat`, the transcript validation (the server holds the transcript
  now, so there is nothing to validate), the Part 1 gateway call site as a separate module, and
  `main` in the Wrangler template (Flue supplies the Worker entry).
- **Worker, added:** the Flue agent router mounted under `/api/agent/assistant`. Flue's docs say
  anyone who can reach a conversation URL can talk to it, so the mount sits under `/api/`, behind
  the Access middleware and `requireAdmin`, and an authorization middleware ahead of it checks that
  the conversation id's owner prefix equals the caller's own. Conversation ids are
  `<ownerKey>.<ULID>`, where `ownerKey` is a prefix of a hash of the verified email, and are
  **issued by the server** (`POST /api/conversations`), never chosen by the client. A small
  application-owned Durable Object per owner, `ConversationIndex`, holds the conversation list and
  nothing else, because Flue has no API for listing conversations. Every route checks that the index
  has the id before it calls the agent, because an RPC to an id that does not exist creates an empty
  agent object. The agent module is a `'use agent'` file, `src/agents/assistant.ts`:

```ts
'use agent';
import { useModel } from '@flue/runtime';
import { MODEL } from '../shared/model.ts';

export function Assistant() {
  useModel(MODEL.flue); // same model as Part 1; Part 3 needs tool support
  return 'You are a helpful assistant. Keep replies short.';
}
Assistant.agentName = 'assistant'; // pin identity so renames don't orphan stored conversations
```

- **Config:** `wrangler.jsonc.tpl` gains the `ConversationIndex` binding and a uniquely tagged
  `new_sqlite_classes` migration. Flue generates a class per agent (`Assistant` becomes
  `FlueAssistantAgent`, binding `FLUE_ASSISTANT_AGENT`) and contributes its migration through
  `flueWorkerConfig()`, so the template does not list it. The Durable Object name equals the
  conversation id, so `env.FLUE_ASSISTANT_AGENT.getByName(id)` reaches the same object the agent
  runs in. The migration history is append-only. `vite.config.ts` becomes
  `[cloudflareAccessPlugin(…), vue(), flue(), cloudflare({ config: flueWorkerConfig() })]`.
- **Client:** the store stops sending history. It sends only the new message, and `@flue/sdk`'s
  `createFlueClient(...).observe()` replaces the local message list. Its `getSnapshot`/`subscribe`
  shape fits a Pinia store. (`@flue/react` doesn't apply to a Vue app.) A conversation list (create,
  select, rename, delete) appears, and a reload keeps the conversation. A 401 or 403 reaches the
  client's `error` phase after a few seconds of retries, and the UI shows it.
- **Inspector and usage:** the `ContextSource` swaps to a Flue-backed source. A single module-scope
  `observe()` subscriber catches Flue's `turn_request` event, which carries the full model-visible
  request, builds the compact segments with the same pure segment-building function, and writes one
  row per agent turn into the agent's **own** SQLite, keyed by turn id so a duplicate delivery is
  harmless. Only the newest agent turn keeps its segments, so the table does not grow without bound,
  and only `agent`-purpose turns are recorded (a compaction turn's request is a summarisation prompt
  the user did not write). Methods added with `extend({ base })`, `latestContext()` and
  `contextUsage()`, read it back over RPC (a third, `attachedRepository()`, arrives in Part 5).
  Exact token counts also ride on the conversation stream as `metadata.usage` through
  `useResponseFinish`. The components don't change.
- **Terraform:** unchanged, and that is the point. Durable Objects are declared in
  `wrangler.jsonc.tpl` in this family.
  `git diff coding-agent/part-1 coding-agent/part-2 -- flue-demos/coding-agent/infra` is empty,
  which the article should show, because "Terraform didn't change" is a point it wants to make.

**Gateway attribution.** **Changed from the earlier plan:** the plan said every model call is
attributed to the verified person in gateway metadata. Part 1 does this. Part 2 does not: its
gateway logs carry only Flue's session id, because the provider is registered once at module scope
(`registerModelProvider`, which wraps Flue's
`setProvider(cloudflareBindingProvider({ binding, gateway: { id } }))`), before any request exists,
and Flue has no per-request hook for gateway metadata. Cost is still attributed **to the gateway**,
and every call still goes through the named gateway and carries a cost, but not to a person. The
investigation (`specs/coding-agent/03-gateway-attribution.md`) found that the conversation id, and
with it the owner key, is available inside the agent's Durable Object at the moment of the call, and
recommends wrapping the binding to add `{ ownerKey, conversationId, part }` as metadata. That is
**not implemented** and is deferred. The article should say plainly that attribution to a person was
lost in Part 2, and not claim otherwise.

**Things the article must say plainly.**

- Reasoning blocks are replayed to the model, so they count toward context and appear in the
  inspector labelled `[reasoning]`.
- Redaction of the stored snapshot is by pattern only (secret-looking keys, `Bearer`, `sk-` and JWT
  values), so a secret that matches no pattern is stored.
- **Stored context is retained, not purged**: deleting a conversation removes only its index row, so
  the agent object, Flue's stored stream and the snapshot remain. Delete is never described as
  erasure. That is acceptable for one admin user.
- **A brand-new conversation looks empty to the client.** A conversation nobody has written to has
  no history, so `observe()` settles in an `absent` phase and **stops**. The first admitted message
  is what creates the agent, so the client restarts the observation after the first send
  (`observation.refresh()`). The browser run found that the first reply never appeared without this.
  It is a good example of a gap between an SDK's model of a conversation and an app's.

**Tests.** Delete the tests for the removed code. Add unit tests for identity-to-conversation
derivation and the ownership check (including a forged prefix and a different-case email), the
segment builder against a captured real `turn_request` fixture with secrets scrubbed, component
tests for the new store, a test that delivering the same turn id twice leaves one row, and
Workers-runtime tests that a caller can't read or write another user's conversation. Agent runs
happen in a Durable Object alarm after admission, so a test waits for settlement with a finite
timeout and stubs the model through Miniflare's `outboundService`, which answers the one outbound
model `fetch` with a canned server-sent-event stream. Do not test eviction with
`evictDurableObject`: it hangs once an agent has run. Check persistence across eviction manually
with a dev-server kill and restart, and say so. Import `defineTool` from `@flue/runtime/tool` and
not the `@flue/runtime` barrel in any module a test loads, because the barrel fails to load in the
plugin.

**Operator checks.** Done on the deployment. The 403 and 404 checks against a second user were **not
applicable**: only `ADMIN_EMAIL` can pass Access, so there is no second identity to try. The offline
integration suite covers both outcomes. After `pnpm teardown` the Worker, custom domain, Access
application and policy, AI Gateway and Durable Object namespace were gone, Terraform state was empty
and the hostname no longer resolved.

**Done when:** `pnpm check` and `pnpm test` pass, a multi-turn conversation survives a reload and
appears on a second browser, the inspector and usage bar still update after every turn, the agent
route is `401` for an unauthenticated request and for a wrong-audience token, the Terraform diff
from Part 1 is empty, and `pnpm deploy` then `pnpm teardown` leaves the account clean.

### Part 3: Giving the agent tools (with code)

The agent acts for the first time. This part teaches how to **build tools** and ships **two direct
tools**: the model asks for a tool call, the tool runs, and the result comes back on the next model
turn. Ends with the agent calling a tool and using the result. Tag: `coding-agent/part-3`
(`41f4316`).

Code: _Add basic tool-calling._

> **Changed from the earlier plan, twice.** This part used to introduce Code Mode as "the answer to
> 'this is slow with ten tools'". The first revision kept both modes in the tagged part, chosen per
> conversation. **That is gone too.** Code Mode was moved to Part 7, then dropped from the series
> (decision 2026-10-27), and Part 3 has no tool-mode choice, no `ToolMode`, no `worker_loaders`
> binding and no Workers Paid requirement for tools. It survives as a sidebar with the measurements
> (below) and a record in `specs/coding-agent/01-specification.md` §13.4. The only new direct
> dependency is `@valibot/to-json-schema` (for the Tools tab), which Flue already depends on at the
> same version.

**Direct tool calls.** Direct calls show the loop most clearly: a model turn, the tool calls it asks
for, then another model turn. The transcript for the part shows turn 1, tool call, turn 2, answer.

**Two tools** in `src/worker/tools/`, defined with `defineTool` and exported as one list built in
`src/worker/tools/definitions.ts`. `src/app.ts` builds the list over the platform clock and `fetch`
and registers it with `registerTools()`, and the agent mounts what is registered with `useTool`. The
agent file gains one loop and one sentence in the prompt.

- `get_current_time`: trivial, so the loop is easy to follow.
- `fetch_doc`: GETs a page from `developers.cloudflare.com` by **path**. The host is fixed in code
  and the model never picks it, because Flue's docs are explicit that the model's arguments are not
  an authorization boundary. The use case enforces an allowlist (re-checked on every redirect hop,
  because redirects are followed by hand, including scheme, host, port and credentials), a **16
  KiB** response cap (longer pages are cut and marked `truncated`), a **10 second** timeout (using
  the `signal` Flue passes to `run`), a text-only content-type check, and a refusal of non-2xx
  responses (the docs site answers a missing page with a markdown body). Failures throw, so the
  model sees the error.

```ts
export const fetchDoc = defineTool({
  name: 'fetch_doc',
  description:
    'Fetch one Cloudflare documentation page by path, such as /workers/, and return its text. The argument is a path, not a URL. Use when the user asks about a Cloudflare product.',
  input: v.object({ path: v.string() }),
  async run({ data, signal }) {
    // the use case validates the path, fixes the host, re-checks every redirect hop, and caps size
    return { output: await fetchDocPage(data.path, { signal }) };
  }
});
```

**A refusal must teach.** In the spike a model passed absolute URLs and `//host` forms to this tool
(Kimi K2.6, 3 of 10 chain runs). A pure `validatePath` accepts only a leading-slash path of letters,
digits and `._~-/%` up to 200 characters, rejects `//` prefixes, any `.` or `..` segment and a
percent-encoded `.` or `/` (`%2e`, `%2f`, which a URL parser decodes back into a dot segment), and
throws an error whose message names the rule, because the model reads it and recovers. A model that
ignores the description costs extra turns (2 to 7 in the spike) but never reaches another host. This
is a good place for the article to show why validation belongs in the domain tier and not in the
tool. **The operator check confirmed it on the deployment:** Kimi K2.6 was given a URL, was refused
with the rule named, and recovered.

**What the article may claim about the loop.** Both models emit independent tool calls **in parallel
in a single turn**, so "what time is it and what is on `/kv/`?" is **two** model calls, not three.
Do not claim "one model call per tool call". A dependent chain (read a page, then the page it links
to) does take one more turn per hop, and that is the loop the step counter shows.

**Flue's own `task` tool.** Flue 2.3.0 always offers the model a framework tool named `task`, for
handing work to a subagent. This agent declares no subagents, so the model has nowhere to send it,
but it is still sent on every call and costs tokens. The article should point at it in the Context
tab as a real example of a cost the author did not write. (In the Part 7 tag the Tools tab lists it
under a "Flue" group.)

**UI.**

- The message list renders `dynamic-tool` parts as cards in stream order: name, input, output or
  error, duration, and the state in words (`input-available` then `output-available`) as it streams.
- The response header shows a **step counter** (model turns per response, from the per-submission
  counts the usage route returns) so the loop is visible: turn 1, tool call, turn 2, answer.
- A Tools inspector tab lists each definition (name, description, JSON schema) with a token
  estimate. **Changed from the earlier plan:** in Part 3 this list is a fixed one served by
  `GET /api/tools`. By Part 7 the tab reads the tools from the latest model request instead (see
  Part 4), because most tools only exist once a repository is attached.
- The context bar gains `tool-definition`, `tool-call` and `tool-result` colours, which shows tool
  descriptions costing tokens on every turn.
- The Model calls counter is now the figure that moves.

**Sidebar: Code Mode, measured and not shipped.** `@cloudflare/codemode` (experimental, 0.5.5) lets
the model write one block of code that calls several tools, run in an isolated Dynamic Worker. The
spike prototyped it against these two tools and measured it across 80 conversations (four prompts,
five runs each, Kimi K2.6 and GLM 5.3 Flash). It mounted from Flue with each tool defined once (a
stateless adapter of about 260 lines over an `Executor` port) and kept the authorization on the host
side: generated code could not `fetch`, read `env`, or reach another host. But it did **not** reduce
model calls.

| Measure (mean per run)                             | Direct      | Code Mode (stateless)    |
| -------------------------------------------------- | ----------- | ------------------------ |
| One tool ("what time is it?"), turns               | 2           | 2                        |
| Three independent calls, turns                     | 2           | 2                        |
| Dependent chain, turns (Kimi / GLM)                | 3.0 / 3     | 3.6 / 3                  |
| Three-hop chain, turns (Kimi / GLM)                | 4.0 / 4     | 5.4 / 5                  |
| Three independent pages, input tokens (Kimi / GLM) | 4725 / 4929 | 2040 / 2230              |
| Tool definition tokens, ten tools                  | 821         | 1541 (runtime form: 484) |

125 model turns against 110 overall. Both models already emit independent tool calls in a single
turn, so there is nothing for Code Mode to batch. On dependent chains a script cannot know the
second path until the first call returns, so the model wrote one script per hop and added a turn.
**The article must not claim that Code Mode takes fewer model calls, cuts round trips, or is
faster.** The accurate claim is narrower: **Code Mode moves large intermediate results out of the
context window**. Page text never passes through the model, so input tokens fell by more than half
when three large pages were fetched. That is also why it was tempting for Part 7, where one MCP
search costs about 15 000 tokens.

**Why it is not in the series.** It was always an optional extra, and the part it was meant to help
cannot use it. A tool mounted by `useMcpConnection` is a Flue `ToolDefinition` whose `run()` throws
`[flue] MCP tools execute through the internal adapter.` The real call goes through a private,
non-exported adapter, so a Code Mode script cannot call the docs tool. The only route is a second,
host-side MCP client in the Worker, which would make `useMcpConnection` redundant, add a dependency
and a Worker Loader binding (Workers Paid), and leave the agent with two ways to reach one server.
That is true of `@flue/runtime` 2.3.0, and a later version that exposes MCP tools to scripts would
reopen it. The spike also found that a synchronous busy loop and a huge allocation hung or crashed
the **local** workerd despite the executor's timeout. The deployed limits were never tested (the
checkpoint, C20, was withdrawn), so the series claims nothing about them either way.

**Tests.** Unit tests for the allowlist (including redirects to other hosts), size cap, timeout and
content-type refusal. A `validatePath` table that rejects `//evil.example`,
`https://evil.example/x`, `/@evil.example/`, `/../etc/passwd`, `/a/./b`, the empty string, `kv/`,
`/a\b` and `/a b`, accepts `/kv/`, `/d1/get-started/` and `/workers/runtime-apis/bindings/`, and
checks that each refusal names the rule. A contract test that every tool has a unique name and a
description that says when to use it. The segment builder gains tool cases, and per-submission
model-call counts are tested. Workers-runtime tests: a stubbed model that requests a tool produces
two turns and a `dynamic-tool` part, and a tool that throws surfaces as an `output-error` part.
Client tests cover the cards, the Tools tab and the step counter.

**Operator checks.** Done on the deployment: `fetch_doc` answered a documentation question,
`get_current_time` worked, and a URL argument was refused and recovered from. **C5 is resolved:**
Kimi K2.6 calls tools reliably through Flue, so the model constant did not change. After teardown
the account was clean. No Terraform or Wrangler template change in this part.

### Part 4: Adding a sandbox (Containers)

Tools that run commands or touch files need isolation. Adds a sandbox (Cloudflare Containers) as the
place where the agent's commands run. Motivated by Part 3: once the agent can run code, it needs
somewhere safe to run it. Ends with the agent running a command in the sandbox and reading the
output. Tag: `coding-agent/part-4` (`42df87a`).

Code: _adds repository cloning into the sandbox, and an openable terminal (xterm.js) so the sandbox
can be used._

**Sandbox wiring.** The demo pins `@cloudflare/sandbox` at `1.0.3` and never 0.x. The 1.x package
has no `Sandbox` class and no `getSandbox()`. Its exports are `Files`, `S3Mount`, `DirectoryBackup`
and error types, so the Durable Object that starts the container is a class **this demo writes**
(`src/worker/infrastructure/sandbox-object.ts`, exported from `src/cloudflare.ts`). It drives the
container through `this.ctx.container` (`start()`, `exec()`, `setInactivityTimeout()`) and exposes
the seven typed RPC methods Flue's sandbox adapter expects (`exec`, `readFile`, `writeFile`,
`exists`, `mkdir`, `deleteFile`, `getState`). Flue's `cloudflareSandbox()` accepts that surface
structurally and does not import `@cloudflare/sandbox`, so the agent passes the namespace stub to
it. **This held on a deployment (checkpoints C6 and C7):** Flue's six tools work through the demo's
class, and `env` is readable inside the agent function. Facts the article should explain, all
confirmed by reading the packages and then by running it:

- `exec()` takes an argument array and starts no shell, so the RPC wraps Flue's command string as
  `timeout -k 5 <s> sh -c <command>`. Flue passes its timeout in **milliseconds**, which is rounded
  up to whole seconds, with a default of 300 and a cap of 1,800. `readFile` and `writeFile` must
  honour `{ encoding: 'base64' }`, which Flue uses for binary files.
- The base images include none of git, curl or tmux, so the `Dockerfile` installs them, and it
  copies a helper from the `cloudflare/sandbox` image whose tag **equals** the package version (a
  test pins this).
- The image must be **Debian-based** (GNU coreutils and findutils), not Alpine, because Flue's
  adapter runs `stat -c` and `find -printf`.
- The helper is a `linux/amd64` binary, so build for that platform on Apple silicon.
- A Durable Object-managed container takes `images` (not `image`) and has no `instance_type`: the
  size is an option of `container.start()`.

```ts
useSandbox(cloudflareSandbox(env.SANDBOX.getByName(sandboxName(id))), { cwd: '/workspace' });
```

`sandboxName` is a pure function: `sbx-` plus a lowercase base32 SHA-256 prefix of the owner key and
the conversation id. It is computed only after the ownership check, so it is never taken from a URL
parameter or a header. The container uses the Durable Object scheduling policy, which is **public
beta**, and the README and the article say so.

**Changed from the earlier plan: the sandbox is mounted only after a repository is attached
(checkpoint C8).** Flue reads `AGENTS.md`, skills and a directory listing when a sandbox is
attached, and that would have started the container on every message, including plain chat. So the
clone route sends a `repository.attached` signal with `dispatch()`, a `useAgentStart` hook stores
the repository path with `usePersistentState`, and from then on `useSandbox` is declared. Before
that the agent has only its Part 3 tools and is told to ask for a repository. The operator confirmed
that a plain chat message starts no container. A consequence the article should state: **the agent
answers that signal.** The first thing a person sees after a clone is a short "Got it, the
repository is ready" reply that they did not ask for. Part 5's section explains the bug that reply
later caused.

Mounting a sandbox gives the agent Flue's built-in `read`, `write`, `edit`, `bash`, `grep`, and
`glob` tools. This is the point where the demo turns into a coding agent. The Tools tab and context
bar show the jump from the two tools you wrote (three counting Flue's `task`) to eight (nine
counting `task`).

**Repository cloning.** A form (repository URL and optional branch) calls
`POST /api/conversations/:id/repository`. **Changed from the earlier plan: GitLab is accepted as
well as GitHub.** The domain layer validates the URL (public `https://github.com/<owner>/<repo>` or
`https://gitlab.com/<namespace>/<project>` only, with no credentials, userinfo, port, query,
percent-encoding or other host, and a branch that cannot be read as an option, such as one with a
leading `-`) and a repository port clones into `/workspace/<repo>`. There is no git helper in 1.x
(`gitCheckout()` was removed), so the sandbox runs
`git clone --filter=blob:none --depth 1 [--branch b] -- <url> <dir>` through `container.exec()` in
argument-array form, which means the URL never passes through a shell. Failures map to RFC 9457
problems: `422` (not found or private, missing branch), `409` (already cloned), `504` (timeout) or
`502`, and git's own output is never returned.

**Egress.** In 1.x a container has no Internet access unless it is started with
`enableInternet: true`. The demo leaves it `false` and allows named hosts only, through an outbound
`WorkerEntrypoint` (`SandboxOutbound`) that every HTTP and HTTPS request goes through. **Changed
from the earlier plan: the allowlist is three hosts, not one.** It is `github.com`, `gitlab.com` and
`registry.npmjs.org`, in one constant in a top-level `src/config.ts`. The npm registry is there
because the exit criterion runs a cloned repository's tests, which almost always needs an install
first. A blocked request answers `520`. **The operator confirmed both halves on the deployment
(C10):** `curl https://example.com` from the terminal prints `520`, and `git clone` from github.com
and `npm install` from the registry work. Parts 6 and 7 added no host. The article never claims a
limit that is not enforced, and this one is.

**Terminal.** An xterm.js component (with the fit addon, from npm and not a CDN) in a Terminal tab,
connected over WebSocket to the same container the agent uses, so a person can watch and take over
from the agent. The mechanism is Cloudflare's documented 1.x design: the sandbox object accepts the
socket and runs `tmux new-session -A` through `container.exec()` with a PTY, binary frames carry raw
terminal bytes, and a JSON text frame carries resize requests as a shared discriminated union
(`TerminalControl`). The shell lives in a tmux session inside the container, so it survives a reload
or a dropped connection, and two tabs on the same session see one screen. **Confirmed on the
deployment (C9):** reload reattaches the same session, a second tab shows the same screen, and
resizing changes `stty size`. The agent's `bash` tool runs separate processes in the same container,
so a person and the agent share the **filesystem**, not a shell, and the article says so. The
operator also checked that an edit the agent made was visible with `cat` in the terminal.

**A documented exception to the repo's WebSocket rule.** The repo says to accept a socket with
`ctx.acceptWebSocket()` (the Hibernation API). This terminal uses `server.accept()` instead,
following Cloudflare's design, because hibernation would discard the tmux client's process handle.
The exception is recorded in the demo README and in `flue-demos/AGENTS.md` (which is why that file
changed in this part). It is acceptable because the shell's real state is in tmux, the object is
held in memory only while a terminal is open, and the inactivity timeout releases the container
afterwards. Every **other** WebSocket rule still applies:

- The route is `GET /api/conversations/:id/terminal`, a Hono handler behind the same Access
  middleware and admin check as every API route, with `redirect: false` so a browser WebSocket gets
  an auth error and not an unexplained redirect failure. A non-upgrade request gets `426` through
  `upgradeRequired()`.
- The upgrade request is forwarded to the object with `stub.fetch(request)`. It is not replaced by
  RPC, because a `WebSocket` cannot be serialized.
- One named function deletes any inbound identity header (case-insensitively) and then sets the
  verified value. A comment says why the object may trust it: it has no route of its own, so it is
  reachable only through a Worker that authenticated the caller.
- The wire protocol has no identity field, and the domain rejects a payload that adds one. A
  listener that throws closes the socket and leaves the tmux client running, so malformed control
  messages are ignored and never thrown. The tmux session name is validated
  (`^[a-z0-9][a-z0-9-]{0,62}$`, because tmux names may not contain `.` or `:`).
- Test that a smuggled identity header is ignored (including a differently-cased spelling).
- Anyone who reaches the terminal route gets a **root shell**. The route is admin-only, and the
  README says so.

**No public surface.** The demo must never use the Sandbox SDK's port-exposure or preview-URL
features: each creates a publicly routable hostname outside the Access application. A guard test
fails the build if source calls them. The terminal is the only way into the container.

**Teardown, and what C17 turned out to be.** The container application and its registry image are
created by `wrangler deploy` and are invisible to Terraform. `teardown:containers` runs
`destroy-containers` before the Worker is deleted and before `terraform destroy`. **The result was
two-part, and the article should say both.** `destroy-containers` did find and delete a container
application that uses the Durable Object scheduling policy, so the original checkpoint's worry (that
it would not be found) did not happen. But it reported deleting the image tag and the tag was
**still in the registry** more than 20 seconds later, so a person had to run
`cf containers images delete <image>:<tag> --force`. That manual step was in the README for Parts 4
and 5. Part 6 replaced it with `teardown:images` (see Part 6). Deploying needs Docker available
locally to build the image. **The first deploy of this part failed on a registry timeout while
pushing one image layer, after Terraform had already applied.** Re-running `pnpm deploy` succeeded,
because deploy is idempotent. The article can use that as the reason deploy must be safe to re-run.

**Tests.** Unit tests for URL and branch validation (hostile inputs: other hosts, userinfo, ports,
encoded slashes, `file:`, whitespace, a leading `-`), sandbox-name derivation, the identity-header
scrub, the terminal control validator, tmux session names, and the `exec` and clone argument
construction. Service and route tests against fakes. A pin test that the `sandbox-shim` image tag
equals the package version, and the no-port-exposure guard. Workers-runtime tests that the terminal
route rejects a non-upgrade request (`426`) and an unauthenticated one (`401`), that a smuggled
identity header is ignored, and that the repository route answers `403`, `404` and `422`. The
container is stubbed behind its port, so normal tests never start one. A real container run, a
clone, an agent `bash` call, a terminal round trip, and `curl https://example.com` answering `520`
are documented manual checks, and the operator confirmed them.

### Part 5: Adding memory

Covers two kinds of memory:

- **Short-term memory** within a session is automatic. The transcript in the Durable Object already
  provides it (Part 2). No extra work.
- **Long-term memory** shared between agent sessions is worth having. This part builds it so the
  agent keeps what it learns about a repository, and the next conversation on the same repository
  can use it without exploring again.

Tag: `coding-agent/part-5` (`14ee3f2`). **Changed from the earlier plan: the part is no longer
optional, and it does not use Agent Memory.** The original plan built it on the Agent Memory binding
with a null adapter, because Agent Memory is in private beta. Readers of the article cannot rely on
access to a private beta, and "optional" meant the part could ship as an empty seam. So the decision
(2026-10-27) was to build it on a **SQLite-backed Durable Object** with FTS5 keyword search. That
needs no new Terraform resource, no second Wrangler template, no separate namespace lifecycle,
deploys and tears down with the Worker, and is the same one-object-per-entity pattern the series
already uses. The article should still name Agent Memory as the managed option and say why the demo
does not use it. The null adapter, the `RepositoryMemory` port with two adapters, the optional
binding, the second template variant and checkpoints C11 and C12 as originally written are all gone.
C11 and C12 now mean something else and are both resolved (below).

Code: _A per-repository memory object, two memory tools, a Learn action and a Memory tab._

**The trade-offs the article states.** KV cannot search and is eventually consistent. D1 would need
a shared database with owner columns. Vectorize gives semantic recall but adds an embedding model
and tuning. A Durable Object gives strong consistency per entity and SQLite's FTS5 for free.
**Recall is keyword search, and the article says what that costs:** it finds the words a fact
contains, not its meaning. A question worded differently from the saved fact can miss it. The
operator check recorded this limit.

**Scope and authorization.** One memory per **owner and repository**. The repository slug is derived
**server-side** from the cloned repository's canonical URL (`host/path`, lower case). The Durable
Object name is `mem-` plus the base32 SHA-256 of the owner key and the slug, derived after the
ownership check, the same way the sandbox name is (a shared `hashedName` helper backs both). The
model never chooses the scope, only the text. The branch is not part of the scope.
`RepositoryMemory` is a Durable Object with no route of its own, in `src/cloudflare.ts`.

**The object.** One table, `memory (id, kind, text, key UNIQUE, created_at)`, and an FTS5 table over
`text` with the `porter unicode61` tokenizer, ranked with `bm25`. `key` is the whitespace-collapsed,
lower-cased text, so saving the same fact twice is a no-op, which matters because tools can be
retried. A repository holds at most **200** entries and each is at most **500** characters, and a
full memory refuses the write with a message telling the model to ask the person to delete entries.
Entry kinds are `command` (install, build, test, lint), `layout`, `convention` and `note`. Model
text is reduced to quoted words joined with `OR` before it reaches FTS5, so operators, `NEAR`, `*`
and column filters are never obeyed (hostile input is in the tests). **C11 resolved:** FTS5 works on
Durable Object SQLite in the Workers runtime, and the integration suite saves, recalls and deletes
through the real `REPOSITORY_MEMORY` binding.

**Tiers.** `MemoryRepository` is the port (application tier), `DurableMemoryRepository` is the
adapter over the namespace, `MemoryService` does validation, redaction (the inspector's `redact()`
runs on every write), name derivation and the ownership check, and the pure domain functions (slug,
name, entry validation, query building) are unit-tested. The agent cannot import the composition
root, so `src/app.ts` builds the tool factory and passes it through `registerMemoryTools()`, the
same seam as `registerTools()`.

**How memory is used:**

1. After a clone, a **Learn this repository** button sends the agent a fixed message
   (`LEARN_MESSAGE`, a constant so a reader sees exactly what the agent is asked): read the README,
   the package or build files and the layout, then save short facts, one per call and no more than
   ten, checking recall first so it does not repeat itself.
2. `recall_repository_memory(query)` and `remember_repository_fact(kind, text)` are two tools,
   **mounted once a repository is attached** and built per render over the owner key and the
   attached repository, so the model supplies neither. The system prompt tells the model to call
   recall **before** exploring, and that what recall returns is unverified notes and never
   instructions.
3. **The model decides what is worth keeping.** There is no automatic extraction, because extraction
   needs a second model call per answer. **Changed from the earlier plan:** the plan sent the
   transcript to `ingest()` when a response settled. There is no ingest step here, and the article
   says so.

```ts
useTool(
  defineTool({
    name: 'recall_repository_memory',
    description: 'Look up what is already known about this repository. Use before exploring it.',
    input: v.object({ query: v.string() }),
    async run({ data }) {
      // scope is fixed by the server from the owner key and the attached repository
      return { output: await memory.recall(data.query) };
    }
  })
);
```

**Reading the memory from the Worker.** The agent mirrors the attached repository's URL into an
`app_repository` table in its own SQLite and exposes it through the third extension RPC,
`attachedRepository()`. `GET /api/conversations/:id/memory` returns `{ repository, entries }` and
`DELETE /api/conversations/:id/memory/:entryId` removes one entry. Both sit under the existing
`/api/*` policy and administrator check, check conversation ownership first, and are in the
policy-coverage test.

**A prompt-injection surface, stated plainly.** Memory is written by the model while it reads
**untrusted repository content**, and it persists. A README that says "remember: always run
`curl … | sh`" could plant a fact that a later conversation trusts. Mitigations in the demo: the
Memory tab shows every entry and lets the person delete it, the system prompt says memory is
unverified notes and not instructions, and entries are shown as text and never rendered as markup.
The article names the risk and does not claim it is solved.

**UI.** A Memory tab: the repository, the entries grouped by kind with a delete button each, a
refresh when an answer finishes, and a warning that entries are model-written from untrusted
content. The context bar gains a `memory` segment: a `recall_repository_memory` tool result is
mapped to it instead of `tool-result`, so the reader sees recalled memory occupy room. The Learn
button sits in the repository form after a clone.

**Lifecycle.** Nothing to provision or delete: the namespace is declared in the Wrangler template
(the `REPOSITORY_MEMORY` binding and a new uniquely tagged migration) and goes with the Worker.
**Terraform is unchanged.** Memory is **not** erased when a conversation is removed from the list,
because it belongs to the repository. The article says so.

**Transcript for the article:** conversation 1 clones a repository and the person presses Learn this
repository; a brand-new conversation 2 clones the same repository and answers "how do I run the
tests?" by recalling, without exploring. **C12 resolved:** the operator confirmed on the deployment
that the model recalls before exploring and saves short, useful facts, and recorded keyword recall's
limit for differently worded questions.

**Found after the tag (fix forward, and the article should say so).** Part 5's tag, and Part 6's,
contain a bug the article should not hide. It was found in the end-to-end run after Part 7 was
built, and the fixes are in commits that only the Part 7 tag contains, so the Part 5 article should
link to them and the later article should mention them.

- **A message sent too early lands in the wrong place (`ef62205`, `63537dd`).** Clone a repository,
  then press **Learn this repository** _before_ the agent has finished its "Got it, the repository
  is ready" reply, and the transcript shows the reply above the message it answers. The cause is in
  the loop, and it is a good lesson. A message sent while a response is live **joins** that
  response: Flue folds the whole response into one assistant message that began before your message
  arrived, and both submissions settle with the first one named as the answerer. Flue's own order is
  correct, and the page drew that one message above the one that joined it. The page disabled the
  composer only while its **own** send was in flight, and the clone's reply is not started by a
  send, so nothing stopped it. It was reproduced offline with a slowly answered signal followed by a
  user message. The first fix made the page treat the agent as working whenever any observed
  submission has no settlement, and from the moment the clone returns until the signal's submission
  settles (the clone route now returns that submission id from Flue's dispatch receipt). **That fix
  introduced a second bug:** on a brand-new conversation the observation had settled `absent` and
  stopped, so the page never saw the signal's answer and stayed locked until a reload. The second
  fix restarts the observation after a clone, asks again every second while it reads `absent`, and
  ends the wait by itself after 45 seconds so nothing can lock the composer. A second browser tab
  can still send while another tab's answer streams, and that message can still join, which is
  Flue's documented behaviour for a busy agent. Full write-up:
  `specs/coding-agent/04-part-5-open-issues.md`. **A smaller bug that was fixed inside this part
  (`a402311`, so it is in the Part 5 tag).** On a first visit, or after removing the last
  conversation, the page showed no title, rename, remove or repository form, because they only
  render for an open conversation. The store now creates a conversation whenever the list is empty
  and none is open.

A wrinkle for the commit history: `a402311` added temporary browser and Worker diagnostics to
capture the ordering problem, and `14ee3f2` removed them so the tagged reference code is clean. They
remain in `a402311` if anyone wants them.

**Tests.** Unit: slug and name derivation, entry validation at the limits, FTS query building
(quotes, operators, `NEAR`, `*`, empty), the SQL store against Node's SQLite with FTS5 (idempotent
save, cap, ranking, stemming, delete), and redaction on write. Application: the service against an
in-memory fake (ownership before storage, scope derived from owner and URL, another owner's memory
is a different object). Routes: `401`, `403`, `404` and `422`, and delete of a missing entry.
Client: the Memory tab, the Learn button and the segment style. Workers runtime: save, recall and
delete through the real binding.

### Part 6: Adding skills

Skills are small, modular instructions that load only when needed. Adds a skills directory the agent
can read on demand, and shows the difference between a skill (loaded instructions) and a tool (an
action). Ends with the agent following a project-specific skill, such as the repository's testing
conventions. Tag: `coding-agent/part-6` (`617ab53`).

Code: _One bundled skill, a repository's own skills, and skills installed from the terminal._

> **Changed from the earlier plan:** this part used to be "mostly UI and no new agent plumbing".
> Reading `@flue/runtime` 2.3.0 showed that was wrong. It needs one agent change, and that change
> has consequences the article must explain (the sandbox `cwd`, below). Flue supports **two** kinds
> of skill (declared and workspace), and the article shows **three ways to get one**. A skill
> installed from the terminal is indistinguishable from a repository skill once it is there, so it
> is not a third kind, and the UI shows two badges.

1. **Bundled skill.** One skill shipped with the app, `src/skills/conventional-commits/SKILL.md`,
   imported and mounted: `import commits from '../skills/conventional-commits/SKILL.md'` and
   `useSkill(commits)`. Flue validates the frontmatter at build time (the `name` must equal its
   directory name) and packages the directory into the bundle. Supporting files are served read-only
   and never copied into the sandbox. It is mounted on every render, with or without a repository.
2. **Repository (workspace) skills.** Flue scans `<cwd>/.agents/skills/<name>/SKILL.md` in the
   sandbox, so a cloned repository's own skills join the catalog with no code. A malformed workspace
   `SKILL.md` is skipped with a warning. This is the "project-specific skill" case, and the operator
   checked it against `cloudflare/vinext`.
3. **Installed skills.** The skills CLI, run in the Part 4 terminal inside the repository, installs
   into the same `.agents/skills/`. **Changed from the earlier plan:** the source is
   `cloudflare/skills` (decision 2026-10-27), the CLI is pinned, and telemetry is off:

```sh
cd /workspace/<repository>
DISABLE_TELEMETRY=1 npx -y skills@1.7.4 add https://github.com/cloudflare/skills \
  --skill wrangler -a universal --copy -y
```

**No egress host was added (C13, resolved).** The original plan said the container has no general
Internet access, so the installer would fail until its hosts were added to the allowlist by name,
and to add only those. **That did not happen.** The CLI is fetched from `registry.npmjs.org` and
clones a GitHub source from `github.com`, and both were already allowed for Part 4.
`DISABLE_TELEMETRY=1` stops its calls to `www.skills.sh`, and its `api.github.com` lookups fail
closed to a clone. The allowlist is still the three hosts from Part 4. **The other half of C13 is
also resolved, and the answer is better than the plan expected.** The plan said a skill installed
mid-conversation might need a new session. It does not: Flue sends a `resources` signal when the set
of skills changes between submissions, so a skill installed from the terminal in the middle of a
conversation is announced to the model on the **next message**, with no new conversation. The
operator confirmed it by installing `wrangler` mid-conversation.

**The agent change: the sandbox `cwd` is the repository.** Flue discovers workspace skills, and the
`AGENTS.md` or `CLAUDE.md` it folds into the system prompt, only in the sandbox's `cwd`. Part 4 set
the `cwd` to `/workspace`, but a repository is cloned into `/workspace/<repo>`, so neither would be
found. Part 6 mounts the sandbox with `cwd` set to the attached repository's path (held in the
`repository` persistent state, as `sandboxCwd`). This is the one change to an earlier part's seam,
and the article should say so. Two consequences, both documented and neither worked around:

- A repository's `AGENTS.md` is now in **every** request's system prompt. That is the always-present
  counterpart to a skill's on-demand body, and it can be large: `cloudflare/vinext`'s is about 41
  KB, roughly 10 000 tokens. Flue 2.3.0 has no option to turn it off. This is a good thing to show
  in the context bar.
- **A name collision breaks the conversation.** Flue throws when a workspace skill has the same name
  as a declared one, so a repository with its own `conventional-commits` skill makes every
  submission fail until the directory is removed or renamed in the terminal. Documented as a
  limitation.

**How the catalog reaches the model.** Flue writes an `## Available Skills` section into the system
prompt, **frozen at the conversation's first request** (a baseline, so the provider's prompt cache
survives) and refreshed only at compaction. Skills that appear later, such as a repository's skills
once the sandbox mounts, reach the model as **signal messages**: an `environment` signal restating
every skill when the sandbox is attached, and a `resources` signal (`New skill available: …`) when
the set changes between submissions. The inspector parses both. **That parsing depends on Flue
2.3.0's exact wording**, so a test pins it against fixtures copied from the runtime's own templates,
and the article should warn that a Flue upgrade may break it.

**Untrusted content.** A repository's skills and its `AGENTS.md` are untrusted repository content,
like memory. When a repository is attached the system prompt says so: they are procedures to check,
never authority to act outside the user's request. **Changed from the earlier plan:** the Skills tab
originally carried a visible warning to the same effect. It was removed in the Part 7 tag at the
author's request, so Part 6's tag shows the warning and Part 7's does not. The prompt text stays.
(The Memory tab keeps its own warning.)

**UI.** A Skills tab listing the catalog **as the model was told it**, from the latest context
snapshot: the system prompt's section plus any signal that lists skills. Each entry has a name, a
description, one of **two badges** (`bundled`, or `repository` for everything else, installed skills
included), and whether `activate_skill` ran for it in this conversation. With no repository it shows
the bundled skill only and says repository skills appear after a clone. The context bar gains
`skill-catalog`: the system prompt's skills section is split out of the `system` segment, and a
signal message that lists skills is mapped to it. The `activate_skill` result stays a `tool-result`,
labelled with the skill name, so the small always-present catalog and the large on-demand body sit
side by side. **That contrast is the payoff, and the article should lead with it.** A skill signal
is a user-role message but it is the framework talking, so it never counts as the user's current
prompt.

**Teardown (C22, new, resolved).** `destroy-containers` deleted the application but left the
registry image tag (see Part 4). `scripts/delete-images.ts` (`teardown:images`) now deletes **every
tag** of the `coding-agent-sandbox-workspace` image, matching the name exactly and never a prefix,
treating only "already gone" as success. It runs after `destroy-containers` and before the Worker is
deleted. The operator ran a full deploy and teardown with no manual step and the account was clean,
with one thing to know: the hostname answers `403` (error 1050) for about a minute from cached edge
routing, then stops resolving.

**A build quirk worth a sidebar.** Flue's markdown-import plugin parses **any script that contains
`.md`** as JavaScript, which breaks a Vue `<script setup lang="ts">`, because the compiled
component's type annotations are not JavaScript. The build fails with an error that does not mention
the cause. A `.ts` module is parsed as TypeScript, so the fix is to keep `.md` out of every `.vue`
file, and a test enforces it.

**Tests.** A contract test that every bundled `SKILL.md` has a valid name and a description that
says when to use it ("Use when…"), since the description carries the whole routing decision. Segment
tests: the skills section split from a captured system prompt, `environment` and `resources`
signals, a prompt with no skills section, and the `activate_skill` label. Skills tab: catalog,
badges, activation marker, empty state. Agent: the sandbox `cwd` follows the repository path. The
teardown script: deletes each tag, tolerates absent tags, fails on anything else. Workers runtime:
the bundled skill appears in the snapshot's catalog segment. At the tag, `pnpm test` ran 47 files
and 610 tests.

### Part 7: Adding MCP

Connects the agent to an MCP server for an external capability. Covers which MCP servers to trust,
how tool results from MCP flow into the loop, and how this connects to the authentication questions
in the agent authentication article. Ends with the finished agentic coding environment: an agent
that can read and change a repository with tools, a sandbox, memory, skills, and an external
service. Tag: `coding-agent/part-7` (`15bc50e`).

Code: _One `useMcpConnection` to the public Cloudflare documentation MCP server._

> **Changed from the earlier plan, twice.** First, this part used to connect through an MCP Server
> Portal. It no longer does: a portal is protected by Cloudflare Access, and a Worker cannot present
> an Access service token to it, so a portal cannot be used non-interactively from this demo. The
> article says that plainly and presents the portal as the production step for authenticated and
> multi-server setups. Second, Code Mode was moved here in the second revision as a way to improve
> MCP access, and then dropped (see Part 3): a Code Mode script cannot call a hook-mounted MCP tool.
> **This part is therefore small: one hook, one tab, one segment kind, and no new dependency,
> binding or infrastructure.**

**Connection.** One `useMcpConnection` pointing directly at the public Cloudflare docs MCP server,
which is Streamable HTTP (protocol `2025-06-18`), needs no authentication and no session id, and
matches the advice in the agentic setup post to give the agent the documentation. The URL is a
constant in `src/config.ts`. It exposes two tools, `search_cloudflare_documentation` and
`migrate_pages_to_workers_guide`, and only the first is allowlisted:

```ts
useMcpConnection({
  name: 'cfdocs',
  url: DOCS_MCP_URL, // https://docs.mcp.cloudflare.com/mcp
  tools: ['search_cloudflare_documentation'], // allowlist: exactly one tool
  optional: true // run without it if the server is unreachable
});
```

Flue mounts it as `mcp__cfdocs__search_cloudflare_documentation`. **C14 resolved, C23's first half
resolved:** an allowlist that names a tool the server does not expose fails the connection with a
message listing the tools it does expose (verified), and the connection **works from a deployed
Worker**: the operator saw the tool called, the MCP tab show **connected**, and the Context tab show
the definition and a large result. The `tools` allowlist matters twice: it limits context cost, and
it limits what a compromised or malicious server can put in front of the model.

**Infrastructure.** None. There is no Terraform resource, no output, no Wrangler binding, no secret
and no hostname. The connection is outbound from the Worker (the agent object, not the container, so
the sandbox's egress rules do not apply), and it adds no web-accessible property, so the Access
requirement is untouched. **This is a point the article can make and it held:**
`git diff coding-agent/part-6 coding-agent/part-7 -- flue-demos/coding-agent/infra flue-demos/coding-agent/wrangler.jsonc.tpl`
is empty. `package.json` is unchanged too, because `@modelcontextprotocol/client` is Flue's own
dependency. So
`git diff coding-agent/part-6 coding-agent/part-7 -- flue-demos/coding-agent/package.json` is empty
as well. (Part 6's `package.json` change is the new `teardown:images` script.)

**The lesson this part shows: what an MCP tool costs is set by its results, not its definition.**
One search returns about 20 chunks, about 36 KB. Flue 2.3.0 formats **both** the structured content
and the content text into the tool result, so the model receives about 74 KB, which is **about 14
500 to 18 000 tokens per search** (three queries measured with `gpt-tokenizer`). The tool takes no
limit parameter and Flue has no per-tool result cap, and the whole result stays in the conversation,
so it is **replayed on every later turn until compaction**. Titles and URLs alone would be 300 to
400 tokens. The demo does not trim it. The context bar shows the cost as it happens (an `mcp__`
result is a large `tool-result` segment). That figure is an estimate from before the build and the
README carries no number (see Conventions), so **measure it again on the deployment before quoting
it in the article.** It is also the honest motivation for Code Mode, which is why that sidebar sits
in Part 3.

**Prompt injection, practically.** A server's descriptions enter the prompt and its results enter
the conversation, so a server you do not control is a third-party dependency, and its results are
untrusted content, like memory and repository skills. The system prompt says so (results are
reference material, not instructions). The demo **pins a hash of the mounted tool's definition** in
code (`MCP_DEFINITION_PIN`, the first 16 hex characters of a `sha256` of the description, a newline,
and the JSON of the parameters, recorded from a real request). A mismatch logs one structured
warning from the Worker (the conversation id and both hashes, never the text, which is third-party
content) and shows an alert in the MCP tab. **The agent does not fail closed.** A changed
description is a signal to review, not a reason to stop answering. The operator saw the tab say the
definition matches the pinned hash.

**Two docs tools.** Part 3's `fetch_doc` (one page of `developers.cloudflare.com` by path) stays.
The MCP tool searches and returns semantically similar chunks, and `fetch_doc` reads a whole page.
The system prompt says to search first and read a page only when a chunk is not enough. **Whether
the model chooses sensibly between them is the open half of C23.** The README describes the
difference and does not hide the overlap, and the article should do the same and report what the
transcript showed.

**When it is unreachable.** With `optional: true` Flue runs the submission without the tool and
appends a `resources` signal saying the server is unavailable and its tools are not mounted, once
per session. The next submission retries. The agent still answers. The offline suite covers this,
because the real server cannot be made unreachable on demand.

**Auth, stated plainly.** This demo's MCP server needs no authentication, so nothing is implemented.
Where a server does need it (a portal, an issue tracker), the credential would be the "agent acts as
itself" quadrant of the agent authentication article, not per-user delegation, and token exchange is
the next step. Flue never stores tokens (the `auth` function is the seam). The article says that and
stops.

**UI.** An MCP tab reads the latest context snapshot, as the Skills tab does, **because the Worker
cannot query a connection the runtime owns.** It shows the connection (name and URL), its status,
the tool the allowlist mounts, the tool it hides (`migrate_pages_to_workers_guide`, a fixed fact
recorded in code, because the Worker never lists the server's tools), the definition's token cost
and the pin result. **Status is inferred, and the tab says so:** _connected_ when the snapshot's
tool list holds the `mcp__` tool, _unavailable_ when the model was sent the unavailable signal, and
_not yet known_ before the first answer. The context bar gains `mcp-definition`: the `mcp__` tool's
definition and the unavailable signal map to it (the signal is labelled "MCP unavailable" and, like
a skill signal, never counts as the user's prompt). The `mcp__` result stays a `tool-result`
labelled with the tool name, so the large result is visible. The tool description from the server is
visible in the inspector, which makes the prompt-injection surface visible as well.

**The inspector polish that came with this tag (a short sidebar for the wrap-up article).** After
Part 7 was working, the author reviewed the inspector and changed five things in `15bc50e`, all in
the Part 7 tag: the legend calls a tool definition "Tool definition" and each tool block in the list
is titled with its tool (`Tool definition - fetch_doc`, `Tool call - bash`, `Tool result - bash`);
**the Tools tab now reads the tools from the latest model request**, so the sandbox, memory, skill
and MCP tools appear grouped by where they come from (Application, Sandbox, Repository memory,
Skills, MCP server, Flue) and, before the first request, it shows the application's own tools and
says the rest follow; Terminal moved to the last tab; and the unvetted-content call-out came off the
Skills tab. The Tools tab change corrects an earlier claim: the Part 3 list is fixed, but the real
list depends on the conversation.

**Tests.** Unit: the definition pin (match, mismatch, whitespace is not normalised), the `mcp__` and
unavailable-signal segment mapping including the signal not becoming the current prompt, and the
tab's status inference. Client: the MCP tab in each state and the pin warning. Workers runtime,
offline: **the integration project's `outboundService` serves a minimal MCP server (`initialize`,
`tools/list`, `tools/call`) for `docs.mcp.cloudflare.com` and refuses every other host**, so a test
can never reach the network. By default the server is unreachable. Three tests cover it: the tool
mounts and a call returns a large result, the server being down (the Worker still answers, the
snapshot holds no `mcp__` tool, and the model was sent the unavailable signal), and a refused host.
At the tag, `pnpm test` ran 50 files and 652 tests.

**Series wrap-up checklist:** clone a repo, ask a question that needs docs (MCP), recall repo facts
(memory), follow a repo skill (skills), run the tests in the sandbox (tools), and let the user take
over in the terminal. The operator ran this end to end on `jonschlinkert/is-number`, combining
memory, MCP, sandbox and skills in one prompt, then took over in the terminal. The end-to-end run
found the two Part 5 ordering bugs (above) and the polish items, and the tag was cut once it was
clean.

## What changed from the earlier plan

Every change in one place, so the revision can be reviewed quickly. The part sections above say the
same thing in context.

| #   | Area                             | Earlier plan                                                                  | What shipped                                                                                                                                                                                                       |
| --- | -------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Code Mode (Part 3)               | A second tool mode in Part 3, chosen per conversation; later moved to Part 7. | Not in the series. A sidebar in Part 3 with the numbers. It cannot call a hook-mounted MCP tool, and it did not reduce model calls (125 turns against 110).                                                        |
| 2   | Agent Memory (Part 5)            | Agent Memory binding, null adapter, optional part, `ingest()` on settle.      | A SQLite Durable Object with FTS5 keyword recall. Not optional, no ingest step, no extra template variant, no Terraform. The model decides what to save.                                                           |
| 3   | MCP portal (Part 7)              | Connect through an MCP Server Portal.                                         | Connect directly to the public docs MCP server. A portal needs an Access credential a Worker cannot present.                                                                                                       |
| 4   | Sandbox mounting (Part 4)        | Mount the sandbox on every message.                                           | Mount only after a `repository.attached` signal, so plain chat starts no container. The agent answers that signal, which is visible to the user.                                                                   |
| 5   | Egress allowlist (Parts 4 and 6) | `github.com` only; add skills hosts by name in Part 6.                        | `github.com`, `gitlab.com` and `registry.npmjs.org`, in `src/config.ts`. Part 6 added nothing.                                                                                                                     |
| 6   | Clone hosts (Part 4)             | GitHub.                                                                       | GitHub and GitLab.                                                                                                                                                                                                 |
| 7   | Skills agent change (Part 6)     | "Mostly UI, no new agent plumbing."                                           | The sandbox `cwd` becomes the clone, so `AGENTS.md` joins every system prompt and a name collision breaks the conversation.                                                                                        |
| 8   | Skills install (Part 6)          | A mid-conversation install may need a new session.                            | It does not: Flue announces it on the next message. The source is `cloudflare/skills`, `skills@1.7.4`, telemetry off.                                                                                              |
| 9   | Skills badges (Part 6)           | `bundled` and `workspace`.                                                    | `bundled` and `repository`.                                                                                                                                                                                        |
| 10  | Teardown                         | `destroy-containers` then Worker then Terraform.                              | Adds `teardown:images` after `destroy-containers`, because the registry image tag survives it.                                                                                                                     |
| 11  | Gateway attribution              | Every call attributed to the verified identity.                               | True in Part 1 only. From Part 2 calls are attributed to the gateway, not a person. A fix is designed and deferred.                                                                                                |
| 12  | Context extension (Part 2)       | Two RPC methods.                                                              | Three: `attachedRepository()` joined in Part 5.                                                                                                                                                                    |
| 13  | Tools tab                        | A fixed list of the defined tools (Part 3).                                   | Reads the tools from the latest model request, grouped by origin, so sandbox, memory, skill, MCP and Flue's `task` tools show.                                                                                     |
| 14  | Inspector                        | Terminal added in Part 4's position.                                          | Terminal is always the last tab. The Skills call-out was removed. Tool blocks are titled with the tool name.                                                                                                       |
| 15  | Fix-forward bugs                 | None expected.                                                                | Two post-tag fixes (a message joining a live response, and the page locking on a new conversation), only in the Part 7 tag. A third, no controls on first load, was fixed inside Part 5. The articles must say so. |
| 16  | Local inference (C16)            | Re-test in Part 1.                                                            | Still fails with error 1050. The labelled fake is the shipped behaviour, and it grew a tool rule in Part 3.                                                                                                        |
| 17  | README policy                    | Not stated.                                                                   | The README holds only what the project does, the parts and tags, prerequisites, commands and how to run, deploy, tear down and test. Limits, history and figures live in the articles and the specs.               |
| 18  | Deploy                           | Not stated.                                                                   | Docker is a local prerequisite from Part 4. Deploy must be safe to re-run: the first Part 4 deploy failed on a registry timeout after Terraform applied.                                                           |

## Later (not in this series)

- PiHarness: running Pi Durable as the loop instead of building it.
- OpenCodeHarness: running OpenCode 2.0 inside a Durable Object, as a coda or a separate series.
- **Code Mode, if Flue exposes MCP tools to scripts.** The blocker is Flue 2.3.0's private MCP
  adapter. A later Flue that lets a script call a hook-mounted MCP tool would reopen it, and one MCP
  search at about 15 000 tokens is a real case for it.
- **Per-person gateway attribution.** Wrap the model binding to add
  `{ ownerKey, conversationId, part }` as gateway metadata (Option 1 in
  `specs/coding-agent/03-gateway-attribution.md`). It is unverified that `run()` executes inside
  Flue's Durable Object context, so confirm that on a deployment first.
- Agent Memory as an alternative adapter, if it leaves private beta, and semantic recall through
  Vectorize.
- A trimmed or capped MCP result, if the cost of a search is the thing readers most want fixed.

## Open questions

- **C23, second half: does the model choose between the MCP search and `fetch_doc` sensibly?** The
  Worker connects and the tool is called (confirmed). The operator's result for "ask for a page's
  full text and confirm `fetch_doc` is used" has not been reported. Run it and read the transcript
  before drafting Part 7, and say what happened. If the model prefers `fetch_doc`, tighten the
  system prompt and do not remove the tool.
- **Measure the cost of one MCP search on the deployment.** The 14 500 to 18 000 token figure is an
  estimate from before the build. The README deliberately carries no number, so this has to come
  from a real run before the article quotes one.
- **C16, local inference.** The remote Workers AI binding returns error 1050 under `pnpm start`. The
  accepted fallback shipped. Re-testing with different token scopes is still unverified, and the
  Part 1 article must not imply `pnpm start` runs real inference.
- **C18, three Part 2 gaps.** Compaction turns (purpose other than `agent`) were never exercised,
  the `getByName` stub is untyped and needs a typed helper (done as one confined cast), and `queue`
  and `schedule` from `extend` were not tested as carriers. Eviction cannot be tested under
  `@cloudflare/vitest-plugin`, so persistence across eviction was checked once with a dev-server
  kill and restart.
- **The Part 5 ordering bug has never been captured with logs.** The cause was found by reproducing
  it offline and from the operator's description, and both fixes were then confirmed by hand. The
  temporary diagnostics from `a402311` were removed. The fix handles a second tab only partly (see
  Part 5).
- **Gateway attribution** is deferred (see "Later").
- **The terminal's `accept()` exception** to the repo's Hibernation rule is documented in the demo
  README and `flue-demos/AGENTS.md`. If a reviewer rejects it, a separate terminal object cannot
  hibernate either, so the answer is to keep the exception and keep the inactivity timeout short.
- **Data retention.** Stored context is retained, and delete only hides a conversation. Memory
  belongs to the repository and survives deleting a conversation. The articles say so, because the
  README does not.
- **The consolidated end-of-project code review** (Parts 4 to 7) is still to do. A per-part manual
  sub-agent review was dropped as too costly. Do it before the public push, because a reviewer
  finding something after publication would force fix-forward commits across several articles.
- **A tag-by-tag check before publishing.** Each tag was cut after its operator checks, but Parts 5
  and 6 have bugs fixed only in later commits. Before pushing a tag to GitHub, run `pnpm check` and
  `pnpm test` at that tag (`git worktree add`), and decide whether the article should link the fix
  commit.
- Flue and the Agents SDK are changing quickly. The versions are pinned in each tag and listed
  above. The skills section parsing depends on Flue 2.3.0's wording and is the most likely thing to
  break on an upgrade.
- Part 1 is much bigger than the others, because it carries the UI, the Access stack, and Terraform.
  Have the Part 1 code working before writing the article, so the concepts piece can describe what
  actually shipped. It does.
- The Part 1 → Part 2 diff reads well because Terraform did not change and the UI components did not
  change. `git diff coding-agent/part-1 coding-agent/part-2 -- flue-demos/coding-agent/infra` is
  empty. Confirm that again before publishing Part 2.
- The terminal is a root shell in a container. Keep the Access policy to `ADMIN_EMAIL` unless the
  demo grows a role model.
- **Publication dates are not set.** The original plan said the first Friday after 26 October 2026
  was 30 October 2026. Nothing has been pushed to GitHub, and today is 28 October 2026, so that date
  is probably too soon. Pick the dates once the review above is done.
