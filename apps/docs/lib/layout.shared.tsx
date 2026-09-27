import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { BrandTitle } from '@/components/brand-title';
import { gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <BrandTitle />,
      url: '/docs',
      transparentMode: 'none',
    },
    links: [
      ...(process.env.NEXT_PUBLIC_WEBSITE_URL ? [{ text: 'Website', url: process.env.NEXT_PUBLIC_WEBSITE_URL, external: true as const }] : []),
      { text: 'Changelog', url: '/docs/changelog' },
      ...(process.env.NEXT_PUBLIC_DOWNLOAD_URL ? [{ type: 'button' as const, text: 'Download', url: process.env.NEXT_PUBLIC_DOWNLOAD_URL, external: true as const }] : []),
    ],
    githubUrl: gitConfig.repositoryUrl || undefined,
  };
}
