// Shared constants for the Milestone 3 design-direction review pages.
// Delete alongside the rest of `src/design-preview/` once M4 begins.

/**
 * The one real post rendered in full under every direction
 * (`/design-preview/{a,b,c}/post.html`). Chosen because it has multiple
 * multi-language code blocks, two `<Notice>` callouts, inline code, a
 * cross-post-free prose flow, and a "further reading" list — enough surface
 * area to judge each direction without being unreasonably long.
 */
export const SHOWCASE_POST_ID = '2024/2024-09-03-aspnetcore-options';

/** How many recent posts to show on the home-list preview pages. */
export const HOME_PREVIEW_COUNT = 8;

/**
 * Every design direction under review, in display order. Each `PreviewLayout*`
 * uses this to render a switcher linking to the *other* directions' equivalent
 * page (home ↔ home, post ↔ post) instead of a hard-coded single counterpart.
 */
export const DIRECTIONS = [
  { key: 'a', label: 'A — Restrained editorial' },
  { key: 'b', label: 'B — Technical / developer' },
  { key: 'c', label: 'C — Editorial spacing, developer palette' },
] as const;

export type DirectionKey = (typeof DIRECTIONS)[number]['key'];

/** Build the href for `direction`'s equivalent of the current page. */
export function directionHref(direction: DirectionKey, page: 'home' | 'post'): string {
  return page === 'post' ? `/design-preview/${direction}/post.html` : `/design-preview/${direction}/`;
}
