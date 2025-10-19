import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/org/',
    },
    sitemap: 'https://pwrnow.pl/sitemap.xml',
  }
}
