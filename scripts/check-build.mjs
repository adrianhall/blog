// Build correctness gate.
//
// A set of independent checks asserting that the produced `dist/` is correct
// and functional. Runs from `npm run build` (post-build) and `npm run check`.
//
// Every check is deliberately CHEAP and OFFLINE — no network, no headless
// browser — so it can gate every build without slowing the loop. External
// links are never fetched; only internal targets are resolved.
//
// ---------------------------------------------------------------------------
// Adding a check
// ---------------------------------------------------------------------------
// Append an entry to the CHECKS array at the bottom. A check is:
//
//   { name, run(ctx) -> { summary: string, failures: string[] } }
//
// `ctx` carries the crawl of `dist` (computed once, shared by all checks):
//
//   ctx.dist       absolute path to dist/
//   ctx.files      every file on disk, absolute paths
//   ctx.htmlFiles  subset of ctx.files ending in .html
//   ctx.served     Set of every URL the build serves (see fileToUrl)
//   ctx.fileToUrl  (absolutePath) -> served URL
//   ctx.isServed   (url) -> boolean, tolerant of trailing-slash / .html forms
//
// Return an empty `failures` array to pass. All checks always run — one
// failure never masks another — and the process exits 1 if any failed.
//
// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------
// Supersedes two migration-era scripts, both now in scripts/migration/:
//   - assert-build.mjs   route SHAPE contract (files vs. directories). Folded
//                        in here as the `route shape` check, but generalised:
//                        it asserted three hardcoded post fixtures, whereas
//                        this derives the expected route for EVERY post in the
//                        content collection.
//   - verify-urls.mjs    inbound legacy-URL contract. NOT folded in; it needed
//                        the retired Jekyll manifest. See that folder's README.

import { readdirSync, statSync, existsSync, readFileSync } from 'node:fs';
import { join, relative, posix } from 'node:path';

const DIST = join(process.cwd(), 'dist');
const CONTENT_POSTS = join(process.cwd(), 'src', 'content', 'posts');

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Recursively collect every file under `dir`. */
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** Map an on-disk dist file to the URL it is served at. */
function fileToUrl(file) {
  const rel = '/' + relative(DIST, file).split('\\').join('/');
  if (rel === '/index.html') return '/';
  if (rel.endsWith('/index.html')) return rel.slice(0, -'index.html'.length);
  return rel;
}

/** Assert `rel` exists in dist AND is a regular file (not a directory). */
function missingFile(rel) {
  const p = join(DIST, rel);
  return existsSync(p) && statSync(p).isFile() ? null : `expected FILE: /${rel}`;
}

/** Assert a directory-style route rendered to `<rel>/index.html`. */
function missingDir(rel) {
  const p = join(DIST, rel, 'index.html');
  return existsSync(p) && statSync(p).isFile()
    ? null
    : `expected DIRECTORY route (index.html) at: /${rel}/`;
}

// ---------------------------------------------------------------------------
// Check: route shape
// ---------------------------------------------------------------------------
// The URL contract depends on a MIXED on-disk layout produced by
// `build.format: "preserve"`:
//   - posts + /privacy.html -> literal `.html` FILES
//   - listings / taxonomy    -> trailing-slash DIRECTORIES (`.../index.html`)
// If this ever inverts, every published permalink breaks at once. The link
// check below cannot catch it: it tolerates both forms by design.

/** Directory-style routes that must exist. */
const DIR_ROUTES = [
  'posts',
  'page/2', // root pagination (proves >10 posts paginate)
  'tags',
  'categories',
  'tags/react-native', // slugified tag page
  'categories/cloud-development', // slugified category page
];

/** Endpoints that must exist at their exact paths, as files. */
const FILE_ROUTES = [
  'index.html', // home
  'privacy.html',
  '404.html', // custom 404 (wrangler.jsonc: not_found_handling)
  'feed.xml',
  'feed.json',
  'sitemap.xml',
  'robots.txt',
  'feed/by_tag/react_native.xml', // RAW tag name in feed filename
  'pagefind/pagefind.js', // search index
];

/** Every post source file maps to `/posts/<year>/<slug>.html`. */
function expectedPostRoutes() {
  if (!existsSync(CONTENT_POSTS)) return [];
  return walk(CONTENT_POSTS)
    .filter((f) => /\.mdx?$/.test(f))
    // Mirrors the collection glob in src/content.config.ts, which excludes the
    // Jekyll series-nav partials under `includes/` — they are not posts.
    .filter((f) => !relative(CONTENT_POSTS, f).split(/[\\/]/).includes('includes'))
    .map((f) => {
      const rel = relative(CONTENT_POSTS, f).split('\\').join('/');
      return 'posts/' + rel.replace(/\.mdx?$/, '.html');
    });
}

function checkRouteShape() {
  const failures = [];
  const postRoutes = expectedPostRoutes();

  for (const rel of postRoutes) {
    const f = missingFile(rel);
    if (f) failures.push(f);
  }
  for (const rel of FILE_ROUTES) {
    const f = missingFile(rel);
    if (f) failures.push(f);
  }
  for (const rel of DIR_ROUTES) {
    const f = missingDir(rel);
    if (f) failures.push(f);
  }

  return {
    summary:
      `${postRoutes.length} post route(s) as files, ` +
      `${FILE_ROUTES.length} endpoint(s), ` +
      `${DIR_ROUTES.length} directory route(s)`,
    failures,
  };
}

