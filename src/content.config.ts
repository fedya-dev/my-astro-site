import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string().min(1),
    seoTitle: z.string().optional(),
    translationKey: z.string().optional(),
    description: z.string().min(1),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.string().default('General'),
    tags: z.array(z.string()).default([]),
    lang: z.enum(['bg', 'en']).default('bg'),
    draft: z.boolean().default(false),
    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),
    author: z.string().optional(),
  }),
});

export const collections = { blog };
