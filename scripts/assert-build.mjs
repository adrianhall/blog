// Milestone 1 verification gate.
//
// Proves the `build.format: "preserve"` strategy produced the MIXED on-disk
// layout the URL contract requires:
//   - posts + /privacy.html  -> literal `.html` FILES
//   - listings / taxonomy    -> trailing-slash DIRECTORIES (`.../index.html`)
// plus that all required legacy endpoints exist. Exits non-zero on any failure.

import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const failures = [];

/** Assert a path exists AND is a regular file (not a directory). */
function assertFile(rel) {
  const p = join(dist, rel);
  if (!existsSync(p) || !statSync(p).isFile()) {
    failures.push(`Expected FILE: ${rel}`);
  }
}

/** Assert a directory-style route rendered to `<rel>/index.html`. */
function assertDir(rel) {
  const p = join(dist, rel, 'index.html');
  if (!existsSync(p) || !statSync(p).isFile()) {
    failures.push(`Expected DIRECTORY route (index.html) at: ${rel}/`);
  }
}

// --- Posts render as literal `.html` FILES (the critical M1 risk) -----------
// These are real converted posts (M2). The fixture set was removed by the
// clean-regenerate in scripts/convert-content.mjs.
assertFile('posts/2017/2017-08-11-integrating-react-native-typescript-mobx.html');
assertFile('posts/2024/2024-06-04-devcontainers.html');
assertFile('posts/2024/2024-09-13-aspnet-identity-part2.html'); // MDX + <Mermaid>/<Notice>
assertFile('privacy.html');

// --- Listings & taxonomy render as trailing-slash DIRECTORIES ---------------
assertFile('index.html'); // home (root)
assertDir('posts');
assertDir('page/2'); // root pagination (needs >10 posts — real content in M2)
assertDir('tags');
assertDir('categories'); // additive landing
assertDir('tags/react-native'); // slugified tag page
assertDir('categories/cloud-development'); // slugified category page

// --- Endpoints at their exact legacy paths ----------------------------------
assertFile('feed.xml');
assertFile('feed.json');
assertFile('sitemap.xml');
assertFile('robots.txt');
assertFile('feed/by_tag/react_native.xml'); // RAW tag name in feed filename

// --- Pagefind search index --------------------------------------------------
assertFile('pagefind/pagefind.js');

// --- Milestone 3 review-gate pages (temporary; deleted once M4 begins) ------
// Not part of the permanent URL contract (excluded from sitemap.xml, which is
// hand-built from a fixed URL list — see src/pages/sitemap.xml.ts), but
// asserted here so a broken design-preview build doesn't slip through.
assertDir('design-preview'); // comparison landing
assertDir('design-preview/a'); // Direction A — home list
assertFile('design-preview/a/post.html'); // Direction A — sample post
assertDir('design-preview/b'); // Direction B — home list
assertFile('design-preview/b/post.html'); // Direction B — sample post
assertDir('design-preview/c'); // Direction C — home list (blend of A + B)
assertFile('design-preview/c/post.html'); // Direction C — sample post

if (failures.length > 0) {
  console.error('\u2717 M1 build assertions FAILED:\n' + failures.map((f) => `  - ${f}`).join('\n'));
  process.exit(1);
}
console.log('\u2713 M1 build assertions passed.');
