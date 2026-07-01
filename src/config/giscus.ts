// Giscus (https://giscus.app) configuration for the new repo's GitHub
// Discussions, per MIGRATION_PLAN.md handoff fact #3 ("GitHub repo
// Discussions ... backing store for Giscus comments").
//
// `repoId` and `categoryId` are NOT secrets (Giscus reads them client-side
// out of the rendered HTML on every visitor's page), but they are also not
// guessable strings — they were looked up once via the GitHub GraphQL API
// against the live repo/category rather than invented, so this file is
// authoritative:
//
//   gh api graphql -f query='
//     query { repository(owner: "adrianhall", name: "blog") {
//       id
//       discussionCategories(first: 20) { nodes { id name slug } }
//     } }'
//
// If the repo is ever renamed/recreated, or the "Comments" discussion
// category is deleted and recreated, re-run that query and update the IDs
// below — Giscus will silently fail to load (or attach to the wrong
// category) otherwise.
export const GISCUS_CONFIG = {
  repo: 'adrianhall/blog',
  repoId: 'R_kgDOTKdrYg',
  category: 'Comments',
  categoryId: 'DIC_kwDOTKdrYs4DAR7M',
  /** Maps each post's unique pathname (e.g. `/posts/2024/...html`) to its
   *  own discussion — stable across title edits, unlike `mapping: "title"`. */
  mapping: 'pathname',
} as const;
