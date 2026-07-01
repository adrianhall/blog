# Blog Migration Plan: Jekyll → Astro on Cloudflare

> **Purpose of this document.** It is a self-contained handoff. The migration
> will continue in a **new session inside a new repository**, so this file
> captures everything needed to pick up without the original chat context:
> current-state findings, locked decisions, the conversion work, and the
> handoff facts at the bottom.

---

## Handoff facts (fill in / confirm before the new session)

1. **Source content location on disk:**
   `/Users/ahall/repos/adrianhall/adrianhall.github.io`
   (the existing Jekyll site — current working directory when this plan was written).
   The new session will read the old posts/images from here to convert them.

2. **New repository name:** `https://github.com/adrianhall/blog`
   - The Astro site lives at the **repo root** (simplest for Cloudflare Git integration).
   - The old repo `adrianhall.github.io` is reduced to a **redirect-only** repo.

3. **Cloud resources required:**
   - **Cloudflare Workers (Static Assets)** — hosts the built site (`./dist`).
   - **Cloudflare Web Analytics** — one site token for `adrianhall.uk` (privacy-first, free, no cookie banner).
   - **Custom domain on the `adrianhall.uk` zone** — bind/route the Worker to `adrianhall.uk` (zone already on the Cloudflare account).  Use `blog.adrianhall.uk` as the domain name.
   - **API credentials for CI** — `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` (GitHub Actions secrets).
   - **GitHub repo Discussions** (the new repo) — backing store for **Giscus** comments (enable Discussions + create a category, e.g. "Comments"). *(GitHub resource, not Cloudflare.)* - **CONFIRMED**: Discussions created and "Comments" category created.
   - **`adrianhall.github.io` 301 redirect** — handled on the GitHub Pages side (redirect repo / custom-domain), not a Cloudflare resource.
   - *Not needed:* KV, D1, R2, Durable Objects, Queues — this is a fully static site. `wrangler` is a CLI tool, not a provisioned resource. Pagefind (search) and Giscus (comments) are client-side/GitHub, no Cloudflare resource.

---

## Goal

Refresh the design and modernize the toolchain for **"Because Developers are Awesome"**
while preserving all content and existing URLs. Move hosting from GitHub Pages
(`adrianhall.github.io`) to Cloudflare, canonical on **`blog.adrianhall.uk`**.

## Locked decisions

| Topic | Decision |
|---|---|
| Framework | **Astro** (TypeScript, Content Collections, MDX) |
| Hosting | **Cloudflare Workers Static Assets** (via Wrangler) |
| Domain | Canonical **adrianhall.uk**; `adrianhall.github.io` → **301 redirect** |
| URLs | **Preserve exactly**: `/posts/YYYY/YYYY-MM-DD-slug.html` |
| Comments | **Pluggable** `<Comments>` component; first provider **Giscus** on the new repo's Discussions |
| Analytics | **Cloudflare Web Analytics only** (drop Clarity + Disqus) |
| Search | **Pagefind** (static, full-text) |
| Theme | Light + dark with OS-aware toggle; **Direction C chosen** after a 3-way review (M3) — see `design-c.css` |
| Publishing | **`npm run publish`** (manual) **and** GitHub Actions; optionally Cloudflare↔GitHub auto-build |
| Repo | **New repo** for the Astro site; old repo reduced to redirect-only |

---

## Current-state findings (source site)

- **Stack:** Jekyll 4.4.1 + Minimal Mistakes (vendored into the repo), built by GitHub Actions → GitHub Pages. No `CNAME` (currently on `github.io`).
- **Content:** 141 posts (2017–2026) under `_posts/<year>/`, ~37 MB / 154 images under `assets/images/<year>/`.
- **URL scheme:** `/posts/YYYY/YYYY-MM-DD-slug.html` (literal `.html`, date embedded twice; permalink `/posts/:year/:year-:month-:day-:title:output_ext`).
- **Front matter:** consistent — `title`, `categories`, `tags`, sometimes `date`, sometimes `mermaid: true`.
- **Features in use:** Microsoft Clarity analytics, Disqus comments, Lunr full-content search, RSS (`feed.xml`) + JSON feed (`feed.json`) + `sitemap.xml` + `robots.txt` + SEO tags, pagination (10/page, `/page/:num/`), category + tag archives, author-profile sidebar, breadcrumbs, per-post TOC, read-time, share buttons.
- **Custom pages:** `_pages/posts.html`, `_pages/tags.html`, `_pages/privacy.html`, `_pages/feed.json`.
- **Data:** `_data/navigation.yml` (main nav: Posts, Tags), `_data/ui-text.yml`.

### Jekyll-specific constructs to convert (the real migration work)

