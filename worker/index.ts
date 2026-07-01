// M5: Workers Static Assets' built-in `html_handling` presets can't express
// this site's REQUIRED mixed URL scheme (`build.format: "preserve"` in
// astro.config.mjs, per the M1 notes):
//   - posts + /privacy.html -> literal `.html` FILES, served exactly as
//     requested (no redirect/rewrite -- see the URL contract in
//     MIGRATION_PLAN.md and scripts/legacy-urls.json).
//   - everything else       -> trailing-slash DIRECTORIES, resolved to
//     `.../index.html`.
//
// Every built-in `html_handling` mode gets this wrong in one direction
// (confirmed against Cloudflare's own html-handling docs truth tables):
//   - "auto-trailing-slash" (the default) 307-redirects *away* from the
//     literal `.html` post URLs the contract requires.
//   - "drop-trailing-slash" / "force-trailing-slash" go further and change
//     the canonical URL shape everywhere (extensionless files, or forced
//     trailing slashes on files too) -- would require rewriting every
//     URL-generating file in the app (astro.config, getPostUrl(), the
//     sitemap/feed builders, the canonicalPath prop M4 added) to match, and
//     would leave every page's own <link rel="canonical"> pointing at a URL
//     that immediately redirects away from itself.
//   - "none" serves literal `.html` files correctly, but stops resolving
//     `/folder/` -> `/folder/index.html` entirely, which would 404 every
//     directory-style route (home, /posts/, /tags/, archives, ...).
//
// So `html_handling` is set to "none" in wrangler.jsonc (disables ALL
// built-in rewriting) and this Worker reimplements ONLY the second half:
// for any request path ending in `/`, append `index.html` before handing
// off to the ASSETS binding. Literal `.html` requests never hit that branch
// and pass straight through unmodified -- zero redirects, zero app changes,
// the URL contract holds exactly as documented.
//
// `run_worker_first: true` (wrangler.jsonc) ensures every request reaches
// this Worker rather than relying on undocumented ordering between the
// "serve static assets directly" fast path and `not_found_handling` --
// `env.ASSETS.fetch()` still applies `not_found_handling: "404-page"` for
// anything that doesn't resolve to a real file, worker-first or not.

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/')) {
      url.pathname += 'index.html';
      request = new Request(url, request);
    }
    return env.ASSETS.fetch(request);
  },
};
