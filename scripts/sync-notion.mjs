/**
 * Sync Notion databases → data/*.json + blog/<slug>/index.html
 * Usage: npm run sync
 */
import { Client } from '@notionhq/client';
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
  existsSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv() {
  const envPath = join(root, '.env');
  const env = { ...process.env };
  if (!existsSync(envPath)) return env;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i === -1) continue;
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return env;
}

const env = loadEnv();
const token = env.NOTION_TOKEN;
const projectsDb = env.NOTION_PROJECTS_DB_ID;
const blogsDb = env.NOTION_BLOGS_DB_ID;
const booksDb = env.NOTION_BOOKS_DB_ID;
const hasNotion = Boolean(token && projectsDb && blogsDb && booksDb);

function richTextToPlain(items) {
  if (!items?.length) return '';
  return items.map((item) => item.plain_text).join('');
}

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function richTextToHtml(items) {
  if (!items?.length) return '';
  return items
    .map((item) => {
      let html = escapeHtml(item.plain_text);
      if (item.annotations?.code) html = `<code>${html}</code>`;
      if (item.annotations?.bold) html = `<strong>${html}</strong>`;
      if (item.annotations?.italic) html = `<em>${html}</em>`;
      if (item.annotations?.strikethrough) html = `<s>${html}</s>`;
      if (item.annotations?.underline) html = `<u>${html}</u>`;
      if (item.href) {
        html = `<a href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer">${html}</a>`;
      }
      return html;
    })
    .join('');
}

function isFullPage(page) {
  return page?.object === 'page' && page.properties;
}

function isFullBlock(block) {
  return Boolean(block && 'type' in block);
}

function getTitle(page) {
  for (const prop of Object.values(page.properties)) {
    if (prop.type === 'title') return richTextToPlain(prop.title);
  }
  return 'Untitled';
}

function getRichTextProp(page, names) {
  for (const name of names) {
    const prop = page.properties[name];
    if (prop?.type === 'rich_text') return richTextToPlain(prop.rich_text);
  }
  return '';
}

function getUrlProp(page, names) {
  for (const name of names) {
    const prop = page.properties[name];
    if (prop?.type === 'url' && prop.url) return prop.url;
  }
  return null;
}

function getCheckboxProp(page, names) {
  for (const name of names) {
    const prop = page.properties[name];
    if (prop?.type === 'checkbox') return prop.checkbox;
  }
  return false;
}

function getNumberProp(page, names) {
  for (const name of names) {
    const prop = page.properties[name];
    if (prop?.type === 'number' && typeof prop.number === 'number') return prop.number;
  }
  return 0;
}

function getSelectProp(page, names) {
  for (const name of names) {
    const prop = page.properties[name];
    if (prop?.type === 'select' && prop.select?.name) return prop.select.name;
  }
  return '';
}

function getMultiSelectProp(page, names) {
  for (const name of names) {
    const prop = page.properties[name];
    if (prop?.type === 'multi_select') return prop.multi_select.map((t) => t.name);
  }
  return [];
}

function getDateProp(page, names) {
  for (const name of names) {
    const prop = page.properties[name];
    if (prop?.type === 'date' && prop.date?.start) return prop.date.start;
  }
  return null;
}

function getFileProp(page, names) {
  for (const name of names) {
    const prop = page.properties[name];
    if (prop?.type === 'files' && prop.files.length > 0) {
      const file = prop.files[0];
      if (file.type === 'external') return file.external.url;
      if (file.type === 'file') return file.file.url;
    }
  }
  return null;
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function queryAll(client, databaseId) {
  const pages = [];
  let cursor;
  do {
    const response = await client.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      filter: {
        property: 'Published',
        checkbox: { equals: true },
      },
    });
    for (const result of response.results) {
      if (isFullPage(result)) pages.push(result);
    }
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);
  return pages;
}

async function getBlocks(client, blockId) {
  const blocks = [];
  let cursor;
  do {
    const response = await client.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
    });
    for (const block of response.results) {
      if (isFullBlock(block)) blocks.push(block);
    }
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);
  return blocks;
}

