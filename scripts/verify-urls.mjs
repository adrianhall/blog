// Milestone 2 — URL contract verifier.
//
// Diffs the URL set of the OLD Jekyll build (`<source>/_site`) against the NEW
// Astro build (`./dist`). The migration must not drop any content URL, so the
// script FAILS (exit 1) if any old URL is missing from the new output. Extra new
// URLs (e.g. the additive `/categories/` landing) are reported but allowed.
//
// Oracle caveat: the local `_site` can be a slightly stale Jekyll build. Post
// URLs whose backing `_posts/<year>/<name>.md` no longer exists in source are
// treated as stale and dropped from the expected set (with a logged reason) so a
// re-dated/renamed post does not cause a false "missing URL" failure.
//
// Asset URLs (`/assets/**`) and new-build-only infra (`/_astro/**`,
// `/pagefind/**`) are excluded — this checks the CONTENT/route contract, not
// theme assets (images are validated separately by the conversion copy step).

import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = process.env.BLOG_SOURCE
  || '/Users/ahall/repos/adrianhall/adrianhall.github.io';
const SITE = join(SRC, '_site');
const SRC_POSTS = join(SRC, '_posts');
const DIST = join(process.cwd(), 'dist');

const URL_EXT = new Set(['.html', '.xml', '.json', '.txt']);
const DIST_EXCLUDE = [/^\/assets\//, /^\/_astro\//, /^\/pagefind\//];
const SITE_EXCLUDE = [/^\/assets\//];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** Map an on-disk file path to its served URL, or null if not a URL file. */
function toUrl(root, file) {
  const rel = '/' + relative(root, file).split('\\').join('/');
  const dot = rel.lastIndexOf('.');
  const ext = dot === -1 ? '' : rel.slice(dot);
  if (!URL_EXT.has(ext)) return null;
  if (rel === '/index.html') return '/';
  if (rel.endsWith('/index.html')) return rel.slice(0, -'index.html'.length); // .../
  return rel;
}

function crawl(root, excludes) {
  const urls = new Set();
  if (!existsSync(root)) return urls;
  for (const file of walk(root)) {
    const url = toUrl(root, file);
    if (!url) continue;
    if (excludes.some((re) => re.test(url))) continue;
    urls.add(url);
  }
  return urls;
}

/** A post URL is stale if its backing source post no longer exists. */
function isStalePost(url) {
  const m = url.match(/^\/posts\/(\d{4})\/(.+)\.html$/);
  if (!m) return false;
  const base = join(SRC_POSTS, m[1], m[2]);
  return !existsSync(`${base}.md`) && !existsSync(`${base}.mdx`);
}

function main() {
  if (!existsSync(SITE)) {
    console.error(`✗ Reference build not found: ${SITE}`);
    process.exit(1);
  }
  if (!existsSync(DIST)) {
    console.error(`✗ New build not found: ${DIST} (run \`npm run build\` first).`);
    process.exit(1);
  }

  const expectedRaw = crawl(SITE, SITE_EXCLUDE);
  const actual = crawl(DIST, DIST_EXCLUDE);

  const stale = [];
  const expected = new Set();
  for (const url of expectedRaw) {
    if (isStalePost(url)) { stale.push(url); continue; }
    expected.add(url);
  }

  const missing = [...expected].filter((u) => !actual.has(u)).sort();
  const extra = [...actual].filter((u) => !expected.has(u)).sort();

  console.log(`URL contract: ${expected.size} expected (old _site), ${actual.size} produced (dist).`);
  if (stale.length) {
    console.log(`  skipped ${stale.length} stale _site URL(s) with no backing source post:`);
    for (const u of stale) console.log(`    - ${u}`);
  }
  if (extra.length) {
    console.log(`  ${extra.length} new URL(s) not in old site (allowed):`);
    for (const u of extra.slice(0, 20)) console.log(`    + ${u}`);
    if (extra.length > 20) console.log(`    … and ${extra.length - 20} more`);
  }

  if (missing.length) {
    console.error(`\n✗ ${missing.length} URL(s) from the old site are MISSING in dist:`);
    for (const u of missing) console.error(`    - ${u}`);
    process.exit(1);
  }
  console.log('\n✓ URL contract holds: every old content URL is present in dist.');
}

main();
