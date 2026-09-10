# Notion setup

Content is synced **locally** with `npm run sync`. The browser only loads generated JSON/HTML — never your Notion token.

## 1. Create an integration

1. Open [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Create an internal integration (e.g. `abkaaar-site`)
3. Copy the secret → `NOTION_TOKEN`

## 2. Create three databases

Share each with the integration (**⋯ → Connections**).

### Projects

| Property | Type | Notes |
|----------|------|--------|
| Name | Title | Required |
| Description | Rich text | Short blurb |
| Tags | Multi-select | Bullet list |
| Site URL | URL | Live link |
| Github URL | URL | Optional (or `GitHub URL`) |
| Image | Files | Or use Image URL |
| Image URL | URL | e.g. `Images/foodma.png` |
| Featured | Checkbox | Unchecked → “More Projects” |
| Order | Number | Sort ascending |
| Published | Checkbox | Must be checked |

### Blogs

| Property | Type | Notes |
|----------|------|--------|
| Name | Title | |
| Slug | Rich text | URL segment |
| Summary | Rich text | |
| Date | Date | |
| Cover | Files | Optional |
| Published | Checkbox | Must be checked |

Page body = Notion blocks (synced into `blog/<slug>/index.html`).

### Books

| Property | Type | Notes |
|----------|------|--------|
| Name | Title | |
| Author | Rich text | |
| Status | Select | Reading / Finished / Want to read |
| Cover | Files | Optional |
| Notes | Rich text | Optional |
| Order | Number | |
| Published | Checkbox | Must be checked |

## 3. Database IDs

From the database URL path (not `?v=`). Put them in `.env`:

```
NOTION_TOKEN=secret_...
NOTION_PROJECTS_DB_ID=...
NOTION_BLOGS_DB_ID=...
NOTION_BOOKS_DB_ID=...
```

## 4. Sync and preview

```bash
npm install
npm run sync
npm run dev
```

Outputs:

- `data/projects.json`
- `data/blogs.json`
- `data/books.json`
- `blog/<slug>/index.html` (for each published post)

If env vars are missing, sync writes seed projects from `data/seed-projects.json` and empty blogs/books.

## 5. Publish (GitHub Pages, no Actions)

1. Edit Notion → `npm run sync`
2. Commit `data/` and generated `blog/**`
3. `git push` to `main` on `abkaaar/abkaaar.github.io`
4. Repo **Settings → Pages → Source: Deploy from a branch → main / root**

Keep `.nojekyll` in the repo root so GitHub does not run Jekyll (Astro/`---` frontmatter previously broke branch deploys).

You do **not** need GitHub Actions or repository Notion secrets for this flow. Local `.env` is enough.

## 6. Seed projects

```bash
node scripts/seed-notion-projects.mjs
```

Or add rows manually — see `data/seed-projects.json` / `src` seed table historically used for Foodma, Awadoc, etc.

## Workflow

1. Edit Notion (toggle **Published**)
2. `npm run sync`
3. Commit + push
4. Site updates on [https://abkaaar.github.io/](https://abkaaar.github.io/)
