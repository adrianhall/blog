import type { Post } from './posts';

/**
 * Slugify a tag/category value the same way the old Jekyll archive pages did:
 * lowercase and collapse underscores/whitespace to single hyphens. Examples:
 *   "react_native"          -> "react-native"
 *   "azure_active_directory"-> "azure-active-directory"
 *   "Cloud-Development"     -> "cloud-development"
 *   "Web"                   -> "web"
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, '-');
}

export interface TaxonomyGroup {
  /** The raw front-matter value (first seen). Used for per-tag FEED filenames. */
  name: string;
  /** The slugified value. Used for archive PAGE URLs (/tags/<slug>/). */
  slug: string;
  posts: Post[];
}

function group(posts: Post[], key: 'tags' | 'categories'): TaxonomyGroup[] {
  const bySlug = new Map<string, TaxonomyGroup>();
  for (const post of posts) {
    for (const raw of post.data[key]) {
      const slug = slugify(raw);
      let entry = bySlug.get(slug);
      if (!entry) {
        entry = { name: raw, slug, posts: [] };
        bySlug.set(slug, entry);
      }
      entry.posts.push(post);
    }
  }
  return [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * Distinct tags across the given posts (input should already be sorted newest
 * first so each group's `posts` inherit that order).
 *
 * NOTE on the slug/raw split: archive PAGES live at `/tags/<slug>/` while the
 * per-tag FEEDS live at `/feed/by_tag/<raw>.xml` (Jekyll used the raw tag string
 * for the feed filename). `slug` and `name` expose both forms.
 */
export const getTags = (posts: Post[]): TaxonomyGroup[] => group(posts, 'tags');

/** Distinct categories across the given posts. */
export const getCategories = (posts: Post[]): TaxonomyGroup[] =>
  group(posts, 'categories');
