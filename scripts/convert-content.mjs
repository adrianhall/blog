// Milestone 2 — one-time (re-runnable) content conversion.
//
// Walks the old Jekyll `_posts/<year>/` tree (see MIGRATION_PLAN.md Handoff #1)
// and writes Astro Content-Collection posts as `.mdx` into src/content/posts/.
//
// The conversion is a CLEAN REGENERATE: it wipes src/content/posts (including the
// six M1 fixtures) and rewrites everything from source, so re-running is safe.
//
// Design: every code region (fenced ``` blocks — including converted Jekyll
// `{% highlight %}` blocks — and inline `code`) is MASKED to an opaque token
// before any prose transform runs, then restored at the end. This guarantees the
// Jekyll-tag stripping, MDX brace-escaping and component insertion NEVER touch
// code content. Analysis of the 139 source posts showed the only prose-level MDX
// hazards are bare `{`/`}` (108 posts) and HTML comments (16 posts); there are
// zero JSX-tag or unclosed-void-tag hazards. Both hazards are fixed mechanically
// here, and every file is MDX compile-checked; failures are reported, not hidden.

import {
  readFileSync, writeFileSync, readdirSync, statSync, rmSync, mkdirSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { compile as compileMdx } from '@mdx-js/mdx';

// --- Paths ------------------------------------------------------------------
const SRC = process.env.BLOG_SOURCE
  || '/Users/ahall/repos/adrianhall/adrianhall.github.io';
const SRC_POSTS = join(SRC, '_posts');
const SRC_LINKS = join(SRC, '_includes', 'links.md');
const OUT = join(process.cwd(), 'src', 'content', 'posts');
const REPORT = join(process.cwd(), 'conversion-report.md');

// --- Small utilities --------------------------------------------------------
const TOK_OPEN = '\uE000';
const TOK_CLOSE = '\uE001';

/** Recursively list post markdown files, skipping any `includes/` dir. */
function listPosts(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (entry !== 'includes') listPosts(p, out);
    } else if (entry.endsWith('.md') || entry.endsWith('.mdx')) {
      out.push(p);
    }
  }
  return out;
}

/** id = `<year>/<filename-without-ext>`, matching the M1 post id scheme. */
function toId(absPath) {
  return absPath
    .slice(SRC_POSTS.length + 1)
    .replace(/\.(md|mdx)$/, '');
}

// Rouge (old highlighter) accepted language names that Shiki (Expressive Code)
// does not bundle. Map them to the equivalent Shiki grammar so blocks keep their
// syntax highlighting instead of falling back to plaintext (with a build WARN).
//   - gradle: Gradle build scripts are a Groovy DSL; Shiki has no `gradle`.
const LANG_ALIAS = {
  gradle: 'groovy',
};

