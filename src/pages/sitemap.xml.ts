import type { APIContext } from 'astro';
import { getSortedPosts, getPostDate, getPostUrl } from '../utils/posts';
import { getTags, getCategories } from '../utils/taxonomy';

// Custom sitemap at the exact legacy path `/sitemap.xml`.
// (The @astrojs/sitemap integration emits `/sitemap-index.xml`, which would
// break the URL contract, so we generate it ourselves.)
export async function GET(context: APIContext) {
  const site = (context.site ?? new URL('https://blog.adrianhall.uk')).toString().replace(/\/$/, '');
  const posts = await getSortedPosts();

  const staticPaths = ['/', '/posts/', '/tags/', '/categories/', '/privacy.html'];
  const taxonomyPaths = [
    ...getTags(posts).map((t) => `/tags/${t.slug}/`),
    ...getCategories(posts).map((c) => `/categories/${c.slug}/`),
  ];

  const urls: { loc: string; lastmod?: string }[] = [
    ...staticPaths.map((p) => ({ loc: `${site}${p}` })),
    ...taxonomyPaths.map((p) => ({ loc: `${site}${p}` })),
    ...posts.map((post) => ({
      loc: `${site}${getPostUrl(post)}`,
      lastmod: getPostDate(post).toISOString(),
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, lastmod }) =>
      `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`,
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
