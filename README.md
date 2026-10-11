# My Astro Site

A bilingual static blog built with [Astro](https://astro.build/) and generated using [Astro Site Builder](https://github.com/fedya-dev/astro-site-builder).

## Features

- Bulgarian and English content
- Midnight and Ocean design themes
- Light and dark mode
- Responsive layout for desktop and mobile
- Blog articles, categories and tags
- Search functionality
- RSS feed and XML sitemap
- SEO-friendly static HTML
- Table of contents for articles
- Cloudflare deployment

## Requirements

- Node.js 22 or later
- npm

## Getting Started

Clone the repository and install the dependencies:

```bash
git clone https://github.com/fedya-dev/my-astro-site.git
cd my-astro-site
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in the terminal.

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run check` | Check the project |
| `npm run build` | Build the production site |
| `npm run preview` | Preview the production build |

The generated static files are placed in the `dist/` directory.

## Deployment

The site is deployed through Cloudflare using the GitHub repository.

- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`

Pushing changes to the production branch triggers a new deployment.

## License

No license has been specified yet. All rights are reserved unless a license is added to this repository.
