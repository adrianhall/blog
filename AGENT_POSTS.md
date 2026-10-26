# Agent Series: Proposed Articles

A seven-part series, published on successive Fridays, that builds an agentic coding environment on Cloudflare one piece at a time. Each part adds one capability to the same agent. The series stops at the agentic coding environment. PiHarness and OpenCodeHarness are a later topic.

## Series goal

Show how an agent differs from a chatbot. The difference is the ability to act (tools) inside a multi-step loop that carries memory from one step to the next. By the end, the reader has a working agent that can understand and change a repository.

## Conventions

- Each part that has code ends with a Git tag so readers can diff one part against the previous. The repo already uses slash-style tags (`astrojs/link`, `cf/tooling`), so the series follows suit: `coding-agent/part-1`, `coding-agent/part-2`, and so on. The number is the article number. Every part has a tag, and Part 1's tag marks the non-agent baseline app. Each article links to the GitHub compare view for its tag pair, for example `https://github.com/adrianhall/cf-demos/compare/coding-agent/part-2...coding-agent/part-3`. Part 1's article links to the tree at its tag, because there is nothing earlier to compare with.
- **Scope the diff to more than the demo directory.** A part's changes aren't all under `flue-demos/coding-agent`. New packages change the root `pnpm-lock.yaml`, and beta packages need entries in `minimumReleaseAgeExclude` in `pnpm-workspace.yaml`. A path-limited diff should include those files, and the article should call out any root-level change so readers don't miss it. Part 1 also has to call out the changes that created the `flue-demos/` family before any code existed: the `flue-demos/*` workspace glob, the `allowBuilds` and `minimumReleaseAgeExclude` entries the Flue toolchain needed, and the `AGENTS.md` edits (see "Demo repository").
- **Publish tags on the Friday, not before.** GitLab is private staging and GitHub is public. Develop the parts on GitLab, then push each tag to GitHub on its publication day. Push named tags only (`git push github coding-agent/part-3`), never `git push github --tags`, because that would also publish the unrelated internal tags.
- **Fix forward, never retag.** Once a tag is public and linked from an article, readers rely on it. If a published part has a bug, fix it in a later commit and mention it in the next article, or add a `-fix` tag. Don't move the tag.
- The loop file should change as little as possible between parts. Each part adds one seam: a tool, a sandbox binding, a memory store, a skills directory, or an MCP connection.
- **Each part adds one inspector tab to the UI** (Context in Part 1, Tools in Part 3, Terminal in Part 4, Memory in Part 5, Skills in Part 6, MCP in Part 7). Part 2 adds no tab. It swaps where the data comes from. The UI skeleton is built once in Part 1 so later parts only add a tab and a few context-segment colours.
- **Parts 1 and 2 are a before-and-after pair.** Part 1 is a Worker app that makes one model call per message and keeps the conversation in the browser. Part 2 moves it into an agent. The Part 1 → Part 2 diff is the article's main exhibit, so keep Part 1 free of agent-shaped code that Part 2 would only rename.
- Each part ends with a transcript excerpt that shows the new capability in use.
- Stack: Cloudflare Workers, Durable Objects (SQLite), Flue for the agent framework, Workers AI through AI Gateway for models, Terraform for infrastructure, and Vue 3 / Vuetify / Pinia for the UI (the demos repo's UI stack).
- **Pin versions in each part** and record them in the article, because Flue and the Agents SDK change quickly. The specification's pins were taken on 2026-10-26 (`@flue/*` 2.3.0, `@cloudflare/vite-plugin` 1.65.0, Wrangler 4.152.0, `vite` 8.3.4, `@cloudflare/vitest-plugin` 1.4.3). Re-check them the day each part starts.

## Demo repository

All code lives in the demos repo as a new demo, `flue-demos/coding-agent`, in a new `flue-demos/` family that sits beside `cf-terraform-demos/`, `vinext-demos/` and `wrangler-demos/`. The repo is developed in `~/gitlab/demos` (private staging, `origin` on GitLab) and published to the public GitHub repo `https://github.com/adrianhall/cf-demos` (the `github` remote), which is what readers see. The engineering specification and phased plan are in `specs/coding-agent/` in that repo. The repo's `AGENTS.md` files apply in full, and `flue-demos/AGENTS.md` records the one thing that differs. The rules that most shape this series:

- **pnpm only. `cf` is strongly preferred, but not required in this family.** Flue's Cloudflare target is documented around Vite and Wrangler: an authored `wrangler.jsonc`, author-owned Durable Object migrations, and `wrangler deploy`. Flue does not generate or consume a `cloudflare.config.ts`. So this demo deploys with `vite build` then `wrangler deploy`, with `wrangler.jsonc` generated from a committed `wrangler.jsonc.tpl` and never committed. A reader who copies the demo copies what Flue documents. This is a statement about Flue's current support, not a judgement against `cf`, and the README and `flue-demos/AGENTS.md` say so. Phase 0 moves the "you must use `cf deploy`" rule out of the repo root and into the `cf-terraform-demos` and `vinext-demos` family files, so the root only states a preference.
- **Terraform owns infrastructure; Wrangler owns code and bindings.** Lifecycle is `terraform apply → outputs.json → generate-wrangler → vite build → wrangler deploy`, and teardown deletes the Worker first. A demo using Containers adds a `destroy-containers` teardown step before the Worker is deleted. This is the pattern `wrangler-demos/review-agent` already proved, rebuilt on the repo's current standards.
- **Four tiers** (UI → API → application → infrastructure), with Hono routes kept thin and storage behind a port. The agent file is a thin adapter: a tool's `run()` calls an application use case.
- **Cloudflare Access in front of everything. This is a corporate requirement for every web-accessible property, and it holds from the first commit of Part 1.** There are three layers from one shared policy list: a Terraform-owned Access application over the whole hostname, the toolkit's `cloudflareAccess()` middleware (through `@demos/worker-common`) validating the JWT, the audience and the specific identity inside the Worker, and the toolkit's `cloudflareAccessPlugin()` Vite plugin emulating Access locally. There is no public route, no health-check bypass, and no `workers.dev` hostname. Use `@demos/worker-common` for the middleware, `/api/me`, body limits, and `upgradeRequired()`.
- **Five required scripts** (`start`, `check`, `fix`, `deploy`, `teardown`), complete JSDoc, Oxfmt/Oxlint, finite integration-test timeouts, and no `.dev.vars`. Workers-runtime tests use `@cloudflare/vitest-plugin`.
- Root `README.md` gets a new entry for the family and the demo.

## What the spikes found

The original plan listed six things to verify before writing code. Each could change the code or the article. Two were run locally (nothing deployed), one was decided, and the rest are scheduled in the phase that needs them. The evidence and the copy-pasteable recipes are in `specs/coding-agent/SPIKE_FINDINGS.md`.

1. **Flue with `cf` (was: blocks Part 2).** Resolved differently from the plan. Flue's Cloudflare target is built on `flue()` plus `@cloudflare/vite-plugin` and Wrangler, and it expects an authored `wrangler.jsonc` with the Durable Object migrations written by the author. Forcing the `cf` toolchain onto it would have made the demo teach a workaround instead of Flue. So the demo lives in a new `flue-demos/` family and follows Flue's documented path. Verified at the pinned versions: `vite build` and `wrangler deploy --dry-run` succeed. Three facts the article should state: the Vite plugins are `[flue(), cloudflare({ config: flueWorkerConfig() })]` (plain `cloudflare()` fails with a `[flue]` error), Flue merges its configuration in memory and writes no files, and Durable Object migrations use `migrations` only, never `exports` (they are mutually exclusive, and Flue needs `migrations`).
2. **Context viewer data source (Part 2).** Resolved. A module-scope `observe()` writes a compact snapshot **synchronously** into the agent's own Durable Object SQLite, and two methods added with `extend({ base })` read it over RPC. An un-awaited write to a separate object was rejected as loss-prone. A `kill -9` mid-turn did not lose the snapshot. Verified facts worth a sentence each: writes must be idempotent (a hot reload delivers events from both the old and the new isolate), reasoning blocks are replayed to the model and count toward context, and redaction is by pattern only, so a secret that matches no pattern is stored.
3. **Sandbox SDK version (Part 4).** Decided from the 1.x documentation, and still to be run in Phase 4. The plan says to prefer the latest version, so the demo uses `@cloudflare/sandbox` 1.x and never 0.x, including the 0.11.x that Flue's own blueprint text still names. The 1.x package has no `Sandbox` class and no `getSandbox()`. The demo writes its own `Sandbox` Durable Object over `container.exec()`, and Flue's sandbox adapter accepts it structurally. The terminal is Cloudflare's tmux-over-`container.exec()` design.
4. **Agent Memory (Part 5).** Not yet answered, and it stays optional. Access, the namespace lifecycle, and the binding's real method surface are confirmed in Phase 5 (checkpoints C11 and C12). The part ships a null adapter either way.
5. **MCP Server Portal (Part 7).** Decided: no portal. A portal is protected by Cloudflare Access, and a Worker cannot present an Access service token to it, so a portal cannot be used non-interactively from this demo. The agent connects directly to the public Cloudflare documentation MCP server, which needs no credential, no Terraform, and adds no web-accessible property. The article presents the portal as the production step.
6. **Code Mode through Flue (Part 3).** Resolved, and the result changes the claim. `@cloudflare/codemode` can be mounted from Flue with each tool defined once and the authorization boundary on the host side. But measured across 80 conversations, Code Mode used 125 model turns against 110 for direct calling. So Part 3 ships **both** modes and makes **no** claim that Code Mode reduces model calls. See Part 3.

The two checkpoints the spikes left open are C16 (local real inference, Part 1) and C20 (deployed Code Mode limits, Part 3). Both are in "Open questions".

## Proposed articles

### Part 1: What makes an agent an agent

A concepts article that ships with a working baseline: a chat app on Cloudflare that is deliberately **not** an agent. It gives the reader something to compare the agent against. Tag: `coding-agent/part-1`. Covers:

- The loop and its stop condition
- Short-term memory (the transcript) versus long-term memory
- The harness landscape at a high level (Pi Durable, OpenCode, build-your-own), with a note that the harnesses get their own article later
- Why Durable Objects suit agents: per-agent state, SQLite storage, and recovery after eviction
- A tour of the baseline app, ending with the three things it can't do: remember across a reload or a device, act on anything, or take more than one model call per answer

Code: _Set up a UI and basic Terraform so the reader can see the difference between a "worker app" and an "agent with a chat interface"._

This is the largest piece of code in the series, because it builds the app shell, the Access stack, and the infrastructure that every later part reuses.

**The rule for this part:** the Worker makes exactly one model call per message and keeps nothing between requests. The whole conversation lives in the browser. That is what makes it the "before" picture, and it is what Part 2 changes. Part 1 has no Flue dependency, no `flue.config.ts`, and no `src/agents/`. Its Worker is a plain Hono app and is the Worker entry.

**Infrastructure (`infra/`)**, following the repo layout:

- `providers.tf`: providers, dotenv data source, shared locals. The demo name, Worker name, gateway id and hostname are derived here and not added to the shared `.env`.
- `access.tf`: one self-hosted Access application over the **whole hostname**, with one `allow` policy that includes only `ADMIN_EMAIL` (not `everyone`). Part 4 gives the admin a root shell in a container, and the demo spends inference budget, so it is admin-only from the first commit.
- `ai-gateway.tf`: a Terraform-managed AI Gateway with every server-defaulted field pinned, copied from `wrangler-demos/review-agent`.
- `coding-agent.tf`: the Worker registration with observability set, a bootstrap version and deployment (`ignore_changes = all`), and the custom domain. The Worker registration disables `workers.dev` and preview URLs, because a `workers.dev` hostname would bypass a custom-domain Access application.
- `outputs.tf` (scalar, described outputs) and a committed `local-outputs.json` of placeholders, so `start`, `check` and tests never read live Terraform state.

`wrangler.jsonc.tpl` is committed and filled from the Terraform outputs by `generate-wrangler`. Its observability block mirrors `coding-agent.tf` literally, because `wrangler deploy` resets a Worker's observability to disabled when its configuration carries none.

No Durable Objects, no storage resources. Later parts add bindings in `wrangler.jsonc.tpl`, and Terraform changes only where a part needs a new resource (possibly Agent Memory in Part 5). Part 7 needs none.

**Access, built first.** Before any feature code, build and test the Access stack so every later route is born protected: `src/access-policies.ts` exports one `buildAccessPolicies(audience)` list used by both Vite and the Worker, the Worker mounts `createAccessMiddleware` first (with `defaultAction: 'block'`) followed by a `requireAdmin` check, and `cloudflareAccessPlugin()` is the first Vite plugin with two selectable local identities, one of which is not `ADMIN_EMAIL`, so the admin check can be seen to reject it. The article shows that Access is emulated locally and never disabled, so the local and deployed authorization paths are identical.

**Worker (`src/worker/`)**, in tiers:

- API: Hono routes. `/api/me` and `POST /api/chat`, behind the Access middleware from `@demos/worker-common`.
- Application: a chat service that validates and bounds the transcript the client sends. Only `user` and `assistant` roles are accepted, because a client must never be able to inject a `system` message. It also enforces a maximum message count and total size. The system prompt lives on the server. The default 8 KiB body limit is too small for a transcript, so the route passes an explicit limit and documents why, as the repo rules require.
- Infrastructure: a single module that is the only caller of the `AI` binding, and always goes through AI Gateway, attributing each request to the verified identity in gateway metadata. This is `playground`'s one-call-site pattern, with a build-failing isolation test. It is demo-local code in `playground`, not part of `worker-common`, so copy the pattern and don't import it.

**Model.** One constant, used by every part: `@cf/moonshotai/kimi-k2.6` (as `cloudflare/@cf/moonshotai/kimi-k2.6` for Flue's `useModel`). Part 3 needs tool calling, so it is chosen once, here, and Part 3 checks it. The alternate is `@cf/zai-org/glm-5.3-flash`.

**Context inspector.** A shared `ContextSegment` discriminated union (in `src/shared/`) with a `kind` per colour. Part 1 ships these kinds: `system`, `history-user`, `history-assistant`, `user` (the current prompt), and `assistant`. Later parts only add kinds (`tool-definition`, `tool-call`, `tool-result`, `skill-catalog`, `memory`, `mcp-definition`), and adding one fails the client build until the legend and colour map handle it. The UI shows a stacked bar of segment sizes, a legend driven by `kind`, and a segment list with the text. Token counts per segment are estimates from `gpt-tokenizer` (already used by `playground`) and are labelled as estimates. The legend and list repeat the labels, so colour is never the only carrier of meaning.

The inspector reads from a small `ContextSource` port. In Part 1 the Worker knows exactly what it sent, so it returns the segments alongside the reply. Part 2 replaces the source, not the component.

**Usage and cost.** A bar showing tokens in/out for the last response and for the whole conversation, plus a **model calls** counter. The counter reads 1 for every response in Parts 1 and 2, and it is what moves in Part 3. Token counts come from the Workers AI response, and the billed cost comes from the AI Gateway log lookup `playground` already uses, behind a `CostSource` port that fails soft: a failed lookup shows tokens without cost and never an error. Label any figure that is an estimate.

**Chat UI.** A Pinia store holds the messages in memory and sends the whole transcript with every request, then streams the reply into the list as NDJSON frames. The inspector is the first (and for now only) tab in an inspector panel, so later parts add tabs and don't restructure the page. A page reload clears the conversation. That is intentional, and the article shows it.

**Tests.** Unit tests for the segment builder and for transcript validation, including a rejected `system` role and the size bounds at and either side of each limit. The gateway-isolation test. Component tests for the store and inspector. Access tests: a policy-coverage test that every route registered on the Hono app is matched by an authenticating policy, a test that a path matching no policy answers `401`, a test that the Access middleware is the first middleware, a contract test over `infra/access.tf` (whole hostname, no bypass, `ADMIN_EMAIL` and not `everyone`), and a guard that fails the build if the template enables `workers_dev` or `preview_urls`. Workers-runtime tests (on `@cloudflare/vitest-plugin`) for authorization **outcomes**: no token is `401`, a token for the wrong audience is `401`, a valid token for a non-admin identity is `403`, a valid admin token succeeds, and a development token in a production-mode build is `401`. All integration projects have a finite timeout.

**Honest note on local development.** Workers AI has no local simulator, so the `ai` binding is remote under `pnpm start`. In the spike, the remote binding returned Workers AI error 1050 for the available token while direct REST calls with the same token worked, and the cause is unknown (checkpoint C16). If it persists, `pnpm start` runs the UI and the Access emulation against a clearly labelled fake reply, used only under `import.meta.env.DEV` and absent from a production build, and real inference is verified on a deployed Worker. The README says so. The spike's local REST shim is never shipped.

**Done when:** `pnpm check` and `pnpm test` pass, `pnpm start` works from a clean checkout, a multi-turn conversation works, the inspector and usage bar update after every turn, an unauthenticated request to `/` and `/api/me` is challenged at the edge on the deployed hostname, the `workers.dev` hostname does not resolve to the Worker, a signed-in identity that is not `ADMIN_EMAIL` receives `403` from the API, and `pnpm deploy` then `pnpm teardown` leaves the account clean.

### Part 2: The basic loop

Moves the conversation from the browser into an agent. A minimal agent on a Durable Object, built with Flue. No tools yet. The server now owns the transcript, which is persisted in DO SQLite so it survives a reload, a new device, and eviction. Tag: `coding-agent/part-2`.

The article's job is the diff from `coding-agent/part-1`. In Flue the harness owns the loop, so the article also makes the loop visible two ways: the context inspector, and a short standalone loop (about 60 lines, in the post only, not in the repo) that calls Workers AI directly.

> **Changed from the earlier plan:** this used to say "builds the loop by hand". That doesn't fit a Flue-based demo, so the hand-built loop is now a sidebar in the article.
> **Be honest in the article:** with no tools, the agent still makes one model call per answer. What changes in Part 2 is where the state lives and who owns the transcript. The loop itself only becomes visible in Part 3, when the model-calls counter goes above 1. The article should say that plainly and not oversell Part 2.

**What changes from Part 1** (this is the diff the reader sees):

- **Worker, removed:** `POST /api/chat`, the transcript validation (the server holds the transcript now, so there is nothing to validate), the Part 1 gateway call site as a separate module, and `main` in the Wrangler template (Flue supplies the Worker entry).
- **Worker, added:** the Flue agent router mounted under `/api/agent/assistant`. Flue's docs say anyone who can reach a conversation URL can talk to it, so the mount sits under `/api/`, behind the Access middleware and `requireAdmin`, and an authorization middleware ahead of it checks that the conversation id's owner prefix equals the caller's own. Conversation ids are `<ownerKey>.<ULID>`, where `ownerKey` is a prefix of a hash of the verified email, and are **issued by the server** (`POST /api/conversations`), never chosen by the client. A small application-owned Durable Object per owner, `ConversationIndex`, holds the conversation list and nothing else, because Flue has no API for listing conversations. Every route checks that the index has the id before it calls the agent, because an RPC to an id that does not exist creates an empty agent object. The agent module is a `'use agent'` file, `src/agents/assistant.ts`:

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

- **Config:** `wrangler.jsonc.tpl` gains the `ConversationIndex` binding and a uniquely tagged `new_sqlite_classes` migration. Flue generates a class per agent (`Assistant` becomes `FlueAssistantAgent`, binding `FLUE_ASSISTANT_AGENT`) and contributes its migration through `flueWorkerConfig()`, so the template does not list it. The Durable Object name equals the conversation id, so `env.FLUE_ASSISTANT_AGENT.getByName(id)` reaches the same object the agent runs in. The migration history is append-only. `vite.config.ts` becomes `[cloudflareAccessPlugin(…), vue(), flue(), cloudflare({ config: flueWorkerConfig() })]`.
- **Client:** the store stops sending history. It sends only the new message, and `@flue/sdk`'s `createFlueClient(...).observe()` replaces the local message list. Its `getSnapshot`/`subscribe` shape fits a Pinia store. (`@flue/react` doesn't apply to a Vue app.) A conversation list (create, select, rename, delete) appears, and a reload keeps the conversation. A 401 or 403 reaches the client's `error` phase after a few seconds of retries, and the UI shows it.
- **Inspector and usage:** the `ContextSource` swaps to a Flue-backed source. A single module-scope `observe()` subscriber catches Flue's `turn_request` event, which carries the full model-visible request, builds the compact segments with the same pure `buildSegments` function, and writes one row per agent turn into the agent's **own** SQLite, keyed by turn id so a duplicate delivery is harmless. Two methods added with `extend({ base })`, `latestContext()` and `contextUsage()`, read it back over RPC. That is the only extension, and it overrides none of `fetch`, `onRequest`, `onFiberRecovered` or `alarm`. Exact token counts also ride on the conversation stream as `metadata.usage` through `useResponseFinish`. The components don't change.
- **Terraform:** expected to be empty. Durable Objects are declared in `wrangler.jsonc.tpl` in this family. If the diff isn't empty, find out why before publishing, because "Terraform didn't change" is a point the article wants to make.

**Three things the article must say plainly.** Reasoning blocks are replayed to the model, so they count toward context and appear in the inspector labelled `[reasoning]`. Redaction of the stored snapshot is by pattern only (secret-looking keys, `Bearer`, `sk-` and JWT values), so a secret that matches no pattern is stored. And **stored context is retained, not purged**: deleting a conversation removes only its index row, so the agent object, Flue's stored stream and the snapshot remain. The README has a Data retention section, and delete is never described as erasure. That is acceptable for one admin user.

**Tests.** Delete the tests for the removed code. Add unit tests for identity-to-conversation derivation and the ownership check (including a forged prefix and a different-case email), `buildSegments` against a captured real `turn_request` fixture with secrets scrubbed, component tests for the new store, a test that delivering the same turn id twice leaves one row, and Workers-runtime tests that a caller can't read or write another user's conversation. Agent runs happen in a Durable Object alarm after admission, so a test waits for settlement with a finite timeout and stubs the model through Miniflare's `outboundService`. Do not test eviction with `evictDurableObject`: it hangs once an agent has run. Check persistence across eviction manually with a dev-server kill and restart, and say so.

**Done when:** `pnpm check` and `pnpm test` pass, a multi-turn conversation survives a reload and appears on a second browser, the inspector and usage bar still update after every turn, the agent route is `401` for an unauthenticated request and for a wrong-audience token, the Terraform diff from Part 1 is empty, and `pnpm deploy` then `pnpm teardown` leaves the account clean.

### Part 3: Giving the agent tools (with code)

The agent acts for the first time. This part teaches how to **build tools**, and ships two distinct ways to hand the same two tools to the model, chosen per conversation: **direct tool calls** (the default) and **Code Mode** (`@cloudflare/codemode`), where the model writes one block of code that calls the tools inside an isolate. Both are built from one set of tool definitions, so each tool is written once. Ends with the agent calling a tool and using the result.

Code: _Add basic tool-calling, and Code Mode as a second option._

> **Changed from the earlier plan:** this used to introduce Code Mode as "the answer to 'this is slow with ten tools'", with direct tools as the tagged commit and Code Mode as an optional follow-up. The measurements don't support that claim, so it is gone. Both modes ship in the tagged part, and the article says what Code Mode is actually for.

**Direct tool calls first.** Direct calls show the loop most clearly: a model turn, the tool calls it asks for, then another model turn. The transcript for the part shows turn 1, tool call, turn 2, answer.

**Two tools** in `src/worker/tools/`, defined with `defineTool` and exported as one list so both modes mount the same definitions:

- `get_current_time`: trivial, so the loop is easy to follow.
- `fetch_doc`: GETs a page from an allowlisted host (`developers.cloudflare.com` only). The allowlist (re-checked on every redirect hop, because redirects are followed manually), a response size cap, a timeout (via the `signal` Flue passes to `run`), and a content-type check all live in an application use case. Flue's docs are explicit that the model's arguments are not an authorization boundary, so the model picks a **path** and never the host.

```ts
export const fetchDoc = defineTool({
  name: 'fetch_doc',
  description: 'Fetch one Cloudflare documentation page by path, such as /workers/, and return its text. The argument is a path, not a URL. Use when the user asks about a Cloudflare product.',
  input: v.object({ path: v.string() }),
  async run({ data, signal }) {
    // the use case validates the path, fixes the host, re-checks every redirect hop, and caps size
    return { output: await fetchDocPage(data.path, { signal }) };
  }
});
```

**A refusal must teach.** In the spike a model passed absolute URLs and `//host` forms to this tool (Kimi K2.6, 3 of 10 chain runs). A pure `validatePath` accepts only a leading-slash path of letters, digits and `._~-/%` up to 200 characters, rejects `//` prefixes and any `.` or `..` segment, and throws an error whose message names the rule, because the model reads it and recovers. A model that ignores the description costs extra turns but never reaches another host. This is a good place for the article to show why validation belongs in the domain tier and not in the tool.

**Choosing a mode.** A conversation's `ToolMode` (`'direct'` or `'codemode'`) is chosen at creation and fixed afterwards, because switching mid-conversation would change the context the model replays and make the inspector's comparison meaningless. The client never decides it after creation: the agent must get the mode from a server-trusted source, and a request that tries to change an existing conversation's mode must have no effect (checkpoint C19 finds the path and a tamper test proves it). The agent file gains one conditional and nothing else:

```ts
// hooks may be conditional
if (toolMode === 'codemode') useTool(codeModeTool(definitions, executor, { onInnerCall }));
else for (const tool of definitions) useTool(tool);
```

**Code Mode, and what it is not for.** The spike measured Code Mode against direct calling across 80 conversations (four prompts, five runs each, Kimi K2.6 and GLM 5.3 Flash). It mounts from Flue with each tool defined once (a stateless adapter of about 260 lines over an `Executor` port), and the authorization stays on the host side: generated code could not `fetch`, read `env`, or reach another host. But it did **not** reduce model calls.

| Measure (mean per run)                             | Direct      | Code Mode (stateless)     |
| -------------------------------------------------- | ----------- | ------------------------- |
| One tool ("what time is it?"), turns               | 2           | 2                         |
| Three independent calls, turns                     | 2           | 2                         |
| Dependent chain, turns (Kimi / GLM)                | 3.0 / 3     | 3.6 / 3                   |
| Three-hop chain, turns (Kimi / GLM)                | 4.0 / 4     | 5.4 / 5                   |
| Three independent pages, input tokens (Kimi / GLM) | 4725 / 4929 | 2040 / 2230               |
| Tool definition tokens, ten tools                  | 821         | 1541                      |

125 model turns against 110 overall. Both models already emit independent tool calls in a single turn, so there is nothing for Code Mode to batch. On dependent chains a script cannot know the second path until the first call returns, so the model wrote one script per hop and added a turn. **The article must not claim that Code Mode takes fewer model calls, cuts round trips, or is faster.** The accurate claim is narrower and still worth teaching: **Code Mode moves large intermediate results out of the context window**. Page text never passes through the model, so input tokens fell by more than half when three large pages were fetched. That pays off with large results or many calls, which this series' two tools only partly demonstrate, and the article says so. It also costs more definition tokens than direct tools in the stateless form.

Code Mode needs the **Workers Paid plan** (one Dynamic Worker per run), a `worker_loaders` binding in the template, and an exact pin on an experimental package that changes its public API every month or two. It is opt-in per conversation, never the default.

**A caution that gates shipping (checkpoint C20).** In the spike a synchronous busy loop and a huge allocation both hung or crashed the **local** workerd despite the executor's timeout. The deployed limits are unverified, so Phase 3 runs both through the `codemode` tool on a deployed Worker, behind Access, before tagging. If a runaway script cannot be stopped, Code Mode is **not** shipped as a selectable mode. The part ships direct tools, and Code Mode becomes a teaching section with the numbers above.

**UI.** The message list renders `dynamic-tool` parts as cards (name, input, output or error, duration, and the `input-available` → `output-available` state change as it streams). A `codemode` card shows the generated code and its result, with the inner calls nested inside it (one `useDataWriter` part carries the whole list). The response header shows a **step counter** (model turns per response) so the loop is visible: turn 1 → tool call → turn 2 → answer. The Tools inspector tab lists each definition (name, description, JSON schema), and in Code Mode shows the single `codemode` definition with the tools beneath it. The context bar gains `tool-definition`, `tool-call`, and `tool-result` colours, which shows tool descriptions costing tokens on every turn and lets the two modes be compared side by side. A badge shows each conversation's mode, and the new-conversation dialog offers the choice with one sentence on the trade-off.

**Tests.** Unit tests for the allowlist (including redirects to other hosts), size cap, timeout, and content-type refusal. A `validatePath` table that rejects `//evil.example`, `https://evil.example/x`, `/../etc/passwd`, `/a/./b`, the empty string and `kv/`, accepts `/kv/` and `/d1/get-started/`, and checks that each refusal names the rule. A contract test that every tool has a unique name and a description that says when to use it. Tool-mode tests: the validator (closed set, default `direct`), the mode stored at creation and unchangeable afterwards, the schema conversion for each tool, the `Executor` port against a fake, and the host wrapper refusing from generated code what the direct tool refuses. Workers-runtime tests: a stubbed model that requests a tool produces two turns and a `dynamic-tool` part, and a tool that throws surfaces as an `output-error` part. The executor is stubbed there, because Code Mode's runtime facet cannot start in the test plugin, so a real Code Mode run is a documented manual check.

### Part 4: Adding a sandbox (Containers)

Tools that run commands or touch files need isolation. Adds a sandbox (Cloudflare Containers) as the place where the agent's commands run. Motivated by Part 3: once the agent can run code, it needs somewhere safe to run it. Ends with the agent running a command in the sandbox and reading the output.

Code: _adds repository cloning into the sandbox, and an openable terminal (xterm.js) so the sandbox can be used._

**Sandbox wiring.** The demo pins `@cloudflare/sandbox` at 1.x (`1.0.3`, or the newest 1.x when the part starts) and never 0.x. The 1.x package has no `Sandbox` class and no `getSandbox()`. Its exports are `Files`, `S3Mount`, `DirectoryBackup` and error types, so the Durable Object that starts the container is a class **this demo writes** in `src/cloudflare.ts`. It drives the container through `this.ctx.container` (`start()`, `exec()`, `setInactivityTimeout()`) and exposes the typed RPC methods Flue's sandbox adapter expects (`exec`, `readFile`, `writeFile`, `exists`, `mkdir`, `deleteFile`, `getState`). Flue's `cloudflareSandbox()` accepts that surface structurally and does not import `@cloudflare/sandbox`, so the agent passes the namespace stub to it. Whether this holds behaviourally is checkpoint C6, and the fallback is a `SandboxFactory` written against Flue's adapter API, never a 0.x package. Three consequences the article should explain: `exec()` takes an argument array and starts no shell (so the RPC wraps Flue's command string as `timeout -k 5 <s> sh -c <command>`), the base images include none of git, curl or tmux (so the `Dockerfile` installs them and copies a helper from the `cloudflare/sandbox` image whose tag equals the package version), and the helper is a `linux/amd64` binary (so build for that platform on Apple silicon). Sketch:

