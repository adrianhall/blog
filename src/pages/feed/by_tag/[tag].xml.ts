import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getSortedPosts, getPostDate, getPostUrl } from '../../../utils/posts';
import { getTags } from '../../../utils/taxonomy';

// Per-tag feeds at the legacy path `/feed/by_tag/<raw-tag>.xml`.
// NOTE: the filename uses the RAW front-matter tag value (e.g. `react_native`),
// not the slugified form used by the /tags/<slug>/ archive pages.
export async function getStaticPaths() {
  const posts = await getSortedPosts();
  return getTags(posts).map((tag) => ({
    params: { tag: tag.name },
    props: { tag },
  }));
}

export async function GET(context: APIContext) {
  const { tag } = context.props as {
    tag: { name: string; slug: string; posts: Awaited<ReturnType<typeof getSortedPosts>> };
  };
  return rss({
    title: `Because Developers are Awesome — ${tag.name}`,
    description: `Posts tagged “${tag.name}”.`,
    site: context.site ?? 'https://blog.adrianhall.uk',
    items: tag.posts.map((post) => ({
      title: post.data.title,
      link: getPostUrl(post),
      pubDate: getPostDate(post),
    })),
  });
}
