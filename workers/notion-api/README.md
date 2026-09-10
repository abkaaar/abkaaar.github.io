# abkaaar Notion API (Cloudflare Worker)

Read-only proxy from Notion → JSON for the portfolio site.

## Setup

```bash
npm install
npx wrangler login
npx wrangler secret put NOTION_TOKEN
npx wrangler secret put NOTION_PROJECTS_DB_ID
npx wrangler secret put NOTION_BLOGS_DB_ID
npx wrangler secret put NOTION_BOOKS_DB_ID
npx wrangler deploy
```

Local:

```bash
npx wrangler dev
```

Then temporarily set `js/config.js` to `http://127.0.0.1:8787` while testing.
