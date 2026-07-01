// Presentational helpers derived from a post's raw MDX body: a plain-text
// teaser for listing pages and a rough reading-time estimate for the post
// byline. Promoted from `src/design-preview/content-meta.ts` (Milestone 3
// review scaffolding) into real production utilities for Milestone 4 — see
// MIGRATION_PLAN.md § M3 implementation notes for the "should this become
// real?" call this resolves. Neither concept is stored in front matter
// (see `src/content.config.ts`); both are always derived at build time.

const WORDS_PER_MINUTE = 200;

/**
 * A rough reading-time estimate in whole minutes (minimum 1), derived from the
 * raw MDX body word count. Does not attempt to weight code blocks (readers
 * scan, not read, code) — good enough for a byline, not a precision metric.
 */
export function readingTimeMinutes(body: string | undefined): number {
  if (!body) return 1;
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/**
 * A naive plain-text teaser for post-list cards, derived from the raw MDX
 * body (front matter already stripped by the content loader). Strips MDX
 * import statements, component tags, fenced code blocks, and common
 * Markdown syntax, then truncates to `maxLength` characters at a word
 * boundary.
 */
export function excerptOf(body: string | undefined, maxLength = 180): string {
  if (!body) return '';

  const text = body
    .replace(/^import .+$/gm, ' ') // MDX import statements
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/`([^`]+)`/g, '$1') // inline code -> bare text
    .replace(/<[^>]+>/g, ' ') // MDX/HTML component tags
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links -> link text
    .replace(/^#{1,6}\s+/gm, '') // heading markers
    .replace(/[*_]{1,3}/g, '') // bold/italic markers
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
}