```ts
useSandbox(cloudflareSandbox(env.SANDBOX.getByName(sandboxName(id))), { cwd: '/workspace' });
```

`sandboxName` is a pure function of the verified identity and the conversation id, computed only after the ownership check, so it is never taken from a URL parameter or a header. The container uses the Durable Object scheduling policy, which is **public beta**, and the README and the article say so.

Mounting a sandbox gives the agent Flue's built-in `read`, `write`, `edit`, `bash`, `grep`, and `glob` tools. This is the point where the demo turns into a coding agent, and the Tools tab and context bar show the jump from two tools to eight.

**Repository cloning.** A form (repository URL and optional branch) calls `POST /api/conversations/:id/repository`. The domain layer validates the URL (public `https://github.com/<owner>/<repo>` only, with no credentials, userinfo, port or other host, and a branch that cannot be read as an option) and a repository port clones into `/workspace`. There is no git helper in 1.x, so the sandbox runs `git clone` through `container.exec()` in argument-array form, which means the URL never passes through a shell. It is a shallow clone by default, and a failure is mapped to an RFC 9457 problem without leaking container output verbatim.

**Egress.** In 1.x a container has no Internet access unless it is started with `enableInternet: true`. The demo leaves it off and allows named hosts only, through an outbound `WorkerEntrypoint` that starts with `github.com`. A blocked request answers `520`. If that proves unworkable the fallback is to say plainly that egress is open and why that is acceptable for one admin user. The article never claims a limit that is not enforced (checkpoint C10).

