const NOTION_VERSION = '2022-06-28';
const ALLOWED_ORIGINS = new Set([
  'https://abkaaar.github.io',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
]);

function corsHeaders(origin) {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://abkaaar.github.io';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function json(data, origin, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(origin),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  });
}

function error(message, origin, status = 500) {
  return json({ error: message }, origin, status);
}

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

function getTitle(page) {
  for (const prop of Object.values(page.properties || {})) {
    if (prop.type === 'title') return richTextToPlain(prop.title);
  }
  return 'Untitled';
}

function getRichTextProp(page, names) {
  for (const name of names) {
    const prop = page.properties?.[name];
    if (prop?.type === 'rich_text') return richTextToPlain(prop.rich_text);
  }
  return '';
}

function getUrlProp(page, names) {
  for (const name of names) {
    const prop = page.properties?.[name];
    if (prop?.type === 'url' && prop.url) return prop.url;
  }
  return null;
}

function getCheckboxProp(page, names) {
  for (const name of names) {
    const prop = page.properties?.[name];
    if (prop?.type === 'checkbox') return prop.checkbox;
  }
  return false;
}

function getNumberProp(page, names) {
  for (const name of names) {
    const prop = page.properties?.[name];
    if (prop?.type === 'number' && typeof prop.number === 'number') return prop.number;
  }
  return 0;
}

function getSelectProp(page, names) {
  for (const name of names) {
    const prop = page.properties?.[name];
    if (prop?.type === 'select' && prop.select?.name) return prop.select.name;
  }
  return '';
}

function getMultiSelectProp(page, names) {
  for (const name of names) {
    const prop = page.properties?.[name];
    if (prop?.type === 'multi_select') return prop.multi_select.map((t) => t.name);
  }
  return [];
}

function getDateProp(page, names) {
  for (const name of names) {
    const prop = page.properties?.[name];
    if (prop?.type === 'date' && prop.date?.start) return prop.date.start;
  }
  return null;
}

function getFileProp(page, names) {
  for (const name of names) {
    const prop = page.properties?.[name];
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

function notionHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };
}

async function queryAll(token, databaseId) {
  const pages = [];
  let cursor;
  do {
    const body = {
      filter: { property: 'Published', checkbox: { equals: true } },
      page_size: 100,
    };
    if (cursor) body.start_cursor = cursor;

    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: notionHeaders(token),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Notion query failed (${res.status}): ${text}`);
    }
    const data = await res.json();
    for (const result of data.results || []) {
      if (result.object === 'page' && result.properties) pages.push(result);
    }
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return pages;
}

async function getBlocks(token, blockId) {
  const blocks = [];
  let cursor;
  do {
    const url = new URL(`https://api.notion.com/v1/blocks/${blockId}/children`);
    url.searchParams.set('page_size', '100');
    if (cursor) url.searchParams.set('start_cursor', cursor);

    const res = await fetch(url.toString(), { headers: notionHeaders(token) });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Notion blocks failed (${res.status}): ${text}`);
    }
    const data = await res.json();
    for (const block of data.results || []) {
      if (block && block.type) blocks.push(block);
    }
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return blocks;
}

async function renderBlock(token, block) {
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
        const children = await getBlocks(token, block.id);
        return renderBlocks(token, children);
      }
      return '';
    }
  }
}

async function renderBlocks(token, blocks) {
  const parts = [];
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];
    if (block.type === 'bulleted_list_item') {
      const items = [];
      while (i < blocks.length && blocks[i].type === 'bulleted_list_item') {
        items.push(`<li>${richTextToHtml(blocks[i].bulleted_list_item.rich_text)}</li>`);
        i += 1;
      }
      parts.push(`<ul>${items.join('')}</ul>`);
      continue;
    }
    if (block.type === 'numbered_list_item') {
      const items = [];
      while (i < blocks.length && blocks[i].type === 'numbered_list_item') {
        items.push(`<li>${richTextToHtml(blocks[i].numbered_list_item.rich_text)}</li>`);
        i += 1;
      }
      parts.push(`<ol>${items.join('')}</ol>`);
      continue;
    }
    parts.push(await renderBlock(token, block));
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

function mapBlogMeta(page) {
  return {
    id: page.id,
    name: getTitle(page),
    slug: getRichTextProp(page, ['Slug']) || slugify(getTitle(page)),
    summary: getRichTextProp(page, ['Summary']),
    date: getDateProp(page, ['Date']),
    coverUrl:
      getFileProp(page, ['Cover', 'Image']) ??
      getUrlProp(page, ['Cover URL', 'Image URL']),
  };
}

function requireEnv(env) {
  const missing = [
    'NOTION_TOKEN',
    'NOTION_PROJECTS_DB_ID',
    'NOTION_BLOGS_DB_ID',
    'NOTION_BOOKS_DB_ID',
  ].filter((key) => !env[key]);
  return missing;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'GET') {
      return error('Method not allowed', origin, 405);
    }

    const missing = requireEnv(env);
    if (missing.length) {
      return error(`Missing secrets: ${missing.join(', ')}`, origin, 500);
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    try {
      if (path === '/projects') {
        const pages = await queryAll(env.NOTION_TOKEN, env.NOTION_PROJECTS_DB_ID);
        const projects = pages
          .map(mapProject)
          .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
        return json(projects, origin);
      }

      if (path === '/books') {
        const pages = await queryAll(env.NOTION_TOKEN, env.NOTION_BOOKS_DB_ID);
        const books = pages
          .map(mapBook)
          .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
        return json(books, origin);
      }

      if (path === '/blogs') {
        const pages = await queryAll(env.NOTION_TOKEN, env.NOTION_BLOGS_DB_ID);
        const posts = pages
          .map(mapBlogMeta)
          .sort((a, b) => {
            const da = a.date ? Date.parse(a.date) : 0;
            const db = b.date ? Date.parse(b.date) : 0;
            return db - da;
          });
        return json(posts, origin);
      }

      const blogMatch = path.match(/^\/blogs\/([^/]+)$/);
      if (blogMatch) {
        const slug = decodeURIComponent(blogMatch[1]);
        const pages = await queryAll(env.NOTION_TOKEN, env.NOTION_BLOGS_DB_ID);
        const page = pages.find((p) => {
          const meta = mapBlogMeta(p);
          return meta.slug === slug;
        });
        if (!page) return error('Post not found', origin, 404);
        const meta = mapBlogMeta(page);
        const blocks = await getBlocks(env.NOTION_TOKEN, page.id);
        return json(
          {
            ...meta,
            contentHtml: await renderBlocks(env.NOTION_TOKEN, blocks),
          },
          origin,
        );
      }

      if (path === '/' || path === '/health') {
        return json({ ok: true, service: 'abkaaar-notion' }, origin);
      }

      return error('Not found', origin, 404);
    } catch (err) {
      return error(err.message || 'Server error', origin, 500);
    }
  },
};
