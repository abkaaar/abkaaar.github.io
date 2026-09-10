# abkaaar

Personal portfolio for Abubakar Abdullahi — **vanilla HTML/CSS/JS** with **Notion** as the CMS.

## How it works

1. Content lives in Notion (Projects, Blogs, Books).
2. Run `npm run sync` locally — writes `data/*.json` and `blog/<slug>/index.html`.
3. Commit and push to `main` — GitHub Pages serves the static files (no Actions build required).

The Notion token stays in `.env` on your machine. It is never shipped to the browser.

## Develop

```bash
npm install
cp .env.example .env   # fill Notion credentials
npm run sync
npm run dev            # http://localhost:4321
```

## Publish

```bash
npm run sync
git add data blog
git commit -m "Update content from Notion"
git push
```

Repo: [`abkaaar/abkaaar.github.io`](https://github.com/abkaaar/abkaaar.github.io)  
Site: [https://abkaaar.github.io/](https://abkaaar.github.io/)

**Pages settings:** Source → **Deploy from a branch** → `main` / `/` (with `.nojekyll` so Jekyll does not parse the site). Do not use the old Astro Actions workflow.

## Notion setup

See [NOTION.md](./NOTION.md).
