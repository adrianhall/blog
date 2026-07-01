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
| Theme | Light + dark with OS-aware toggle; **two design directions reviewed first** |
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

## Milestone 4 — Build the chosen theme

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

- [ ] Create the new GitHub repo for the Astro site (record its name in Handoff fact #2)
- [ ] Enable **Discussions** on it + create a Giscus category (e.g. "Comments")
- [ ] Confirm `adrianhall.uk` is on the Cloudflare account *(confirmed)*
- [ ] Add CI secrets later: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

## Milestone checklist

- [x] M1 — Scaffold Astro (collections, schema, Expressive Code, RSS, sitemap, Pagefind, URL routing)
- [x] M2 — Content conversion script + verification report
- [ ] M3 — Two design directions (review gate)
- [ ] M4 — Build chosen theme (layouts, pluggable comments/Giscus, share, analytics)
- [ ] M5 — Deploy to Cloudflare + domain + cutover/redirect

## Open confirmations for the new session

- Worker/project name — **confirmed `adrianhall-blog`** (`wrangler.jsonc`).
- Site lives at repo root — **confirmed** (Astro at `/`).
- New repo name — **confirmed `adrianhall/blog`** (Handoff fact #2).

## Costs and Context

- **M0** (Planning): Claude Opus 4.8 (default), $8.10, 273K context
- **M1**: Claude Opus 4.8 (default), $20.96, 321K context
- **M2**: Claude Opus 4.8 (default), $34.98, 429K context

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
