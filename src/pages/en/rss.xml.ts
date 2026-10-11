import type { APIContext } from 'astro';
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import siteConfig from '../../../site.config.json' with { type: 'json' };

export async function GET(context: APIContext) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft && data.lang === 'en'))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: `${siteConfig.title} — English`,
    description: `Latest English articles from ${siteConfig.title}`,
    site: context.site ?? siteConfig.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/en/blog/${post.id}/`,
    })),
  });
}
