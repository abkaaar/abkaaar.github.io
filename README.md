# abkaaar

Personal portfolio for Abubakar Abdullahi — Astro site with **Notion** as the CMS and **GitHub Pages** hosting.

## Stack

- [Astro](https://astro.build) (static output)
- Notion API (projects, blogs, books at build time)
- GitHub Actions → GitHub Pages

## Develop

```bash
npm install
cp .env.example .env   # add Notion credentials when ready
npm run dev
```

Without Notion env vars, the homepage falls back to seed projects in `src/lib/seed.ts`.

## Build

```bash
npm run build
npm run preview
```

Configured for `https://abkaaar.github.io/` (`base: '/'`). The GitHub remote is `abkaaar/abkaaar.github.io`.

## Notion + deploy

See [NOTION.md](./NOTION.md) for database schema, secrets, seeding projects, and GitHub Pages setup.
