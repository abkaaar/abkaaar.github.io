# abkaaar

Personal portfolio for Abubakar Abdullahi — **vanilla HTML/CSS/JS** with **Notion** as the CMS, served live through a **Cloudflare Worker**.

## How it works

1. Content lives in Notion (Projects, Blogs, Books).
2. A Cloudflare Worker proxies Notion (token stays on Cloudflare).
3. The site on GitHub Pages fetches the Worker API in the browser.
4. Notion edits show up after refresh (Worker caches ~60 seconds).

Optional: `npm run sync` still writes `/data/*.json` as a local/offline fallback.

## Develop

```bash
npm install
cp .env.example .env   # for optional local sync
npm run sync           # optional fallback JSON
npm run dev            # http://localhost:4321
```

## Cloudflare Worker (live content)

```bash
cd workers/notion-api
npm install
npx wrangler login
npx wrangler secret put NOTION_TOKEN
npx wrangler secret put NOTION_PROJECTS_DB_ID
npx wrangler secret put NOTION_BLOGS_DB_ID
npx wrangler secret put NOTION_BOOKS_DB_ID
npx wrangler deploy
```

Copy the printed `*.workers.dev` URL into [`js/config.js`](js/config.js):

```js
window.NOTION_API_BASE = 'https://abkaaar-notion.YOUR_SUBDOMAIN.workers.dev';
```

Commit and push `js/config.js` to update GitHub Pages.

API routes: `/projects`, `/books`, `/blogs`, `/blogs/:slug`

## Publish site shell

```bash
git add -A
git commit -m "Update site"
git push
```

Repo: [`abkaaar/abkaaar.github.io`](https://github.com/abkaaar/abkaaar.github.io)  
Site: [https://abkaaar.github.io/](https://abkaaar.github.io/)

**Pages:** Deploy from a branch → `main` / `/` (with `.nojekyll`). No GitHub Actions required.

## Notion setup

See [NOTION.md](./NOTION.md).
