# Notion + Cloudflare setup

Content is read **live** through a Cloudflare Worker. The browser never sees your Notion token.

Local `npm run sync` is optional (writes `/data/*.json` fallback if the Worker is down or `NOTION_API_BASE` is empty).

## 1. Notion integration and databases

1. Create an integration at [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Create Projects, Blogs, and Books databases (schemas below)
3. Share each database with the integration (**⋯ → Connections**)
4. Copy the token and three database IDs

### Projects

| Property | Type |
|----------|------|
| Name | Title |
| Description | Rich text |
| Tags | Multi-select |
| Site URL | URL |
| Github URL | URL (optional) |
| Image / Image URL | Files or URL |
| Featured | Checkbox |
| Order | Number |
| Published | Checkbox |

### Blogs

| Property | Type |
|----------|------|
| Name | Title |
| Slug | Rich text |
| Summary | Rich text |
| Date | Date |
| Cover | Files (optional) |
| Published | Checkbox |

### Books

| Property | Type |
|----------|------|
| Name | Title |
| Author | Rich text |
| Status | Select |
| Cover | Files (optional) |
| Notes | Rich text |
| Order | Number |
| Published | Checkbox |

## 2. Deploy the Cloudflare Worker

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

Worker routes:

- `GET /projects`
- `GET /books`
- `GET /blogs`
- `GET /blogs/:slug` (full post HTML)
- `GET /health`

CORS allows `https://abkaaar.github.io` and `http://localhost:4321`. Responses use `Cache-Control: public, max-age=60`.

## 3. Point the site at the Worker

Edit [`js/config.js`](js/config.js):

```js
window.NOTION_API_BASE = 'https://abkaaar-notion.YOUR_SUBDOMAIN.workers.dev';
```

Push to `main` so GitHub Pages picks it up.

## 4. Local env (optional sync fallback)

```
NOTION_TOKEN=secret_...
NOTION_PROJECTS_DB_ID=...
NOTION_BLOGS_DB_ID=...
NOTION_BOOKS_DB_ID=...
```

```bash
npm run sync   # writes data/*.json
npm run dev
```

## 5. Day-to-day

1. Edit Notion (toggle **Published**)
2. Wait up to ~60 seconds (Worker cache) or hard-refresh
3. Site updates — no `git push` required for content

Site shell/CSS/JS changes still need a normal commit + push to GitHub Pages.

## Seed projects (one-time)

```bash
node scripts/seed-notion-projects.mjs
```
