import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: ['/', '/browse', '/native/', '/profile/'], disallow: ['/admin', '/profile/edit', '/matches', '/interests', '/chat'] },
    ],
    sitemap: 'https://nativematrimony.com/sitemap.xml',
  }
}