**Terminal.** An xterm.js component (with the fit addon, from npm and not a CDN) in a new Terminal tab, connected over WebSocket to the same container the agent uses, so a person can watch and take over from the agent. The mechanism is Cloudflare's documented 1.x design: the sandbox object accepts the socket and runs `tmux new-session -A` through `container.exec()` with a PTY, binary frames carry raw terminal bytes, and a JSON text frame carries resize requests as a shared discriminated union. The shell lives in a tmux session inside the container, so it survives a reload or a dropped connection, and two tabs on the same session see one screen. The agent's `bash` tool runs separate processes in the same container, so a person and the agent share the **filesystem**, not a shell, and the article says so.

**A documented exception to the repo's WebSocket rule.** The repo says to accept a socket with `ctx.acceptWebSocket()` (the Hibernation API). This terminal uses `server.accept()` instead, following Cloudflare's design, because hibernation would discard the tmux client's process handle. The exception is recorded in the demo README and in `flue-demos/AGENTS.md`. It is acceptable because the shell's real state is in tmux, the object is held in memory only while a terminal is open, and the inactivity timeout releases the container afterwards. Every **other** WebSocket rule still applies:

- The route is `GET /api/conversations/:id/terminal`, a Hono handler behind the same Access middleware and admin check as every API route, with `redirect: false` so a browser WebSocket gets an auth error and not an unexplained redirect failure. A non-upgrade request gets `426` through `upgradeRequired()`.
- The upgrade request is forwarded to the object with `stub.fetch(request)`. It is not replaced by RPC, because a `WebSocket` cannot be serialized.
- One named function deletes any inbound identity header (case-insensitively) and then sets the verified value. A comment says why the object may trust it: it has no route of its own, so it is reachable only through a Worker that authenticated the caller.
- The wire protocol has no identity field, and the domain rejects a payload that adds one. A listener that throws closes the socket and leaves the tmux client running, so malformed control messages are ignored and never thrown.
- Test that a smuggled identity header is ignored (including a differently-cased spelling).
- Anyone who reaches the terminal route gets a **root shell**. The route is admin-only, and the README says so.

