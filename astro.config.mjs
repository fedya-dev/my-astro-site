import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import siteConfig from './site.config.json' with { type: 'json' };

export default defineConfig({
  site: siteConfig.site,
  trailingSlash: 'always',
  integrations: [mdx(), sitemap()],
});
