import type { APIRoute } from 'astro';
import siteConfig from '../../site.config.json' with { type: 'json' };
export const GET: APIRoute = () => new Response(`User-agent: *
Allow: /

Sitemap: ${siteConfig.site.replace(/\/$/, '')}/sitemap-index.xml
`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