**No public surface.** The demo must never use the Sandbox SDK's port-exposure or preview-URL features: each creates a publicly routable hostname outside the Access application. A guard fails the build if source calls them. The terminal is the only way into the container.

**Teardown.** The container application and its registry image are created by `wrangler deploy` and are invisible to Terraform. Add a `destroy-containers` step before the Worker is deleted and before `terraform destroy`. A container using the Durable Object scheduling policy may not be found by that command, in which case teardown deletes it with `cf containers applications delete` (checkpoint C17). Deploying needs Docker available locally to build the image, so the README says so.

**Tests.** Unit tests for URL validation (hostile inputs: other hosts, userinfo, ports, encoded slashes, `file:`, whitespace, a leading `-`), sandbox-name derivation, the identity-header scrub, the terminal control validator, and the `exec` wrapper's argument construction. A Workers-runtime test that the terminal route rejects a non-upgrade request and an unauthenticated one, and that a smuggled identity header is ignored. The container is stubbed behind its port, so normal tests never start one. A real container run, a clone, an agent `bash` call, a terminal round trip, and `curl https://example.com` answering `520` are documented manual checks.

### Part 5: Adding memory (with Agent Memory), optional

Covers two kinds of memory:

- **Short-term memory** within a session is automatic. The transcript in the Durable Object already provides it. No extra work.
- **Long-term memory** shared between agent sessions is worth having. This part shows how to wire up Agent Memory so the agent builds up an understanding of the repository that persists across sessions.

