export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';
export const appName = 'Open Agent Desktop Docs';

export const gitConfig = {
  repositoryUrl: process.env.NEXT_PUBLIC_REPOSITORY_URL?.replace(/\/$/, '') ?? '',
  branch: process.env.NEXT_PUBLIC_REPOSITORY_BRANCH ?? 'main',
};