/** Longest run of backticks in a string (to size safe fences). */
function longestBacktickRun(s) {
  let max = 0;
  for (const m of s.matchAll(/`+/g)) max = Math.max(max, m[0].length);
  return max;
}

/** Escape a value for use inside a double-quoted YAML/JSX string. */
const q = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

// ---------------------------------------------------------------------------
// Front matter
// ---------------------------------------------------------------------------
function splitFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: raw };
  return { data: parseYaml(m[1]) || {}, body: raw.slice(m[0].length) };
}

function toDateString(v) {
  if (!v) return undefined;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

function asArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v.map(String) : [String(v)];
}

/** Serialise a normalised, deterministic front matter block. */
function renderFrontMatter({ title, date, categories, tags, mermaid }) {
  const lines = ['---'];
  lines.push(`title: ${q(title)}`);
  if (date) lines.push(`date: ${date}`);
  if (categories.length) {
    lines.push('categories:');
    for (const c of categories) lines.push(`  - ${c}`);
  } else {
    lines.push('categories: []');
  }
  if (tags.length) {
    lines.push('tags:');
    for (const t of tags) lines.push(`  - ${t}`);
  } else {
    lines.push('tags: []');
  }
  if (mermaid) lines.push('mermaid: true');
  lines.push('---');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Body transforms
// ---------------------------------------------------------------------------
const NOTICE_TYPE = (raw) => {
  const t = raw.toLowerCase();
  if (t.startsWith('success')) return 'success';
  if (t.startsWith('warn')) return 'warning';
  if (t.startsWith('info')) return 'info';
  return null; // unknown -> caller reports
};

/**
 * Convert `{% highlight lang [linenos] %}…{% endhighlight %}` (with optional
 * enclosing `{% raw %}` and an optional trailing kramdown
 * `{:.line-numbers data-start=N data-line=M}` IAL) into a fenced code block with
 * Expressive Code meta. Returns { body, count }.
 */
function convertHighlights(body, stats) {
  // Capture: lang, any Rouge attrs (linenos / hl_lines="…"), the code (with an
  // optional enclosing {% raw %}), and an optional trailing kramdown
  // `{:.line-numbers data-start=N data-line=M}` IAL.
  const re = /\{%\s*highlight\s+(\S+)([^%]*?)%\}[ \t]*(?:\{%\s*raw\s*%\})?\r?\n?([\s\S]*?)\r?\n?(?:\{%\s*endraw\s*%\})?[ \t]*\{%\s*endhighlight\s*%\}(?:[ \t]*\r?\n\{:\s*\.line-numbers(?:\s+data-start="(\d+)")?(?:\s+data-line="(\d+)")?\s*\})?/g;
  return body.replace(re, (_all, lang, attrs, code, dataStart, dataLine) => {
    stats.highlight++;
    // Strip any raw/endraw markers that survived inside the code.
    code = code.replace(/\{%\s*(?:end)?raw\s*%\}/g, '');
    const linenos = /\blinenos\b/.test(attrs);
    const hl = attrs.match(/hl_lines="([^"]*)"/);
    // Collect highlighted lines from Rouge hl_lines + kramdown data-line.
    const marks = [];
    if (hl) marks.push(...hl[1].trim().split(/\s+/).filter(Boolean));
    if (dataLine) marks.push(dataLine);
    const meta = [];
    if (linenos || dataStart || dataLine) {
      meta.push('showLineNumbers');
      stats.lineNumbers++;
    }
    if (dataStart) meta.push(`startLineNumber=${dataStart}`);
    if (marks.length) meta.push(`{${marks.join(',')}}`);
    const fenceLen = Math.max(3, longestBacktickRun(code) + 1);
    const fence = '`'.repeat(fenceLen);
    const info = (LANG_ALIAS[lang] ?? lang) + (meta.length ? ` ${meta.join(' ')}` : '');
    return `${fence}${info}\n${code}\n${fence}`;
  });
}

