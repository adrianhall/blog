import type { APIContext } from 'astro';

// robots.txt at the legacy path `/robots.txt`, advertising the sitemap.
export function GET(context: APIContext) {
  const site = (context.site ?? new URL('https://blog.adrianhall.uk')).toString().replace(/\/$/, '');
  const body = `User-agent: *
Allow: /

Sitemap: ${site}/sitemap.xml
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
