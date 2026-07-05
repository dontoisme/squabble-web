import type { MetadataRoute } from 'next';
import { getAllPages } from '@/lib/help/content';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://squabble.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      changeFrequency: 'yearly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/signup`,
      changeFrequency: 'yearly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/help`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  const helpPages = getAllPages().map((page) => ({
    url: `${baseUrl}${page.href}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...helpPages];
}
