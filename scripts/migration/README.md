# Migration-era scripts (archived, not wired into `package.json`)

These scripts belong to the one-time Jekyll → Astro migration documented in
`specs/MIGRATION_PLAN.md` and `specs/M6_PLAN.md`. They are kept for historical
reference only. **None of them is referenced by `package.json` or CI**, and none
should be re-wired without reading the notes below.

The migration is complete. The active build gate is `scripts/check-build.mjs`,
which runs from both `npm run build` and `npm run check`.

## Why these cannot simply be run again

All of the import tooling reads the **old Jekyll repository**, which no longer
exists on disk:

```
/Users/ahall/repos/adrianhall/adrianhall.github.io      # gone
```

Its location was configurable via `BLOG_SOURCE`.

## Contents

### `convert-content.mjs` — DESTRUCTIVE, do not run

The original content importer: walked the Jekyll `_posts/<year>/` tree,
translated Liquid/kramdown into MDX, and wrote `src/content/posts`.

> **Warning**
> This script begins with a clean-regenerate:
> `rmSync('src/content/posts', { recursive: true, force: true })`.
> It **deletes the entire posts tree** before rebuilding it from the Jekyll
> source. With that source now missing it happens to abort earlier, while
> reading `_includes/links.md`, so in practice it currently fails without
> deleting anything — but that is an accident of statement ordering, not a
> guard. Treat it as destructive.

Its real remaining value is as a record of the transformation rules
(Liquid tags, kramdown IALs, `post_url` resolution, series-nav includes).

### `verify-urls.mjs` + `legacy-urls.json`

Verified that every URL from the old Jekyll build still existed in `dist`,
comparing against the frozen 305-URL manifest (152 of them post URLs). The
`--freeze` mode (previously `npm run snapshot-urls`) regenerated that manifest
from a live `_site` and can no longer succeed at all, since the Jekyll repo is
gone.

Note what retiring this gives up: it was the only check that caught a
**renamed or deleted post breaking inbound links** — external links, search
indexing, RSS subscribers. `check-build.mjs` does not cover this; the two guard
opposite directions:

| Script | Direction | Question |
|---|---|---|
| `check-build.mjs` (active) | outbound | do *our* links point at real routes? |
| `verify-urls.mjs` (archived) | inbound | do *previously published* URLs still exist? |

Rename a post and update every internal reference, and `check-build` passes
while the wider internet 404s. If permalink stability ever needs enforcing
again, `legacy-urls.json` is still committed here and the manifest path in the
script resolves relative to its own directory, so it will work from this
location unchanged.

### `assert-build.mjs` — superseded, its checks live on

The Milestone 1 gate. Asserted the mixed on-disk output shape the URL contract
depends on: posts and `/privacy.html` render as literal `.html` **files**, while
listings and taxonomy render as trailing-slash **directories**
(`.../index.html`), plus the presence of `feed.xml`, `sitemap.xml`, `robots.txt`
and the Pagefind index.

**That contract is still enforced** — it was folded into `check-build.mjs` as the
`route shape` check, and generalised on the way. This original hardcodes three
specific post paths as fixtures (e.g.
`posts/2017/2017-08-11-integrating-react-native-typescript-mobx.html`), which
would need editing whenever a fixture post is renamed. The replacement instead
derives the expected route for **every** post in the content collection, so it
also catches a post that silently fails to render.

Kept here only as the record of which endpoints were part of the original
contract and why. Nothing needs reinstating from it.
