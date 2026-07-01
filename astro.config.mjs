// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import expressiveCode from 'astro-expressive-code';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';

// https://astro.build/config
export default defineConfig({
  // Canonical production URL (used for feeds, sitemap, canonical links).
  site: 'https://blog.adrianhall.uk',

  // The old Jekyll site emitted a MIXED on-disk layout that we must preserve:
  //   - posts + /privacy.html  -> literal `.html` FILES
  //   - everything else        -> trailing-slash DIRECTORIES (`.../index.html`)
  // `build.format: "preserve"` honours the shape of each source route:
  //   - `posts/[...slug].astro`      (file-style)  -> `/posts/<id>.html`
  //   - `tags/[tag]/index.astro`     (index-style) -> `/tags/<slug>/index.html`
  //   - `privacy.astro`              (file-style)  -> `/privacy.html`
  build: { format: 'preserve' },

  // `ignore` is the pragmatic choice for a mixed file/directory build.
  trailingSlash: 'ignore',

  // Expressive Code must be registered before MDX so its blocks work in .mdx too.
  // The line-numbers plugin renders the old Jekyll `linenos` / kramdown
  // `.line-numbers` blocks. It is OFF by default and opted into per code block
  // via a `showLineNumbers` meta flag (emitted by scripts/convert-content.mjs);
  // `startLineNumber=N` reproduces the old `data-start` offset.
  integrations: [
    expressiveCode({
      plugins: [pluginLineNumbers()],
      defaultProps: { showLineNumbers: false },
      // Default themes are `github-dark` + `github-light` (each theme's
      // `.type` is exactly 'dark' | 'light'). Selecting on `[data-theme='dark']`
      // / `[data-theme='light']` — instead of EC's default per-theme-name
      // selector — lets a single site-wide `data-theme` attribute (set by our
      // own manual light/dark toggle) drive BOTH the page chrome CSS and the
      // Expressive Code syntax theme together. `useDarkModeMediaQuery`
      // defaults to `true` for a dark+light theme pair, so pages still get the
      // right code theme from `prefers-color-scheme` before any toggle JS runs
      // or for users who never touch the toggle.
      themeCssSelector: (theme) => `[data-theme='${theme.type}']`,
    }),
    mdx(),
  ],
});
