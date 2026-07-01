import type { APIContext } from 'astro';
import { getSortedPosts, getPostDate, getPostUrl } from '../utils/posts';

// JSON Feed 1.1 (https://jsonfeed.org/version/1.1) at the legacy path `/feed.json`.
export async function GET(context: APIContext) {
  const site = (context.site ?? new URL('https://blog.adrianhall.uk')).toString().replace(/\/$/, '');
  const posts = await getSortedPosts();

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'Because Developers are Awesome',
    home_page_url: `${site}/`,
    feed_url: `${site}/feed.json`,
    description: 'Musings about cloud development.',
    authors: [{ name: 'Adrian Hall' }],
    items: posts.map((post) => ({
      id: `${site}${getPostUrl(post)}`,
      url: `${site}${getPostUrl(post)}`,
      title: post.data.title,
      date_published: getPostDate(post).toISOString(),
      tags: [...post.data.categories, ...post.data.tags],
    })),
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: { 'Content-Type': 'application/feed+json; charset=utf-8' },
  });
}