| Construct | Where | Count |
|---|---|---|
| `{% post_url ... %}` cross-post links | most posts | 100+ |
| `{% highlight lang %}…{% endhighlight %}` code blocks | pre-2024 posts | 100+ |
| ` ``` ` fenced code blocks | 2024+ posts | mixed |
| `{{ site.baseurl }}/assets/images/...` | many | many |
| `{% include links.md %}` (shared reference-link defs in `_includes/links.md`) | posts | 28 |
| `{% include_relative includes/*.md %}` (series nav, files under `_posts/2024/includes/`) | 2024 series | ~11 |
| Kramdown attribute lists: `.center-image` (23), `.notice--*` (~14), `.line-numbers` (3) | scattered | ~40 |
| Mermaid diagrams (`mermaid: true`) | posts | 6 |

---

## Feature parity map (old → new)

- Rouge / `{% highlight %}` → **Expressive Code (Shiki)**: themes, line highlight, filename titles, copy button
- Lunr search → **Pagefind**
- Disqus → **Giscus** (via pluggable comments component)
- Clarity → **Cloudflare Web Analytics**
- jekyll-feed / sitemap / seo-tag → **@astrojs/rss**, **@astrojs/sitemap**, Astro `<head>` SEO
- Pagination (10/page), category + tag archives, TOC, read-time, share → reproduced
- `feed.xml`, `feed.json`, `robots.txt`, `sitemap.xml` → reproduced at same paths

## URL contract (must not break)

- Posts render to the **exact** existing paths, including trailing `.html`:
  `/posts/2017/2017-08-11-integrating-react-native-typescript-mobx.html`
- Preserved routes: `/`, `/posts/` (paginated `/page/:num/`), `/tags/`, `/categories/`,
  `/privacy.html`, `/feed.xml`, `/feed.json`, `/sitemap.xml`, `/robots.txt`.
- **Verification step** diffs the old `_site` URL list against the new `dist` output; build fails on any missing URL.

---

## Milestone 1 — Scaffold the Astro site

- Astro + TypeScript, **Content Collections** for `posts`, MDX support.
- Front-matter **schema** matching source fields (`title`, `date`, `categories`, `tags`, optional `mermaid`, optional excerpt/teaser) — validates all 141 posts at build time.
- Integrations: **Expressive Code** (Shiki), **@astrojs/rss**, **@astrojs/sitemap**, **Pagefind**.
- **URL routing:** custom slug from filename preserving the trailing `.html`; reproduce home, `/posts/` (paginated), `/tags/`, `/categories/`, `/privacy.html`, feeds, sitemap, robots.

## Milestone 2 — Content conversion (scripted, one-time, with report)

Node script: `scripts/convert-content.mjs` walks the **source path** (see Handoff fact #1) and writes Astro content:

1. `{% highlight lang %}…{% endhighlight %}` → fenced ```` ```lang ````; `linenos` → Expressive Code line numbers
2. `{% post_url YYYY/... %}` → resolved relative links to the preserved URLs
3. `{{ site.baseurl }}/assets/...` → `/assets/...`; copy `assets/images/**` verbatim
4. Inline `{% include links.md %}` reference-link definitions (28 posts)
5. Inline `{% include_relative includes/*.md %}` series nav (~11 posts)
6. Kramdown attribute lists → MDX components:
   - `{: .notice--success|warning|info }` → `<Notice type="...">`
   - `{: .center-image }` → `<Figure>`
   - `mermaid: true` posts → `<Mermaid>` blocks (6 posts)
7. Validate front matter against the Content Collection schema
8. Emit a conversion report listing any post needing manual review

- URL verifier: `scripts/verify-urls.mjs` (diff old `_site` vs new `dist`).

## Milestone 3 — Two design directions (first review gate)

Two styled directions on real content (a post + home list), both with widescreen shell,
capped reading measure (~72–75ch), light/dark toggle (OS-aware), and design tokens
(color / type / spacing / radius):

- **A. Restrained editorial** — serif/sans body, whitespace-forward, subtle accent
- **B. Technical / developer** — crisp sans, prominent code styling, stronger accent

Owner picks one (or a blend) → full theme build.

> **Decision (locked): Direction C.** A blend added mid-review — B's color
> palette and typefaces, A's spacing/shape/component design, and the widest
> content area of the three (owner feedback: liked pieces of both, wanted
> more width). Refined once more for contrast (inline code) and to fully use
> the widened column. Source of truth: `src/design-preview/styles/design-c.css`,
> plus the "M3 implementation notes", "Addendum", and "Addendum 2" sections
> below. **M4 builds Direction C** — A and B are kept only as historical
> reference until M4 deletes `src/design-preview/` and
> `src/pages/design-preview/` per the "Deferred to M4" note.

## Milestone 4 — Build Direction C as the real theme

- Layouts: base (header / footer / theme toggle / analytics slot), post (byline, reading time, TOC on wide screens, share, **pluggable `<Comments>`** with Giscus first), list/home, tag & category archives, 404.
- **Cloudflare Web Analytics** snippet in the base layout (Clarity dropped).
- Share component (AddToAny or native); **Giscus** wired to the new repo's Discussions.

## Milestone 5 — Deploy & cut over

1. Deploy to **Cloudflare Workers Static Assets** via Wrangler.
2. Attach `adrianhall.uk` (custom domain / route); enable **Cloudflare Web Analytics**.
3. Configure **Giscus** against the new repo (Discussions enabled + category).
4. Verify: URL diff, redirect/link check, feed + sitemap + search parity.
5. Flip `adrianhall.github.io` to **301** → `adrianhall.uk`.

---

## Publishing & deployment

**Proposed `package.json` scripts**

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build && pagefind --site dist",
    "preview": "astro preview",
    "check": "astro check && node scripts/verify-urls.mjs",
    "convert": "node scripts/convert-content.mjs",
    "publish": "npm run build && npm run check && wrangler deploy"
  }
}
```

**Proposed `wrangler.jsonc` (assets-only static site)**

```jsonc
{
  "name": "adrianhall-blog",
  "compatibility_date": "2025-01-01",
  "assets": { "directory": "./dist" }
}
```

> A tiny Worker entry can be added later for edge redirects/headers; not required for the static site itself.

- **Manual publish:** `npm run publish` (build → verify URLs → `wrangler deploy`).
- **CI (GitHub Actions):** same steps on push to `main` using `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`, deploying via `wrangler deploy`.
- **Optional:** connect the repo to the Worker (Cloudflare Workers Builds / Git integration) for auto-deploy. Manual `npm run publish` remains available either way.

---

## Prerequisites (owner to complete)

- [x] Create the new GitHub repo for the Astro site (record its name in Handoff fact #2)
- [x] Enable **Discussions** on it + create a Giscus category (e.g. "Comments")
- [x] **Install the giscus GitHub App** on the new repo:
  <https://github.com/apps/giscus/installations/new> → select `adrianhall/blog`.
  **Discovered during M4** — this is a *separate* step from enabling
  Discussions/creating the category (both already done); it requires a human
  clicking through GitHub's App-installation UI and can't be done via
  `gh`/the REST or GraphQL API with a personal token. Confirmed done and
  working (post-M4): `curl https://giscus.app/api/discussions?repo=adrianhall%2Fblog&category=Comments&term=...`
  now returns `{"error":"Discussion not found"}` (the expected response for a
  term with no comments yet — a discussion is created lazily on first
  submission) instead of the earlier `"giscus is not installed..."` error,
  and a Playwright re-check on a live post page shows the real widget
  (reactions, comment box, "Sign in with GitHub") with no console errors.
- [x] Confirm `adrianhall.uk` is on the Cloudflare account *(confirmed)*
- [ ] Add CI secrets later: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

## Milestone checklist

- [x] M1 — Scaffold Astro (collections, schema, Expressive Code, RSS, sitemap, Pagefind, URL routing)
- [x] M2 — Content conversion script + verification report
- [x] M3 — Two design directions (review gate) — **Direction C chosen**
- [x] M4 — Build Direction C as the real theme (layouts, pluggable comments/Giscus, share, analytics)
- [ ] M5 — Deploy to Cloudflare + domain + cutover/redirect

## Open confirmations for the new session

- Worker/project name — **confirmed `adrianhall-blog`** (`wrangler.jsonc`).
- Site lives at repo root — **confirmed** (Astro at `/`).
- New repo name — **confirmed `adrianhall/blog`** (Handoff fact #2).
- Design direction for M4 — **confirmed Direction C**
  (`src/design-preview/styles/design-c.css`). Do not re-litigate A vs. B;
  start M4 by lifting C's `:root` tokens into `src/layouts/Base.astro`, then
  work through the "Deferred to M4" list in the M3 implementation notes.

## Costs and Context

- **M0** (Planning): Claude Opus 4.8 (default), $8.10, 273K context
- **M1**: Claude Sonnet 5 (default), $8.38, 321K context
  - Note: Some decisions around by_tag routing and extra categories page
- **M2**: Claude Sonnet 5 (default), $13.99, 429K context
  - Note: source mistakes (highlight language, bad links) propagate
- **M3**: Claude Sonnet 5 (default),  $25.75, 550K context
  - Built a third design option, plus iterate on design C once.
- **M4**: Claude Sonnet 5 (default), $20.00, 534K context
  - Bug: AddToAny was not implemented properly, so that was added

## M1 implementation notes (for M2 onward)

- **Node 24** pinned (`.nvmrc`, `engines`). Stack: Astro 7 + TS strict, Content
  Layer `glob` loader, MDX, `astro-expressive-code`, Pagefind (post-build step).
- **Routing:** `build.format: "preserve"` yields the mixed layout — posts &
  `/privacy.html` are literal `.html` **files**; listings/taxonomy are
  trailing-slash **directories**. Post URL = `/posts/${entry.id}.html` derived in
  `src/utils/posts.ts` (date falls back to the filename; 93 posts need this).
- **Taxonomy slug vs raw:** archive pages use a slug (`react_native`→
  `react-native`); per-tag feeds keep the raw value (`/feed/by_tag/react_native.xml`).
  Both come from `src/utils/taxonomy.ts`.
- **Decisions applied:** all 56 per-tag feeds reproduced; a `/categories/`
  landing was **added** (old site had none).
- **Deviation:** custom `src/pages/sitemap.xml.ts` (not `@astrojs/sitemap`, which
  emits `/sitemap-index.xml`) to keep the exact `/sitemap.xml` path.
- **Validation:** built on a **6-post fixture set** in `src/content/posts/`
  (M2 replaces these with the converted 141). `scripts/assert-build.mjs`
  (`npm run assert`) proves files-vs-dirs + endpoint paths; `astro check` is clean.
- **Deferred to M2:** full 141-post schema validation, `scripts/convert-content.mjs`,
  `scripts/verify-urls.mjs` (old `_site` vs `dist` diff), pagination pages
  (`/page/2/` etc. need >10 posts), and copying `assets/images/**` into `public/`.

## M2 implementation notes (for M3 onward)

- **Post count is 139**, not 141 — the plan's "141" counted the two
  `_posts/2024/includes/*.md` series partials, which are inlined, not posts.
- **Everything is `.mdx`.** A hazard scan showed the only prose-level MDX
  breakers were bare `{`/`}` (108 posts) and HTML comments (16); there were
  **zero** JSX-tag/unclosed-void hazards. `scripts/convert-content.mjs` masks all
  code (fenced + inline; converted `{% highlight %}` blocks included) so transforms
  never touch code, then escapes prose braces and turns `<!-- … -->` into
  `{/* … */}`. Every file is MDX compile-checked; **0 failures**.
- **Components added (minimal, semantic — M4 restyles):**
  `src/components/{Notice,Figure,Mermaid}.astro`. Imports are injected into the
  21 posts that use them. `<Mermaid>` takes the diagram as a `code` string prop
  (keeps `-->`/`{}` out of the MDX parser); the client render script is an M4 task.
- **Expressive Code line numbers:** added `@expressive-code/plugin-line-numbers`
  (default **off**; opted-in per block). `linenos` → `showLineNumbers`;
  kramdown `.line-numbers data-start=N` → `startLineNumber=N`; Rouge `hl_lines` +
  `data-line` → EC `{…}` markers.
- **Conversion tallies** (see `conversion-report.md`, git-ignored, regenerated by
  `npm run convert`): 796 highlight blocks, 200 `post_url` (0 unresolved),
  116 `{{ site.* }}`, 28 `links.md` + 10 `include_relative` inlined, 23 `<Figure>`,
  15 `<Notice>`, 3 `<Mermaid>`. The only flags are 3 posts whose stray
  `mermaid: true` (no diagram) was dropped — expected, not errors.
- **Images:** `assets/images/**` (157 files) copied verbatim to
  `public/assets/images/**` (exact `/assets/images/...` URLs). One image ref is a
  **pre-existing broken link** in the source (`2019/2019-02-11-image2.png`; the old
  `_site` renders it broken too) — not a migration regression.
- **URL verifier:** `scripts/verify-urls.mjs` diffs old `_site` vs `dist` and is
  wired into `npm run check`. **The local `_site` is a stale Jekyll build** (Ruby 4
  can't rebuild it here); the verifier drops post URLs whose backing `_posts` file
  no longer exists (one re-dated post: `2025-08-01-…` → `2025-08-03-oss-ai-editors`).
  Result: **0 missing**; allowed extras are `/categories/` (M1 additive) and the
  re-dated post's current URL.
- **Added route:** `/tags/page/[num]/` (pages 2..N). The old `_pages/tags.html`
  had `pagination: enabled`, so Jekyll emitted `/tags/page/2..14/` as paginated
  post-list pages; reproduced to keep the URL contract (build fails otherwise).
- **`assert-build.mjs`** updated to reference real converted posts (fixtures gone).
  `npm run build` now yields **247 pages**; `astro check` is clean (0/0/0).
- **Deferred to later milestones:** `<Mermaid>` client rendering + component
  styling (M4); the pre-existing broken image (owner content fix).

## M3 implementation notes (for M4 onward)

- **Everything lives under `src/design-preview/` (tokens, layouts, helpers) and
  `src/pages/design-preview/` (routes)** — deliberately isolated from the
  production pipeline so it can be deleted in one shot
  (`rm -rf src/design-preview src/pages/design-preview`) once a direction is
  picked. Nothing under `src/layouts/`, `src/components/`, or the existing
  `src/pages/*` was touched.
- **Real content, not mock-ups.** Every direction renders the same **home list**
  (8 most recent posts, real titles/dates/tags, a naive excerpt) and the same
  **showcase post** (`2024/2024-09-03-aspnetcore-options` — picked for its
  multi-language code blocks and two `<Notice type="success">` callouts)
  through the actual MDX pipeline (`getEntry` + `render()`), so Expressive
  Code, `<Notice>`, `<Figure>` all render for real. Only the showcase post's
  title links to its styled `post.html`; the other list titles are plain text
  (no styled destination exists for them yet) — noted on the comparison page
  so it doesn't read as a bug.
- **Self-contained stylesheets**, `src/design-preview/styles/design-{a,b,c}.css`,
  each defining the *same* token contract (`--color-*`, `--font-*`, `--space-*`,
  `--radius-*`, `--measure`, `--shell-max`) with different values — whichever
  direction wins, its file's `:root` tokens are the intended starting point for
  the real M4 theme.
  - **A — Restrained editorial:** serif headings / sans body, warm cream ↔
    near-black-warm palette, muted terracotta accent, generous spacing, quiet
    code blocks (no shadow, blends into the reading column).
  - **B — Technical / developer:** all-sans, tighter type, blue accent, code
    blocks get dark terminal-style chrome **regardless of page theme** and are
    allowed to run wider than the prose measure (`--measure + 6rem`) — the
    "prominent code styling" from the plan.
  - **C — Editorial spacing, developer palette** (added after owner feedback,
    see the addendum below): B's colors/fonts on A's spacing/shape/quiet code
    chrome, at the widest measure of the three.
  - All three: a `.article-grid` on the post page adds a sticky `.article-rail`
    (published date, reading time, categories, tags) beside the prose column
    at ≥1100px — a light stand-in for the real M4 "TOC on wide screens", and
    the concrete demonstration of "widescreen shell" (not just a centered
    narrow column).
- **Light/dark is attribute-driven**, not just the media query: an inline
  head script sets `document.documentElement.dataset.theme` from
  `localStorage['bda-preview-theme']` (falling back to
  `prefers-color-scheme`) before first paint, and a toggle button in the
  header flips + persists it. The key is shared across every direction on
  purpose, so switching between them via the "View this page as Direction X"
  links keeps whichever mode you picked.
- **`astro.config.mjs` gained one real (non-preview-only) change:**
  `expressiveCode({ themeCssSelector: (theme) => `[data-theme='${theme.type}']` })`.
  By default Expressive Code only follows `prefers-color-scheme` unless you
  select its bundled theme *by name* (`data-theme="github-light"`); pointing
  its selector at `theme.type` (always `'dark'`/`'light'`) makes it follow the
  **same** `data-theme` attribute our toggle sets, so code blocks now switch
  with the rest of the page. `useDarkModeMediaQuery` is untouched, so the
  no-JS / never-touched-the-toggle experience is unaffected. This will still
  be needed in M4 regardless of which direction wins.
- **Presentational-only helpers** in `src/design-preview/content-meta.ts`
  (`excerptOf`, `readingTimeMinutes`) derive a teaser and a rough reading time
  from the raw MDX body. Neither concept exists in the content schema
  (`src/content.config.ts`) — kept out of `src/utils/` intentionally so it's
  obvious this doesn't feed the real pipeline; M4 should make a deliberate
  call on whether either becomes real (an `excerpt` front-matter field, a
  proper word-count that skips code blocks, etc.).
- **Gotcha (fixed):** `.post-list li { … border-bottom … }` is a *descendant*
  selector, and each tag pill is *also* an `<li>` (`<li class="tag-pill">`
  inside `<ul class="tag-list">` inside the card) — so it was picking up the
  card's padding/border/grid styles too, producing a stray rule under every
  tagged post. Fixed with the child combinator (`.post-list > li`) in both
  stylesheets. Worth remembering for M4: any nested `<li>`/`<ul>` inside a
  styled list item needs the same care.
- **Not part of the URL contract:** `/design-preview/**` is excluded from
  `sitemap.xml`/`robots.txt` (both are hand-built from fixed lists — see
  `src/pages/sitemap.xml.ts`) and every preview page is marked
  `<meta name="robots" content="noindex, nofollow">` as a second layer.
  `scripts/assert-build.mjs` gained five assertions for the review pages so a
  broken preview build still fails CI; `scripts/verify-urls.mjs` reports the
  five new paths as allowed extras (unchanged otherwise). `npm run build` now
  yields **252 pages**; `astro check` is clean (0/0/0).
- **Verification:** built, `astro check`, `npm run check` (URL contract), and
  `npm run assert` all pass. Both directions were also visually checked with a
  scripted Playwright pass (desktop 1440px + mobile 390px, light + dark) —
  caught the `.post-list li` bug above before sign-off.
- **Deferred to M4 (now decided: Direction C):** promote `design-c.css`'s
  `:root` tokens into the real `src/layouts/Base.astro`; delete
  `src/design-preview/` and `src/pages/design-preview/` entirely (A and B
  included); wire the toggle into the real header; extend the sticky rail
  into a real TOC; restyle `<Mermaid>` (still just a `<pre>`, per the M2
  notes) to match; style the tag and category archive pages, which M3
  intentionally left untouched.

### Addendum — Direction C, added after owner feedback on A + B

Feedback: liked bits of both — B's color scheme and fonts, A's spacing and
design — and both felt too narrow. Rather than a third from-scratch direction,
**C is an explicit blend**, plus a width increase applied everywhere:

- **`design-c.css`** takes B's color tokens (light + dark) and font stack
  wholesale, and A's spacing scale, radii, shadows, and *every* component rule
  (post-list dividers not cards, quiet no-shadow code chrome, simple
  left-border blockquote/notice, non-bold inline code) unchanged — those rules
  only ever reference custom properties, never a raw color or font, so
  re-pointing the token block was the entire job. If C wins, treat
  `design-c.css` as the source of truth (it already carries A's component
  CSS), not A's or B's file.
- **Widened all three**, since the "too narrow" feedback applied to both
  existing directions, not just a reason to add a third:
  `--measure`/`--shell-max` went from 74ch/1180px → 80ch/1320px (A), and
  72ch/1280px → 78ch/1400px (B). **C is wider than both** at 84ch/1480px —
  the specific, deliberate point of the new direction.
- **Switcher generalized from 2→N directions.** The original A/B layouts had
  a hard-coded single `counterpartHref` prop; adding a third direction meant
  every page needed links to *two* others, not one. Refactored into a shared
  `PreviewChrome.astro` (head/banner/nav/toggle, used by all three thin
  `PreviewLayout{A,B,C}.astro` wrappers) driven by a `DIRECTIONS` array and a
  `page: 'home' | 'post'` prop in `src/design-preview/config.ts`. Adding a
  future direction D is now: one CSS file, one three-line layout wrapper, one
  `DIRECTIONS` entry, two route files — no more N-way prop plumbing.
- **`scripts/assert-build.mjs`** gained two more assertions
  (`design-preview/c` + `design-preview/c/post.html`). `npm run build` now
  yields **254 pages**; `npm run check` and `astro check` are still clean.
  Re-verified visually with the same scripted Playwright pass (1600px desktop
  + 390px mobile, light + dark) across all three directions.

### Addendum 2 — Direction C refinements (inline code + wider content column)

Two more rounds of owner feedback on C specifically, both fixed in
`design-c.css` only (A and B untouched this round):

- **Inline `` `code` `` spans were harsh.** `.prose :not(pre) > code` was
  using `--color-code-bg`/`--color-code-fg` — the fixed dark-terminal tokens
  meant for the loud, theme-independent `<pre>` treatment carried over from
  Direction B. On inline spans that read as a jarring black box in light mode
  and barely registered in dark mode (both backgrounds are already near-black
  there). Switched to `--color-surface`/`--color-fg`/`--color-border` — tokens
  that already invert correctly with `data-theme` — plus a `1px solid` border,
  so inline code is now a quiet bordered chip in the same visual family as the
  `.expressive-code` blocks (curvy 1px box, theme-correct bg/fg) without
  needing new tokens. **Not implemented:** true per-token syntax highlighting
  of inline snippets — Expressive Code only tokenizes fenced blocks, not bare
  `` `code` `` spans; doing that would mean adding a remark/rehype step to
  run inline code through Shiki too, which is a bigger, separate change.
- **Content column wasn't using the full width.** At `--shell-max: 1480px`
  the `.article-grid` content column was `minmax(0, var(--measure))` with
  `--measure: 84ch` (~950px rendered) next to a 280px rail — leaving ~150px of
  the 1100px available to the column unused, because a `ch`-based cap doesn't
  grow to fill a `minmax(0, …)` grid track on its own. Fixed by widening
  `--shell-max` to **1650px** and switching `--measure` from `84ch` to a fixed
  **`1270px`** — sized to exactly fill what's left after the shell padding,
  the grid gap, and the (unchanged) 280px rail:
  `1650 − 2×24 (padding) − 52 (gap) − 280 (rail) = 1270`. The math is exact
  (confirmed via Playwright bounding boxes: grid 1602px / prose 1270px / rail
  280px, zero leftover), and the rail still collapses at the same ≥1100px
  breakpoint since that threshold was never tied to `--measure` or
  `--shell-max`. Trade-off worth flagging: at this width, body-text
  paragraphs run well past the ~90ch typically recommended for prose
  readability — an accepted, deliberate choice for this direction's "let code
  blocks and wide content breathe" goal, not an oversight.

## M4 implementation notes (for M5 onward)

Direction C promoted from a review build into the real theme. Every item on
the M3 "Deferred to M4" list is done; the design is otherwise unchanged from
`design-c.css` (no new visual review gate — this was implementation, not a
design decision point).

- **`src/design-preview/` and `src/pages/design-preview/` are gone**
  (`rm -rf`, both A and B included). `npm run build` dropped from **254 to
  248 pages** — the six deleted comparison routes.
- **`src/styles/global.css`** is `design-c.css` promoted verbatim for the
  token block and every existing component rule, minus the
  Milestone-3-only `.review-banner`/switcher CSS, plus new production
  component rules: pagination nav, a real nested table-of-contents list,
  share buttons, the `/tags/` + `/categories/` tag-cloud landings, the
  comments-section divider, and a small 404 treatment. `--measure`,
  `--shell-max`, and every color/space/shape token are byte-for-byte what
  Addendum 2 landed on.
- **New layouts**, replacing the M1 placeholder `Base.astro`:
  - `src/layouts/Base.astro` — head/SEO (canonical, OpenGraph, Twitter card,
    RSS+JSON-feed `<link rel=alternate>`), `<SiteHeader>`/`<SiteFooter>`,
    `<Analytics>`, the pre-paint theme script, and the Mermaid loader script.
  - `src/layouts/PostLayout.astro` — byline (date + reading time), tags, the
    `.article-grid` with a real `<TableOfContents>` in the sticky rail
    (replacing the M3 preview's meta-only rail), `<ShareButtons>`, and
    `<Comments>`.
  - `src/layouts/ListLayout.astro` — shared by home, `/posts/`, and every
    tag/category archive page (title, optional lede, pagination nav). This
    is what finally styles the tag/category archives, which M1–M3 left as
    bare unstyled lists.
- **New components**: `SiteHeader`, `SiteFooter`, `ThemeToggle` (toggle logic
  extracted from the old `PreviewChrome`, now dispatching a `bda:themechange`
  `CustomEvent` other components listen for), `Analytics`,
  `TableOfContents` (built from the `headings` array `astro:content`'s
  `render()` already returns — no new remark/rehype plugin needed; h2 groups
  h3 children into a nested list), `ShareButtons` (dependency-free: Web
  Share API where supported, direct X/LinkedIn intent links, Clipboard-API
  copy-link with an `execCommand` fallback — no AddToAny script, consistent
  with dropping Clarity/Disqus elsewhere in this migration), and the
  pluggable `Comments` (`src/components/Comments.astro` dispatches on a
  `provider` prop, currently just `"giscus"` →
  `src/components/comments/GiscusComments.astro`; adding a second provider
  later means a new file under `comments/` plus one more `if`, not touching
  call sites).
- **`src/utils/content.ts`** promotes `excerptOf`/`readingTimeMinutes` from
  the M3-only `src/design-preview/content-meta.ts` into a real utility (the
  "should this become real?" call the M3 notes flagged) — used for post-list
  excerpts, the post byline, and each post's meta-description. Front matter
  still has no `excerpt` field; both stay derived at build time.
- **`PostList.astro`** is the M3 preview's `design-preview/c/index.astro`
  markup promoted into the real component: every title now links to its real
  post (the preview only linked its one showcase post, since no other styled
  post page existed yet).
- **Giscus wiring**: `src/config/giscus.ts` holds the real `repo`/`repoId`/
  `category`/`categoryId` — looked up once via
  `gh api graphql -f query='{ repository(owner:"adrianhall", name:"blog") { id discussionCategories(first:20){nodes{id name slug}}}}'`
  rather than invented (these aren't secrets; Giscus reads them client-side
  regardless). **Found during verification, not anticipated in M3**: Giscus
  also requires its GitHub App to be installed on the repo — a separate step
  from enabling Discussions/creating the category, which were already done.
  Confirmed live: `curl https://giscus.app/api/discussions?repo=adrianhall%2Fblog&category=Comments&term=...`
  → `{"error":"giscus is not installed on this repository"}`, and the same
   error surfaced in-browser during the Playwright pass below. Added as a new
   checkbox under "Prerequisites" — it needs a human in GitHub's UI
   (<https://github.com/apps/giscus/installations/new>), not scriptable with a
   personal-access-token `gh` session. Comments rendered an empty (but styled)
   section until that was done. **Resolved same day**: owner installed the
   app; re-running the same `curl` now returns
   `{"error":"Discussion not found"}` (expected — discussions are created
   lazily on first comment/reaction), and a follow-up Playwright check shows
   the real widget (reactions, comment box, "Sign in with GitHub", zero
   console errors) on a live post page. Checkbox flipped in "Prerequisites".
- **Cloudflare Web Analytics**: `src/components/Analytics.astro` reads
  `PUBLIC_CF_BEACON_TOKEN` (documented in `.env.example`) and renders nothing
  when it's unset, rather than shipping a beacon `<script>` pointed at no
  token. The token itself is an M5 task (handoff fact #3 / M5 step 2); M4
  only builds the slot.
- **Mermaid** (`pre.mermaid` from `src/components/Mermaid.astro`, still just
  a bare element per the M2 notes) now actually renders: `mermaid` was added
  as a dependency, and `Base.astro`'s loader script dynamically `import()`s
  it only on pages that contain a `pre.mermaid` element (3 posts) so the
  ~600KB package is never fetched elsewhere. Re-renders on `bda:themechange`
  — each block's original diagram source is cached in a `data-mermaid-source`
  attribute before the first render (since `mermaid.run()` replaces the
  element's contents with an `<svg>`, destroying the source text), so
  toggling theme re-runs Mermaid with `theme: 'dark' | 'default'` against the
  restored source instead of double-rendering an already-converted SVG.
- **Gotcha (fixed): canonical/OpenGraph URLs were wrong for every file-style
  route.** `build.format: "preserve"` serves posts, `/privacy.html`, and the
  new `/404.html` as literal `.html` files, but `Astro.url.pathname` reflects
  Astro's *routing* model, not the on-disk output — for those routes it
  normalises away the extension into a trailing slash (e.g.
  `/posts/2024/2024-09-03-aspnetcore-options/`), which is simply the wrong
  canonical URL. Directory-style routes (home, `/posts/`, tag/category
  archives) don't have this problem — their `Astro.url.pathname` already
  matches the served `.../index.html` URL. Fixed with an explicit
  `canonicalPath` prop on `Base.astro` that overrides `Astro.url.pathname`
  when given; `PostLayout` requires a `path` prop (threaded from
  `getPostUrl(post)` in `posts/[...slug].astro`) and uses it for the
  canonical tag *and* for `ShareButtons`/`Comments`' term, and
  `privacy.astro`/`404.astro` pass their path literally. **Any future
  file-style route needs the same treatment** — this is not something Astro
  can infer from `build.format` alone.
- **404 page**: `src/pages/404.astro` (Base + `noindex` robots meta) needed a
  `wrangler.jsonc` change to actually be served —
  `assets.not_found_handling` defaults to `"none"`, so it was set to
  `"404-page"` (confirmed via Cloudflare's Workers Static Assets docs; the
  old GitHub Pages host did this automatically, Workers requires it
  explicit).
- **`scripts/assert-build.mjs`**: removed the six M3 design-preview
  assertions (their routes no longer exist), added one for `dist/404.html`.
  `scripts/verify-urls.mjs` was not touched — it already only *allows* extra
  URLs rather than hard-coding the design-preview ones, so `/404.html`
  and the earlier-added `/categories/` just show up as (expected) allowed
  extras.
- **Not implemented / explicitly out of M4 scope:**
  - **Pagefind has no search UI.** The build-time index at `/pagefind/`
    still exists (M1), but no page queries it — M4's brief was "layouts,
    pluggable comments/Giscus, share, analytics" per the milestone
    checklist, and search wasn't in it. Wiring a `<PagefindSearch>` UI is a
    reasonable near-term follow-up but is a new decision, not something this
    milestone silently dropped.
  - **No favicon.** The old Jekyll site never had one either (checked
    source: no `favicon.ico`/`apple-touch-icon` anywhere); not a regression,
    but worth a deliberate decision before M5's public cutover.
  - Live Giscus theme-sync and Mermaid re-render were both *implemented*
    (see above) even though only "wire the toggle into the real header" was
    strictly required by the M3 note — worth knowing they're new surface
    area, not carried over from the preview.
- **Verification:** `npm run build` (248 pages), `npm run assert`, and
  `npm run check` (`astro check` clean + the URL-contract diff, still 0
  missing) all pass. Visually verified with a scripted Playwright pass
  (1600px desktop light+dark, 390px mobile) across the home page, a
  Mermaid-diagram post, a `<Notice>`/`<Figure>`-bearing post, and `/tags/` —
  confirmed the theme toggle flips both the page chrome and Mermaid/Expressive
  Code theming together, the TOC nests h3s under their h2, and (at the time)
  the only console errors captured were the Giscus "not installed" ones
  above — which is how the missing-GitHub-App-install prerequisite was
  actually discovered, not anticipated up front. Re-verified after the owner
  installed the app: the same pass now shows zero console errors and a fully
  working Giscus widget (see the Giscus-wiring note above).

### Post-M4 fixes (found during owner review)

- **Tag-pill misalignment on post pages.** `.prose li + li { margin-top:
  var(--space-2); }` (real MDX list rhythm) is a descendant selector, so it
  also matched `<li class="tag-pill">` inside `PostLayout`'s tag list —
  the only place a `.tag-list` lives inside `.prose` (`PostList`'s copies sit
  in `.post-card__body`, unaffected). Every tag past the first got an
  unwanted 8px top offset, breaking the flex-row alignment. Fixed with a
  `.tag-list li + li { margin-top: 0; }` override in
  `src/styles/global.css`; `.tag-list`'s own `gap` already handles spacing.
- **Share buttons didn't match the old site, and LinkedIn looked broken.**
  The original M4 `ShareButtons.astro` shipped a *generic* set (native
  share, X, LinkedIn, copy link) instead of checking what the old site
  actually used. Fixed by reading the real config
  (`_includes/social-share.html` in the source repo, an AddToAny widget) and
  matching it exactly: **copy link, email, Bluesky, Facebook, LinkedIn,
  Mastodon, Reddit, Threads** — X was never in the old list and stays out.
  One old-list member was dropped after investigation: **Slashdot**'s own
  bookmark/share feature has been dead since 2018 (independently confirmed,
  then reproduced live: `curl https://slashdot.org/bookmark.pl?...` returns
  "New bookmark creation is no longer supported") — the owner chose to drop
  it rather than link to a permanently broken feature on Slashdot's own
  site. The reported "broken" LinkedIn link was not actually a bug: LinkedIn
  populates the shared card by crawling the URL's OpenGraph tags, which
  can't happen against `localhost`; it renders correctly once the URL is
  publicly reachable (confirmed the URL format itself matches LinkedIn's
  documented `sharing/share-offsite/?url=` endpoint). Brand icons are the
  CC0-licensed Simple Icons paths (Bluesky/Facebook/Mastodon/Reddit/Threads);
  email reuses a Lucide-style outline icon to match the component's existing
  native-share/copy-link icons. Mastodon has no single domain (federated), so
  its button prompts once for the visitor's instance, remembers it in
  `localStorage` (`bda-mastodon-instance`), and opens
  `https://<instance>/share?text=...` — verified live against
  `mastodon.social` (redirects to sign-in when logged out, which is the
  documented/expected behaviour) and confirmed the prompt is skipped on
  subsequent clicks.
- **Mastodon share icon rendered white instead of matching the other brand
  icons.** A third instance of the *exact same* bug class as the tag-pill
  fix above: `.prose a { color: var(--color-accent); }` is a descendant
  selector, and most of the new share icons (email, Bluesky, Facebook,
  LinkedIn, Reddit, Threads) are `<a>` tags living inside `.prose` (the
  `.share` row sits inside `<article class="prose">` on the post page), so
  that rule permanently overrode them to accent-blue instead of the intended
  neutral-by-default / accent-on-hover treatment. The three `<button>`-based
  icons (native share, copy link, Mastodon) aren't `<a>` tags, so `.prose a`
  never touched them and they correctly stayed neutral (`--color-fg`) — which
  is what made Mastodon look like the odd one out, since in dark mode
  `--color-fg` (`#e6edf3`) reads as near-white next to the other icons'
  accent blue (`#58a6ff`). Every icon had the same latent bug; Mastodon just
  wasn't affected by it, which made the *intended* neutral state look wrong
  by comparison to the *accidental* blue state everything else had. Fixed by
  scoping the button styling to `.share > .share__link` (specificity now
  beats `.prose a`), confirmed via computed-style checks in both themes:
  all nine icons now resolve to the same `color` at rest, in both light and
  dark. **Lesson for future components nested inside `.prose`**: any broad
  `.prose <selector>` rule (list items, links, etc.) needs to be checked
  against every component that might render inside the prose column, not
  just body-text content — this is now the third time (tag-pill margin,
  and this) the same generic-descendant-selector pattern has bled into a
  component. If a fourth turns up, scoping `.prose` rules to `.prose > *`
  or a dedicated `:where(...)` exclusion list may be worth doing proactively
  instead of patching one component at a time.
