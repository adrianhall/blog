// Milestone 2 — URL contract verifier. Milestone 5: frozen-manifest mode
// added so this runs in CI without the old Jekyll repo checked out.
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
//
// M5: the old Jekyll source (`adrianhall.github.io`) only ever exists on the
// machine that ran M2 — it is a different repo and is never checked out by
// CI. So the *first* time this runs against a live `_site`, the resulting
// expected-URL set is frozen into `scripts/legacy-urls.json` (committed).
// Every subsequent run — local or CI — prefers that manifest when the live
// `_site` isn't present, so the "must not regress a legacy URL" guarantee
// holds in CI without cloning a second repo. Regenerate the manifest with
// `npm run snapshot-urls` if the old site's build ever changes (it shouldn't
// — it's retired content) or if `BLOG_SOURCE` is deliberately re-pointed.

import { readdirSync, statSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST = join(__dirname, 'legacy-urls.json');
const FREEZE = process.argv.includes('--freeze');

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

/** Compute the (post-staleness-filter) expected URL set from a live `_site`. */
function expectedFromLiveSite() {
  const expectedRaw = crawl(SITE, SITE_EXCLUDE);
  const stale = [];
  const expected = new Set();
  for (const url of expectedRaw) {
    if (isStalePost(url)) { stale.push(url); continue; }
    expected.add(url);
  }
  return { expected, stale };
}

function main() {
  if (!existsSync(DIST)) {
    console.error(`✗ New build not found: ${DIST} (run \`npm run build\` first).`);
    process.exit(1);
  }

  const haveLiveSite = existsSync(SITE);

  if (FREEZE) {
    if (!haveLiveSite) {
      console.error(`✗ Cannot freeze: reference build not found: ${SITE}`);
      process.exit(1);
    }
    const { expected, stale } = expectedFromLiveSite();
    const sorted = [...expected].sort();
    writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + '\n');
    console.log(`✓ Froze ${sorted.length} legacy URL(s) to ${MANIFEST} (${stale.length} stale skipped).`);
    return;
  }

  let expected;
  let stale = [];
  let source;
  if (haveLiveSite) {
    ({ expected, stale } = expectedFromLiveSite());
    source = `live _site at ${SITE}`;
  } else if (existsSync(MANIFEST)) {
    expected = new Set(JSON.parse(readFileSync(MANIFEST, 'utf8')));
    source = `frozen manifest (${MANIFEST})`;
  } else {
    console.error(
      `✗ Neither the old-site reference build (${SITE}) nor a frozen manifest\n` +
      `  (${MANIFEST}) was found. Run \`npm run snapshot-urls\` once against a\n` +
      `  checked-out ${SRC.split('/').pop()} to create the manifest.`,
    );
    process.exit(1);
  }

  const actual = crawl(DIST, DIST_EXCLUDE);
  console.log(`Comparing against: ${source}`);

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
