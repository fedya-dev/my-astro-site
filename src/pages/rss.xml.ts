import type { APIContext } from 'astro';
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import siteConfig from '../../site.config.json' with { type: 'json' };
export async function GET(context: APIContext) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft && data.lang === siteConfig.defaultLang)).sort((a,b) => b.data.pubDate.valueOf()-a.data.pubDate.valueOf());
  return rss({ title: siteConfig.defaultLang === 'bg' ? `Последни статии — ${siteConfig.title}` : `Latest articles — ${siteConfig.title}`, description: siteConfig.defaultLang === 'bg' ? `Последните публикации от ${siteConfig.title}` : `Latest articles from ${siteConfig.title}`, site: context.site ?? siteConfig.site, items: posts.map((post) => ({ title: post.data.title, description: post.data.description, pubDate: post.data.pubDate, link: `${siteConfig.defaultLang === 'en' ? '/en/' : '/'}blog/${post.id}/` })) });
}