async function renderBlock(client, block) {
  switch (block.type) {
    case 'paragraph':
      return `<p>${richTextToHtml(block.paragraph.rich_text)}</p>`;
    case 'heading_1':
      return `<h2>${richTextToHtml(block.heading_1.rich_text)}</h2>`;
    case 'heading_2':
      return `<h3>${richTextToHtml(block.heading_2.rich_text)}</h3>`;
    case 'heading_3':
      return `<h4>${richTextToHtml(block.heading_3.rich_text)}</h4>`;
    case 'quote':
      return `<blockquote>${richTextToHtml(block.quote.rich_text)}</blockquote>`;
    case 'code':
      return `<pre><code>${escapeHtml(richTextToPlain(block.code.rich_text))}</code></pre>`;
    case 'divider':
      return '<hr />';
    case 'image': {
      const src =
        block.image.type === 'external'
          ? block.image.external.url
          : block.image.type === 'file'
            ? block.image.file.url
            : '';
      const caption = richTextToPlain(block.image.caption);
      return src
        ? `<figure><img src="${escapeHtml(src)}" alt="${escapeHtml(caption)}" />${
            caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''
          }</figure>`
        : '';
    }
    case 'to_do': {
      const checked = block.to_do.checked ? ' checked' : '';
      return `<p><input type="checkbox" disabled${checked} /> ${richTextToHtml(block.to_do.rich_text)}</p>`;
    }
    default: {
      if (block.has_children) {
        const children = await getBlocks(client, block.id);
        return renderBlocks(client, children);
      }
      return '';
    }
  }
}

async function renderBlocks(client, blocks) {
  const parts = [];
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];
    if (block.type === 'bulleted_list_item') {
      const items = [];
      while (i < blocks.length && blocks[i].type === 'bulleted_list_item') {
        items.push(
          `<li>${richTextToHtml(blocks[i].bulleted_list_item.rich_text)}</li>`,
        );
        i += 1;
      }
      parts.push(`<ul>${items.join('')}</ul>`);
      continue;
    }
    if (block.type === 'numbered_list_item') {
      const items = [];
      while (i < blocks.length && blocks[i].type === 'numbered_list_item') {
        items.push(
          `<li>${richTextToHtml(blocks[i].numbered_list_item.rich_text)}</li>`,
        );
        i += 1;
      }
      parts.push(`<ol>${items.join('')}</ol>`);
      continue;
    }
    parts.push(await renderBlock(client, block));
    i += 1;
  }
  return parts.join('\n');
}

function mapProject(page) {
  const imageFromFiles = getFileProp(page, ['Image', 'Cover']);
  const imageFromUrl = getUrlProp(page, ['Image URL']);
  return {
    id: page.id,
    name: getTitle(page),
    description: getRichTextProp(page, ['Description']),
    tags: getMultiSelectProp(page, ['Tags']),
    siteUrl: getUrlProp(page, ['Site URL', 'URL']),
    githubUrl: getUrlProp(page, ['Github URL', 'GitHub URL']),
    imageUrl: imageFromFiles ?? imageFromUrl,
    featured: getCheckboxProp(page, ['Featured']),
    order: getNumberProp(page, ['Order']),
  };
}

function mapBook(page) {
  const cover =
    getFileProp(page, ['Cover', 'Image']) ??
    getUrlProp(page, ['Cover URL', 'Image URL']);
  return {
    id: page.id,
    name: getTitle(page),
    author: getRichTextProp(page, ['Author']),
    status: getSelectProp(page, ['Status']) || 'Want to read',
    coverUrl: cover,
    notes: getRichTextProp(page, ['Notes']),
    order: getNumberProp(page, ['Order']),
  };
}

