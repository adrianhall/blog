import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/** Posts per page for the paginated listings (matches the old Jekyll config). */
export const PER_PAGE = 10;

// Matches the trailing `YYYY-MM-DD-slug` portion of a post id such as
// `2017/2017-08-11-integrating-react-native-typescript-mobx`.
const FILENAME_DATE = /(?:^|\/)(\d{4})-(\d{2})-(\d{2})-.+$/;

/**
 * The canonical publish date. Prefers the explicit `date:` front-matter field
 * and falls back to the date embedded in the filename (93 posts rely on this).
 */
export function getPostDate(post: Post): Date {
  if (post.data.date) return post.data.date;
  const match = post.id.match(FILENAME_DATE);
  if (!match) {
    throw new Error(`Cannot determine a date for post "${post.id}".`);
  }
  const [, year, month, day] = match;
  return new Date(`${year}-${month}-${day}T00:00:00Z`);
}

/**
 * The canonical URL for a post, preserving the exact legacy path INCLUDING the
 * literal `.html` extension, e.g.
 *   /posts/2017/2017-08-11-integrating-react-native-typescript-mobx.html
 */
export function getPostUrl(post: Post): string {
  return `/posts/${post.id}.html`;
}

/** All posts, newest first. */
export async function getSortedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts');
  return posts.sort(
    (a, b) => getPostDate(b).getTime() - getPostDate(a).getTime(),
  );
}
