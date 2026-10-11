import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const entries = posts.map((post) => ({
    title: post.data.title,
    description: post.data.description,
    lang: post.data.lang,
    url: `${post.data.lang === 'en' ? '/en' : ''}/blog/${post.id}/`,
    type: 'article',
  }));
  return new Response(JSON.stringify(entries), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