Marked optional in the article. Agent Memory is in private beta, so the part must say how to get access and what to do without it.

Code: _(No note in your draft. Added so the series has a code deliverable for every part. Cut it if you'd rather keep this part conceptual.)_

**Optional by construction.** Memory sits behind a `RepositoryMemory` port in the application tier, with two adapters: one backed by the Agent Memory binding, and a null adapter. When the binding isn't configured, the recall tool isn't mounted, the Memory tab shows "off", and nothing else changes, and the Worker must still build and deploy without a namespace. Flue's conditional hooks make this a plain `if`. If access to the beta is missing when the part starts, ship the null adapter only, say how a reader gets access, and skip the live-namespace steps (checkpoint C11).

**Configuration and lifecycle.** The binding is `agent_memory: [{ binding: "MEMORY", namespace }]` in the template. `generate-wrangler` substitutes values but cannot include or omit a block, so enabling memory selects a second template variant, switched by a Terraform-derived output that is empty when disabled and not by a new shared `.env` key (checkpoint C12). The namespace needs exactly one owner (Terraform if the provider has a resource, otherwise one script wired into the deploy and teardown steps), created before `wrangler deploy` and removed after the Worker is deleted.

**Scoping and authorization.** One profile per repository, with the name derived server-side from the repository slug (a hash if it would exceed the 100-character limit). The model never chooses the profile, only the query.

**How memory is used:**

1. After a clone, a **Learn this repository** action sends the agent a signal to explore the repo and `remember()` the build and test commands, layout, and conventions.
2. A `recall_repository_memory(query)` tool, backed by `recall()`, lets the agent look things up. A start-of-session recall can pre-load the basics.
3. When a response settles, the transcript goes to `ingest()` with the conversation id as `sessionId`. `ingest()` is idempotent, so retries don't create duplicates, which matters because Flue's event hooks are at-least-once. Because it is asynchronous work, it belongs in `useAgentFinish` and not in the synchronous `useResponseFinish`. Secrets in tool output are redacted before ingest, and the API's 500-messages and 32 KB per-message limits are respected.

```ts
if (memory.enabled) {
  useTool(defineTool({
    name: 'recall_repository_memory',
    description: 'Look up what is already known about this repository. Use before exploring it.',
    input: v.object({ query: v.string() }),
    async run({ data }) {
      const { answer } = await memory.recall(repoProfile, data.query); // profile fixed by server
      return { output: answer || 'Nothing is remembered about that yet.' };
    }
  }));
}
```

**UI.** A Memory tab with the `getSummary()` Markdown, the `list()` entries filtered by type (fact, event, instruction, task), and delete buttons (`delete`, `deleteSession`). The context bar gains a `memory` colour.

**Transcript for the article:** session 1 learns the repo; a brand-new session 2 on the same repo answers "how do I run the tests?" without exploring.

### Part 6: Adding skills

Skills are small, modular instructions that load only when needed. Adds a skills directory the agent can read on demand, and shows the difference between a skill (loaded instructions) and a tool (an action). Ends with the agent following a project-specific skill, such as the repository's testing conventions.

Code: _Bundled, workspace and third-party skills, from `skills.sh` / `npx skills add` or `.agents/skills`._

Flue supports all three sources, which makes this part mostly UI and no new agent plumbing:

1. **Bundled skill.** One skill shipped with the app, imported and mounted: `import commits from '../skills/conventional-commits/SKILL.md'` and `useSkill(commits)`. The `SKILL.md` is validated at build time, and its `name` must equal its directory name.
2. **Workspace skills.** Flue scans `.agents/skills/` in the sandbox working directory, so a cloned repository's own skills appear in the catalog with no code. This is the "project-specific skill" case.
3. **Third-party skills.** Run the skills.sh installer (`npx skills add ...`, confirm the exact command) from the Part 4 terminal, so installed skills land in `.agents/skills/`. The container has **no general Internet access** (Part 4), so the installer fails until the hosts it needs (for example the skills registry and `registry.npmjs.org`) are added to the outbound allowlist **by name**. Add only those, record them in the article, and keep the allowlist a single shared constant. Flue's docs say the scan happens at session start, so check whether a skill installed mid-conversation needs a new session (and say so in the article if it does; checkpoint C13).

**UI.** A Skills tab listing the catalog (name, description, a `bundled` or `workspace` badge, and whether it was activated in this conversation). The payoff is in the context bar: the always-present `skill-catalog` segment is small (one line per skill), and the `tool-result` produced by `activate_skill` is large and appears only when used. Showing both token counts side by side makes progressive disclosure concrete.

**Tests.** A test that every bundled skill description says when to use it ("Use when..."), since the description carries the whole routing decision, and that every bundled `SKILL.md` has a valid name.

### Part 7: Adding MCP

Connects the agent to an MCP server for an external capability. Covers which MCP servers to trust, how tool results from MCP flow into the loop, and how this connects to the authentication questions in the agent authentication article. Ends with the finished agentic coding environment: an agent that can read and change a repository with tools, a sandbox, memory, skills, and an external service.

Code: _One `useMcpConnection` to the public Cloudflare documentation MCP server._

> **Changed from the earlier plan:** this used to connect through an MCP Server Portal. It no longer does. A portal is protected by Cloudflare Access, and a Worker cannot present an Access service token to it, so a portal cannot be used non-interactively from this demo. The article says that plainly and presents the portal as the production step for authenticated and multi-server setups.

**Connection.** One `useMcpConnection` pointing directly at the public Cloudflare docs MCP server, which is Streamable HTTP, needs no authentication, and matches the advice in the agentic setup post to give the agent the documentation. It exposes two tools, and only one is allowlisted. Sketch from Flue's MCP guide:

```ts
useMcpConnection({
  name: 'cfdocs',
  url: 'https://docs.mcp.cloudflare.com/mcp',
  tools: ['search_cloudflare_documentation'], // allowlist: exactly one tool
  optional: true // run without it if the server is unreachable
});
```

Flue mounts it as `mcp__cfdocs__search_cloudflare_documentation`. An allowlist that names a tool the server does not expose fails the connection, so the part re-lists the server's tools before relying on the name (checkpoint C14). The `tools` allowlist matters twice: it limits context cost, and it limits what a compromised or malicious server can put in front of the model.

**Infrastructure.** None. There is no Terraform resource, no output, no Wrangler binding, no secret and no hostname. The connection is outbound from the Worker (the agent object, not the container, so the sandbox's egress rules don't apply), and it adds no web-accessible property, so the Access requirement is untouched. A guard checks that `infra/` and the template are unchanged from Part 6, which is a point the article can make.

**Prompt injection, practically.** A server's descriptions enter the prompt and its results enter the conversation, so a server you do not control is a third-party dependency. The demo pins a hash of the mounted tool's description in code and shows a visible warning in the MCP tab and a log line if the server's description changes. Failing closed is optional.

**Auth, stated plainly.** This demo's MCP server needs no authentication, so nothing is implemented here. Where a server does need it (a portal, an issue tracker), the credential would be the "agent acts as itself" quadrant of the agent authentication article, not per-user delegation, and token exchange is the next step. Flue never stores tokens (the `auth` function is the seam). The article says that and stops.

**UI.** An MCP tab showing the connection, its status, and the mounted tools (allowlisted versus hidden). The context bar gains an `mcp-definition` colour. The tool description from the server is visible in the inspector, which makes the prompt-injection surface visible as well.

**Series wrap-up checklist:** clone a repo, ask a question that needs docs (MCP), recall repo facts (memory, if enabled), follow a repo skill (skills), run the tests in the sandbox (tools), and let the user take over in the terminal.

## Later (not in this series)

- PiHarness: running Pi Durable as the loop instead of building it.
- OpenCodeHarness: running OpenCode 2.0 inside a Durable Object, as a coda or a separate series.

## Open questions

- Agent Memory is in private beta. Confirm access before drafting Part 5 (C11), and how to express an optional binding with a substitution-only template (C12). The part ships a null adapter either way.
- **C16, local inference.** The remote Workers AI binding returned error 1050 for the available token under `pnpm start`, while direct REST worked. Re-test in Part 1 with the root credentials. If it persists, the accepted fallback is a labelled fake reply under `import.meta.env.DEV`, with real inference verified on a deployed Worker. The article for Part 1 must say so rather than imply `pnpm start` runs real inference.
- **C19 and C20, Code Mode.** How the tool mode reaches the agent from a server-trusted source, and whether the deployed isolate stops a runaway script. If C20 fails, Part 3 ships direct tools and Code Mode becomes a teaching section. Confirm the account is on the Workers Paid plan.
- **Sandbox behaviour on 1.x (C6 to C10, C17).** Whether the demo-written `Sandbox` object satisfies Flue's structural interface and its six built-in tools, whether attaching the sandbox starts a container on every message, whether the outbound allowlist works, and whether `destroy-containers` finds a Durable Object scheduling-policy application. Each has a stated fallback. The container scheduling policy is public beta.
- **The terminal's `accept()` exception** to the repo's Hibernation rule is documented in the demo README and `flue-demos/AGENTS.md`. If a reviewer rejects it, a separate terminal object cannot hibernate either, so the answer is to keep the exception and keep the inactivity timeout short.
- **Data retention.** Stored context is retained and delete only hides a conversation. The README says so, and no purge logic is added.
- Flue and the Agents SDK are changing quickly. Pin versions in each part and note the versions in the article. `@cloudflare/codemode` in particular changes its public API every month or two.
- Part 1 is much bigger than the others, because it carries the UI, the Access stack, and Terraform. Have the Part 1 code working before writing the article, so the concepts piece can describe what actually shipped.
- The Part 1 → Part 2 diff only reads well if Terraform barely changes and the UI components don't change. Check that before publishing Part 2 (`git diff coding-agent/part-1 -- infra` should be empty). If either one churns, the baseline was built too agent-shaped, and Part 1 should be reworked and not re-explained.
- Part 1's model needs tool support so Part 3 doesn't force a model change mid-series. The constant is chosen once in Part 1 (Kimi K2.6), and Part 3's transcript confirms it calls tools reliably (C5). If it does not, change the constant once in a documented fix commit and say so, with GLM 5.3 Flash as the alternate. A published tag is never moved.
- The terminal is a root shell in a container. Keep the Access policy to `ADMIN_EMAIL` unless the demo grows a role model.
- Publication dates are not yet set. The first Friday after today (Oct 26, 2026) is Oct 30, 2026.
