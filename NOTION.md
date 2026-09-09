# Notion setup

Content for projects, blogs, and books is loaded from Notion at **build time**. The site never calls Notion from the browser.

## 1. Create an integration

1. Open [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Create a new internal integration (e.g. `abkaaar-site`)
3. Copy the **Internal Integration Secret** → this is `NOTION_TOKEN`

## 2. Create three databases

Share each database with your integration (**⋯ → Connections → your integration**).

### Projects

| Property | Type | Notes |
|----------|------|--------|
| Name | Title | Required |
| Description | Rich text | Short blurb |
| Tags | Multi-select | Shown as bullet list |
| Site URL | URL | Live project link |
| GitHub URL | URL | Optional (name may be `Github URL`) |
| Image | Files | Or use Image URL |
| Image URL | URL | Optional path/URL (e.g. `Images/foodma.png` for files in `public/`) |
| Featured | Checkbox | Visible by default; unchecked goes under “More Projects” |
| Order | Number | Sort ascending |
| Published | Checkbox | Must be checked to appear |

### Blogs

| Property | Type | Notes |
|----------|------|--------|
| Name | Title | Post title |
| Slug | Rich text | URL segment, e.g. `my-first-post` |
| Summary | Rich text | List teaser |
| Date | Date | Sort / display |
| Cover | Files | Optional |
| Published | Checkbox | Must be checked |

Write the article body as normal Notion page content (headings, paragraphs, lists, images, code, quotes).

### Books

| Property | Type | Notes |
|----------|------|--------|
| Name | Title | Book title |
| Author | Rich text | |
| Status | Select | `Reading` / `Finished` / `Want to read` |
| Cover | Files | Optional |
| Notes | Rich text | Optional |
| Order | Number | Sort ascending |
| Published | Checkbox | Must be checked |

## 3. Database IDs

Open each database as a full page. The ID is the 32-character hex in the URL (with or without hyphens):

`https://www.notion.so/workspace/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=...`

## 4. Local env

Copy `.env.example` → `.env` and fill in:

```
NOTION_TOKEN=secret_...
NOTION_PROJECTS_DB_ID=...
NOTION_BLOGS_DB_ID=...
NOTION_BOOKS_DB_ID=...
```

Then:

```bash
npm install
npm run dev
```

If env vars are missing, the homepage uses **seed projects** from `src/lib/seed.ts` so the site still builds.

## 5. GitHub Pages secrets

Repo → **Settings → Secrets and variables → Actions**, add the same four names as above.

Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Push to `main` or run **Deploy to GitHub Pages** via **Actions → workflow_dispatch**.

Site URL: `https://abkaaar.github.io/`

## 6. Seed existing projects

Create one row per project below (or copy from `src/lib/seed.ts`). Set **Published** and **Featured** as noted. For images already in the repo, set **Image URL** to the path (e.g. `Images/foodma.png`).

Or run the one-time seeder (uses `.env` + `data/seed-projects.json`):

```bash
node scripts/seed-notion-projects.mjs
```

That creates/updates all 8 projects with **Published** checked.

| Name | Featured | Order | Site URL | GitHub URL | Image URL |
|------|----------|-------|----------|------------|-----------|
| Foodma | yes | 1 | https://foodma.co/ | | Images/foodma.png |
| Awadoc | yes | 2 | https://awadoc.com/ | | Images/awadoc.png |
| PangeaMedics | yes | 3 | https://pangeamedics.com | | Images/pangeamedics.png |
| Formlr | yes | 4 | https://formlr.onrender.com/ | https://github.com/abkaaar/formlr | Images/formlr.png |
| Scholardex | yes | 5 | https://scholardex.vercel.app | https://github.com/abkaaar/scholardex | Images/scholadex.png |
| Quizines | yes | 6 | https://quizines.vercel.app | https://github.com/abkaaar/Quiz-App | Images/quizines.png |
| Ecommerce | yes | 7 | https://ecommerce-nu-orpin.vercel.app | https://github.com/abkaaar/ecommerce | Images/ecommerce.png |
| AlloSpace | no | 8 | https://www.allospace.co | https://github.com/abkaaar/allospace | Images/allospace.png |

Copy descriptions and Tags from the previous homepage / `src/lib/seed.ts`.

## Workflow after setup

1. Edit Notion (toggle **Published** when ready)
2. Re-run the deploy workflow (or push a commit)
3. GitHub Pages updates