function writeJson(relPath, data) {
  const full = join(root, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log('Wrote', relPath, `(${Array.isArray(data) ? data.length : 1} items)`);
}

function formatDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function blogPostHtml(post) {
  const dateLabel = formatDate(post.date);
  const cover = post.coverUrl
    ? `<img src="${escapeHtml(post.coverUrl)}" alt="" style="margin-top: 2rem; max-width: 100%;" />`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="shortcut icon" type="image/png" href="/Images/favicon.png" />
    <title>${escapeHtml(post.name)} | Abubakar Abdullahi</title>
    <meta name="description" content="${escapeHtml(post.summary || post.name)}" />
    <link rel="stylesheet" href="/css/styles.css" />
  </head>
  <body>
    <header class="header header--compact" role="banner" id="top">
      <div class="row">
        <nav class="nav" role="navigation">
          <ul class="nav__items">
            <li class="nav__item"><a href="/#work" class="nav__link">Projects</a></li>
            <li class="nav__item"><a href="/blog/" class="nav__link">Blog</a></li>
            <li class="nav__item"><a href="/books/" class="nav__link">Books</a></li>
            <li class="nav__item"><a href="/#about" class="nav__link">About</a></li>
          </ul>
        </nav>
      </div>
    </header>
    <main role="main">
      <article class="page-header">
        <div class="row">
          <p class="content-meta"><a href="/blog/">Blog</a></p>
          <h1>${escapeHtml(post.name)}</h1>
          ${dateLabel ? `<p class="content-meta">${escapeHtml(dateLabel)}</p>` : ''}
          ${post.summary ? `<p>${escapeHtml(post.summary)}</p>` : ''}
          ${cover}
          <div class="prose">
${post.contentHtml}
          </div>
        </div>
      </article>
    </main>
    <footer role="contentinfo" class="footer">
      <div class="row">
        <ul class="footer__social-links">
          <li class="footer__social-link-item">
            <a href="https://wa.link/lfnnmf" title="Link to WhatsApp">
              <img src="/Images/whatsapp.svg" class="footer__social-image" alt="WhatsApp" />
            </a>
          </li>
          <li class="footer__social-link-item">
            <a href="https://twitter.com/abkaaar" title="Link to Twitter Profile">
              <img src="/Images/twitter.svg" class="footer__social-image" alt="Twitter" />
            </a>
          </li>
          <li class="footer__social-link-item">
            <a href="https://github.com/abkaaar/" title="Link to Github Profile">
              <img src="/Images/github.svg" class="footer__social-image" alt="Github" />
            </a>
          </li>
          <li class="footer__social-link-item">
            <a href="https://www.linkedin.com/in/abdullahi-abubakar-5a7965197/">
              <img src="/Images/linkedin.svg" class="footer__social-image" alt="Linkedin" />
            </a>
          </li>
        </ul>
      </div>
    </footer>
    <a href="#top" class="back-to-top" title="Back to Top">
      <img src="/Images/arrow-up.svg" alt="Back to Top" class="back-to-top__image" />
    </a>
    <script src="/js/main.js" defer></script>
  </body>
</html>
`;
}

async function syncFromNotion() {
  const client = new Client({ auth: token });

  const projectPages = await queryAll(client, projectsDb);
  const projects = projectPages
    .map(mapProject)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  writeJson('data/projects.json', projects);

  const bookPages = await queryAll(client, booksDb);
  const books = bookPages
    .map(mapBook)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  writeJson('data/books.json', books);

  const blogPages = await queryAll(client, blogsDb);
  const posts = [];
  for (const page of blogPages) {
    const slug = getRichTextProp(page, ['Slug']) || slugify(getTitle(page));
    const cover =
      getFileProp(page, ['Cover', 'Image']) ??
      getUrlProp(page, ['Cover URL', 'Image URL']);
    const blocks = await getBlocks(client, page.id);
    posts.push({
      id: page.id,
      name: getTitle(page),
      slug,
      summary: getRichTextProp(page, ['Summary']),
      date: getDateProp(page, ['Date']),
      coverUrl: cover,
      contentHtml: await renderBlocks(client, blocks),
    });
  }
  posts.sort((a, b) => {
    const da = a.date ? Date.parse(a.date) : 0;
    const db = b.date ? Date.parse(b.date) : 0;
    return db - da;
  });

  writeJson(
    'data/blogs.json',
    posts.map(({ id, name, slug, summary, date, coverUrl }) => ({
      id,
      name,
      slug,
      summary,
      date,
      coverUrl,
    })),
  );

  const blogRoot = join(root, 'blog');

  // Remove previously generated slug folders (keep blog/index.html)
  if (existsSync(blogRoot)) {
    for (const name of readdirSync(blogRoot)) {
      if (name === 'index.html') continue;
      const full = join(blogRoot, name);
      if (statSync(full).isDirectory()) {
        rmSync(full, { recursive: true, force: true });
      }
    }
  }

  for (const post of posts) {
    const out = join(blogRoot, post.slug, 'index.html');
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, blogPostHtml(post), 'utf8');
    console.log('Wrote blog/' + post.slug + '/index.html');
  }
}

function syncFromSeed() {
  console.warn('[sync] Missing Notion env — writing seed projects and empty blogs/books.');
  const seed = JSON.parse(
    readFileSync(join(root, 'data/seed-projects.json'), 'utf8'),
  );
  writeJson(
    'data/projects.json',
    seed.map((p, i) => ({
      id: `seed-${i}`,
      ...p,
    })),
  );
  writeJson('data/blogs.json', []);
  writeJson('data/books.json', []);
}

if (hasNotion) {
  await syncFromNotion();
} else {
  syncFromSeed();
}

console.log('Sync complete.');
