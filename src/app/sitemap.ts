import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.enhancedhr.ai';

    const staticPages = [
        '',
        '/academy',
        '/platform',
        '/ai-tools',
        '/collections',
        '/organizations',
        '/pricing',
        '/for-experts',
        '/demo',
        '/experts',
        '/features',
        '/privacy',
        '/terms',
    ];

    return staticPages.map((path) => ({
        url: `${baseUrl}${path}`,
        lastModified: new Date(),
        changeFrequency: path === '' ? 'weekly' : 'monthly',
        priority: path === '' ? 1 : path === '/pricing' ? 0.9 : 0.8,
    }));
}