// ---------------------------------------------------------------------------
// Check: internal links and assets
// ---------------------------------------------------------------------------
// Catches the "misnamed internal link" bug class: a cross-post link or image
// path that resolves to nothing. This fails SILENTLY in normal operation —
// the URL contract uses literal `.html` paths written as plain Markdown links,
// so Astro never validates them and a typo only surfaces as a reader's 404.
//
// Checking `dist` rather than the `.mdx` sources means links emitted by
// layouts, components and taxonomy pages are covered too, and a target counts
// as valid only if a reader can really fetch it.

// Link targets we deliberately do not resolve on disk.
const SKIP_SCHEME = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i; // http:, mailto:, tel:, data:, //cdn...
const SKIP_EXACT = new Set(['', '#', '/']);

/**
 * Extract internal link and asset targets from an HTML document.
 * Covers href, src and srcset — so <img>, <script>, <link> and responsive
 * image candidates are all validated, not just anchors.
 */
function extractTargets(html) {
  const targets = new Set();

  for (const m of html.matchAll(/(?:href|src)\s*=\s*["']([^"']*)["']/gi)) {
    targets.add(m[1]);
  }
  for (const m of html.matchAll(/srcset\s*=\s*["']([^"']*)["']/gi)) {
    // Each candidate is "<url> <descriptor>", comma-separated.
    for (const candidate of m[1].split(',')) {
      const url = candidate.trim().split(/\s+/)[0];
      if (url) targets.add(url);
    }
  }
  return targets;
}

/**
 * Resolve a link target to a served URL, or null if it should be skipped.
 * Relative targets resolve against the URL of the page containing them.
 */
function resolveTarget(target, pageUrl) {
  const raw = target.trim();
  if (SKIP_EXACT.has(raw)) return null;
  if (SKIP_SCHEME.test(raw)) return null;
  if (raw.startsWith('#')) return null; // same-page fragment

  // Drop fragment and query — neither affects which file is served.
  const path = raw.split('#')[0].split('?')[0];
  if (!path) return null;
  if (path.startsWith('/')) return path;

  const base = pageUrl.endsWith('/') ? pageUrl : posix.dirname(pageUrl) + '/';
  return posix.resolve(base, path);
}

function checkInternalLinks(ctx) {
  const broken = new Map(); // pageUrl -> Set<target>
  let checked = 0;

  for (const file of ctx.htmlFiles) {
    const pageUrl = ctx.fileToUrl(file);
    const html = readFileSync(file, 'utf8');

    for (const target of extractTargets(html)) {
      const url = resolveTarget(target, pageUrl);
      if (url === null) continue;
      checked++;
      if (ctx.isServed(url)) continue;
      if (!broken.has(pageUrl)) broken.set(pageUrl, new Set());
      broken.get(pageUrl).add(target);
    }
  }

  const failures = [];
  for (const pageUrl of [...broken.keys()].sort()) {
    for (const t of [...broken.get(pageUrl)].sort()) {
      failures.push(`${pageUrl} -> ${t}`);
    }
  }

  return {
    summary: `${checked} target(s) across ${ctx.htmlFiles.length} page(s) (href, src, srcset)`,
    failures,
  };
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const CHECKS = [
  { name: 'route shape', run: checkRouteShape },
  { name: 'internal links & assets', run: checkInternalLinks },
];

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

function main() {
  if (!existsSync(DIST)) {
    console.error(`✗ Build output not found: ${DIST} (run \`npm run build\` first).`);
    process.exit(1);
  }

  const files = walk(DIST);
  const served = new Set(files.map(fileToUrl));

  const ctx = {
    dist: DIST,
    files,
    htmlFiles: files.filter((f) => f.endsWith('.html')),
    served,
    fileToUrl,
    /** Tolerant of the trailing-slash / implicit-.html forms a host may redirect. */
    isServed(url) {
      if (served.has(url)) return true;
      if (url.endsWith('/')) return served.has(url.slice(0, -1));
      return served.has(url + '/') || served.has(url + '.html');
    },
  };

  console.log(`Build checks — ${served.size} served URL(s) in dist/\n`);

  const failed = [];
  for (const check of CHECKS) {
    const { summary, failures } = check.run(ctx);
    const mark = failures.length === 0 ? '✓' : '✗';
    console.log(`  ${mark} ${check.name.padEnd(24)} ${summary}`);
    if (failures.length > 0) failed.push({ check, failures });
  }

  if (failed.length > 0) {
    for (const { check, failures } of failed) {
      console.error(`\n✗ ${check.name} — ${failures.length} failure(s):`);
      for (const f of failures) console.error(`    ${f}`);
    }
    console.error(`\n${failed.length} of ${CHECKS.length} check(s) failed.`);
    process.exit(1);
  }
  console.log(`\n✓ All ${CHECKS.length} build check(s) passed.`);
}

main();
