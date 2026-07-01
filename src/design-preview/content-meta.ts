// Milestone 3 (design-direction review gate) helpers ONLY.
//
// These are presentational conveniences for the two design-preview directions
// (a naive excerpt + a rough reading-time estimate) so the preview pages read
// like a real blog rather than a bare content dump. Neither concept exists in
// the production content schema (see src/content.config.ts) or the M1/M2
// pipeline, and neither should be promoted into it without a deliberate
// decision at M4 — this file lives outside `src/utils` on purpose so it is
// obvious it is scaffolding for the review build, safe to delete alongside
// `src/design-preview/` and `src/pages/design-preview/` once a direction is
// chosen and M4 begins.

const WORDS_PER_MINUTE = 200;

/**
 * A rough reading-time estimate in whole minutes (minimum 1), derived from the
 * raw MDX body word count. Good enough for a design preview; not intended to
 * be precise (it does not account for code blocks reading slower, etc.).
 */
export function readingTimeMinutes(body: string | undefined): number {
  if (!body) return 1;
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/**
 * A naive plain-text teaser for the home-list preview cards, derived from the
 * raw MDX body (front matter already stripped by the content loader). Strips
 * MDX import statements, component tags, fenced code blocks, and common
 * Markdown syntax, then truncates to `maxLength` characters at a word
 * boundary. This is intentionally simple — it only needs to look plausible
 * next to real post titles/dates, not be publication-quality copy.
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
