import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getSortedPosts, getPostDate, getPostUrl } from '../utils/posts';

// Site-wide RSS feed at the legacy path `/feed.xml`.
export async function GET(context: APIContext) {
  const posts = await getSortedPosts();
  return rss({
    title: 'Because Developers are Awesome',
    description: 'Musings about cloud development.',
    site: context.site ?? 'https://blog.adrianhall.uk',
    items: posts.map((post) => ({
      title: post.data.title,
      link: getPostUrl(post),
      pubDate: getPostDate(post),
      categories: [...post.data.categories, ...post.data.tags],
    })),
  });
}
