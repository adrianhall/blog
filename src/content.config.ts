import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * `posts` collection.
 *
 * Source layout mirrors the old Jekyll `_posts/<year>/YYYY-MM-DD-slug.md`, so a
 * post's `id` is `<year>/YYYY-MM-DD-slug` (see src/utils/posts.ts for how the
 * canonical `.html` URL and date are derived from it).
 *
 * The glob pattern excludes any "includes" directory, dropping the two Jekyll
 * series-nav partials (under _posts/2024/includes/) — they are not posts and
 * lack a title. In M2 their contents get inlined into the referencing posts.
 *
 * Schema faithfulness notes (from the 141 source posts):
 *   - `date`  : only ~46 posts set it explicitly; the rest derive it from the
 *               filename, so it is OPTIONAL here.
 *   - `tags`  : 2 posts have none -> defaults to [].
 *   - `mermaid`: present on 6 posts.
 */
const posts = defineCollection({
  loader: glob({
    pattern: ['**/*.{md,mdx}', '!**/includes/**'],
    base: './src/content/posts',
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date().optional(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    mermaid: z.boolean().optional(),
  }),
});

export const collections = { posts };