/** Mask fenced code blocks and inline code; returns { body, restore }. */
function maskCode(body, store) {
  // Fenced blocks first (allow 3+ backticks or ~~~ although source uses ```).
  body = body.replace(/(^|\n)(`{3,})([^\n]*)\n([\s\S]*?)\n\2(?=\n|$)/g,
    (m, pre) => {
      const i = store.length;
      store.push(m.slice(pre.length)); // keep the fence, drop the leading \n
      return `${pre}${TOK_OPEN}C${i}${TOK_CLOSE}`;
    });
  // Inline code.
  body = body.replace(/`[^`\n]+`/g, (m) => {
    const i = store.length;
    store.push(m);
    return `${TOK_OPEN}C${i}${TOK_CLOSE}`;
  });
  return body;
}

/** Mask an already-built replacement string (kept verbatim through escaping). */
function stash(store, value) {
  const i = store.length;
  store.push(value);
  return `${TOK_OPEN}C${i}${TOK_CLOSE}`;
}

function restore(body, store) {
  return body.replace(new RegExp(`${TOK_OPEN}C(\\d+)${TOK_CLOSE}`, 'g'),
    (_m, i) => store[Number(i)]);
}

/**
 * Notices -> <Notice type>. Handles the three source forms:
 *   1. blockquote whose last line is `> {: .notice--TYPE}`
 *   2. blockquote followed by a standalone `{: .notice--TYPE}` line
 *   3. a plain paragraph followed by a standalone `{: .notice--TYPE}` line
 * Kramdown applies a standalone IAL to the immediately-preceding block, so forms
 * 2 and 3 are handled uniformly by wrapping the preceding non-blank run.
 */
function convertNotices(body, stats, flags, id) {
  const lines = body.split('\n');
  const out = [];
  const standIal = (l) => l.match(/^\{:\s*\.notice-{1,2}([a-z]+)\s*\}\s*$/);
  const emit = (content, type) => {
    out.push('', `<Notice type="${type}">`, '', content, '', '</Notice>', '');
    stats.notice++;
  };
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Form 2/3: standalone IAL applies to the preceding block already in `out`.
    const stand = standIal(line);
    if (stand) {
      const type = NOTICE_TYPE(stand[1]);
      if (type == null) {
        flags.push(`- \`${id}\`: unknown notice type \`${stand[1]}\``);
        out.push(line); i++; continue;
      }
      while (out.length && out[out.length - 1] === '') out.pop();
      const para = [];
      while (out.length && out[out.length - 1] !== '') para.unshift(out.pop());
      emit(para.map((l) => l.replace(/^>\s?/, '')).join('\n').trim(), type);
      i++; continue;
    }

    // Form 1: blockquote ending in `> {: .notice--TYPE}`.
    if (/^>/.test(line)) {
      let j = i;
      while (j < lines.length && /^>/.test(lines[j])) j++;
      const group = lines.slice(i, j);
      const lastIal = group[group.length - 1].match(/^>\s*\{:\s*\.notice-{1,2}([a-z]+)\s*\}\s*$/);
      if (lastIal) {
        const type = NOTICE_TYPE(lastIal[1]);
        if (type != null) {
          group.pop();
          emit(group.map((l) => l.replace(/^>\s?/, '')).join('\n').trim(), type);
          i = j; continue;
        }
        flags.push(`- \`${id}\`: unknown notice type \`${lastIal[1]}\``);
      }
      out.push(...group); // plain blockquote (or a form-2 IAL follows next line)
      i = j; continue;
    }

    out.push(line);
    i++;
  }
  return out.join('\n');
}

/** Main per-post transform pipeline. Returns { mdx, uses, stats }. */
function transform(id, rawBody, linksBlock, seriesResolver, validIds, flags) {
  const stats = {
    highlight: 0, lineNumbers: 0, postUrl: 0, unresolvedPostUrl: 0,
    baseurl: 0, includeLinks: 0, includeRelative: 0, figure: 0, notice: 0,
    mermaid: 0,
  };
  const uses = { Notice: false, Figure: false, Mermaid: false };
  let body = rawBody.replace(/\r\n/g, '\n');

  // 1. Jekyll highlight (+raw, +line-numbers) -> fenced code.
  body = convertHighlights(body, stats);

  // 2. Mask all code so nothing below can corrupt it.
  const store = [];
  body = maskCode(body, store);

  // 3. Inline `{% include links.md %}` (shared reference-link definitions).
  body = body.replace(/\{%\s*include\s+links\.md\s*%\}/g, () => {
    stats.includeLinks++;
    return `\n${linksBlock}\n`;
  });

  // 4. Inline `{% include_relative includes/X.md %}` (series nav partials).
  body = body.replace(/\{%\s*include_relative\s+([^\s%]+)\s*%\}/g, (_m, rel) => {
    stats.includeRelative++;
    return `\n${seriesResolver(id, rel)}\n`;
  });

  // 5. `{% post_url YEAR/SLUG %}` -> `/posts/YEAR/SLUG.html`.
  body = body.replace(/\{%\s*post_url\s+([^\s%]+)\s*%\}/g, (_m, target) => {
    stats.postUrl++;
    if (!validIds.has(target)) {
      stats.unresolvedPostUrl++;
      flags.push(`- \`${id}\`: unresolved post_url \`${target}\``);
    }
    return `/posts/${target}.html`;
  });

  // 6. `{{ site.baseurl }}` (and typo/underscore variants) -> ''.
  body = body.replace(/\{\{\s*site\.[a-z_]+\s*\}\}/gi, () => {
    stats.baseurl++;
    return '';
  });

  // 7. `![alt](src){: .center-image}` -> <Figure /> (a space may precede the IAL).
  body = body.replace(/!\[([^\]]*)\]\(([^)\s]+)\)\s*\{:\s*\.center-image\s*\}/g,
    (_m, alt, src) => {
      stats.figure++;
      uses.Figure = true;
      return `<Figure src=${q(src)} alt=${q(alt)} />`;
    });

  // 8. Notice blockquotes -> <Notice>.
  const beforeNotice = stats.notice;
  body = convertNotices(body, stats, flags, id);
  if (stats.notice > beforeNotice) uses.Notice = true;

  // 9. `<pre class="mermaid">…</pre>` -> <Mermaid code={`…`} /> (masked).
  body = body.replace(/<pre class="mermaid">\r?\n?([\s\S]*?)\r?\n?<\/pre>/g,
    (_m, code) => {
      stats.mermaid++;
      uses.Mermaid = true;
      // Diagrams were wrapped in {% raw %} to shield `{{ }}`/`-->` from Liquid.
      const diagram = code.replace(/\{%\s*(?:end)?raw\s*%\}\r?\n?/g, '');
      const safe = diagram.replace(/\\/g, '\\\\').replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${');
      return stash(store, `<Mermaid code={\`${safe}\`} />`);
    });

  // 10. HTML comments: drop `<!-- more -->`; convert the rest to {/* */} (masked
  //     so the intentional braces survive brace-escaping).
  body = body.replace(/<!--\s*more\s*-->/g, '');
  body = body.replace(/<!--([\s\S]*?)-->/g,
    (_m, inner) => stash(store, `{/*${inner}*/}`));

  // 11. MDX safety: escape bare braces in the remaining prose.
  body = body.replace(/([{}])/g, '\\$1');

  // 12. Restore all masked/stashed regions verbatim.
  body = restore(body, store);

  // Report any residual Liquid we didn't handle.
  for (const m of body.matchAll(/\{%[^%]*%\}/g)) {
    flags.push(`- \`${id}\`: residual Liquid tag \`${m[0].trim()}\``);
  }
  for (const m of body.matchAll(/\{:\s*\.[a-z-]+/g)) {
    flags.push(`- \`${id}\`: residual kramdown IAL \`${m[0]}\``);
  }

  return { body: body.trim() + '\n', uses, stats };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // Reference-link definitions to inline for `{% include links.md %}`.
  const linksBlock = readFileSync(SRC_LINKS, 'utf8').trim();

  const files = listPosts(SRC_POSTS);
  const validIds = new Set(files.map(toId));

  // Series-nav partial resolver (inlines `_posts/<year>/includes/X.md`).
  const seriesResolver = (id, rel) => {
    const year = id.split('/')[0];
    const p = join(SRC_POSTS, year, rel);
    return readFileSync(p, 'utf8').trim();
  };

  // Clean regenerate.
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const flags = [];
  const rows = [];
  const downgraded = [];
  const totals = {
    highlight: 0, lineNumbers: 0, postUrl: 0, unresolvedPostUrl: 0,
    baseurl: 0, includeLinks: 0, includeRelative: 0, figure: 0, notice: 0,
    mermaid: 0,
  };
  let componentPosts = 0;

  for (const file of files) {
    const id = toId(file);
    const raw = readFileSync(file, 'utf8');
    const { data, body: rawBody } = splitFrontMatter(raw);

    const { body, uses, stats } = transform(
      id, rawBody, linksBlock, seriesResolver, validIds, flags,
    );
    for (const k of Object.keys(totals)) totals[k] += stats[k];

    // Normalise front matter.
    const fm = {
      title: data.title,
      date: toDateString(data.date),
      categories: asArray(data.categories ?? data.category),
      tags: asArray(data.tags ?? data.tag),
      // Keep `mermaid: true` only when a real diagram survived.
      mermaid: uses.Mermaid,
    };
    if (!fm.title) flags.push(`- \`${id}\`: MISSING title`);
    if (data.mermaid && !uses.Mermaid) {
      flags.push(`- \`${id}\`: dropped stray \`mermaid: true\` (no diagram present)`);
    }

    // Component imports (relative to src/content/posts/<year>/file.mdx).
    const imports = [];
    if (uses.Notice) imports.push("import Notice from '../../../components/Notice.astro';");
    if (uses.Figure) imports.push("import Figure from '../../../components/Figure.astro';");
    if (uses.Mermaid) imports.push("import Mermaid from '../../../components/Mermaid.astro';");
    if (imports.length) componentPosts++;

    const importBlock = imports.length ? `\n${imports.join('\n')}\n` : '';
    const content = `${renderFrontMatter(fm)}\n${importBlock}\n${body}`;

    // MDX compile-check (syntax only; imports are parsed, not resolved).
    let ok = true;
    try {
      await compileMdx(`${importBlock}\n${body}`, { development: false });
    } catch (err) {
      ok = false;
      flags.push(`- \`${id}\`: **MDX compile FAILED** — ${String(err.message).split('\n')[0]}`);
      downgraded.push(id);
    }

    const outPath = join(OUT, `${id}.mdx`);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content);

    rows.push({ id, ...stats, uses, ok });
  }

  // --- Report ---------------------------------------------------------------
  const report = [];
  report.push('# M2 conversion report', '');
  report.push(`Source: \`${SRC}\``, '');
  report.push(`Converted **${files.length}** posts -> \`src/content/posts/**/*.mdx\`.`, '');
  report.push('## Totals', '');
  report.push('| construct | count |', '|---|---|');
  report.push(`| \`{% highlight %}\` blocks | ${totals.highlight} |`);
  report.push(`| blocks with line numbers | ${totals.lineNumbers} |`);
  report.push(`| \`{% post_url %}\` resolved | ${totals.postUrl} |`);
  report.push(`| unresolved post_url | ${totals.unresolvedPostUrl} |`);
  report.push(`| \`{{ site.* }}\` removed | ${totals.baseurl} |`);
  report.push(`| \`{% include links.md %}\` | ${totals.includeLinks} |`);
  report.push(`| \`{% include_relative %}\` | ${totals.includeRelative} |`);
  report.push(`| \`.center-image\` -> \`<Figure>\` | ${totals.figure} |`);
  report.push(`| notice -> \`<Notice>\` | ${totals.notice} |`);
  report.push(`| mermaid -> \`<Mermaid>\` | ${totals.mermaid} |`);
  report.push(`| posts using components | ${componentPosts} |`);
  report.push(`| MDX compile failures | ${downgraded.length} |`);
  report.push('');
  report.push('## Manual review flags', '');
  report.push(flags.length ? [...new Set(flags)].join('\n') : '_None._');
  report.push('');
  report.push('## Per-post construct counts', '');
  report.push('| post | hl | ln | post_url | fig | notice | mermaid | mdx |', '|---|--:|--:|--:|--:|--:|--:|:--:|');
  for (const r of rows) {
    const comp = [r.uses.Notice && 'N', r.uses.Figure && 'F', r.uses.Mermaid && 'M'].filter(Boolean).join('');
    report.push(`| ${r.id} | ${r.highlight} | ${r.lineNumbers} | ${r.postUrl} | ${r.figure} | ${r.notice} | ${r.mermaid} | ${r.ok ? (comp || '·') : '✗'} |`);
  }
  writeFileSync(REPORT, report.join('\n') + '\n');

  console.log(`✓ Converted ${files.length} posts -> src/content/posts`);
  console.log(`  components: ${componentPosts} posts | compile failures: ${downgraded.length}`);
  console.log(`  flags: ${new Set(flags).size} (see conversion-report.md)`);
  if (downgraded.length) {
    console.error('✗ MDX compile failures:\n  ' + downgraded.join('\n  '));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
