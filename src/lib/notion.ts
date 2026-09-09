import { Client } from '@notionhq/client';
import type {
  BlockObjectResponse,
  PageObjectResponse,
  PartialBlockObjectResponse,
  QueryDatabaseResponse,
  RichTextItemResponse,
} from '@notionhq/client/build/src/api-endpoints';
import { seedProjects } from './seed';
import type { BlogPost, Book, Project } from './types';

function env(name: string): string | undefined {
  const value = import.meta.env[name] ?? process.env[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function hasNotionConfig(): boolean {
  return Boolean(
    env('NOTION_TOKEN') &&
      env('NOTION_PROJECTS_DB_ID') &&
      env('NOTION_BLOGS_DB_ID') &&
      env('NOTION_BOOKS_DB_ID'),
  );
}

function getClient(): Client {
  return new Client({ auth: env('NOTION_TOKEN') });
}

function richTextToPlain(items: RichTextItemResponse[] | undefined): string {
  if (!items?.length) return '';
  return items.map((item) => item.plain_text).join('');
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function richTextToHtml(items: RichTextItemResponse[] | undefined): string {
  if (!items?.length) return '';
  return items
    .map((item) => {
      let html = escapeHtml(item.plain_text);
      if (item.annotations.code) html = `<code>${html}</code>`;
      if (item.annotations.bold) html = `<strong>${html}</strong>`;
      if (item.annotations.italic) html = `<em>${html}</em>`;
      if (item.annotations.strikethrough) html = `<s>${html}</s>`;
      if (item.annotations.underline) html = `<u>${html}</u>`;
      if (item.href) {
        html = `<a href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer">${html}</a>`;
      }
      return html;
    })
    .join('');
}

function isFullPage(page: PageObjectResponse | { object: string }): page is PageObjectResponse {
  return page.object === 'page' && 'properties' in page;
}

function isFullBlock(
  block: BlockObjectResponse | PartialBlockObjectResponse,
): block is BlockObjectResponse {
  return 'type' in block;
}

function getTitle(page: PageObjectResponse): string {
  const props = page.properties;
  for (const key of Object.keys(props)) {
    const prop = props[key];
    if (prop.type === 'title') return richTextToPlain(prop.title);
  }
  return 'Untitled';
}

function getRichTextProp(page: PageObjectResponse, names: string[]): string {
  for (const name of names) {
    const prop = page.properties[name];
    if (prop?.type === 'rich_text') return richTextToPlain(prop.rich_text);
  }
  return '';
}

function getUrlProp(page: PageObjectResponse, names: string[]): string | null {
  for (const name of names) {
    const prop = page.properties[name];
    if (prop?.type === 'url' && prop.url) return prop.url;
  }
  return null;
}

function getCheckboxProp(page: PageObjectResponse, names: string[]): boolean {
  for (const name of names) {
    const prop = page.properties[name];
    if (prop?.type === 'checkbox') return prop.checkbox;
  }
  return false;
}

function getNumberProp(page: PageObjectResponse, names: string[]): number {
  for (const name of names) {
    const prop = page.properties[name];
    if (prop?.type === 'number' && typeof prop.number === 'number') return prop.number;
  }
  return 0;
}

function getSelectProp(page: PageObjectResponse, names: string[]): string {
  for (const name of names) {
    const prop = page.properties[name];
    if (prop?.type === 'select' && prop.select?.name) return prop.select.name;
  }
  return '';
}

function getMultiSelectProp(page: PageObjectResponse, names: string[]): string[] {
  for (const name of names) {
    const prop = page.properties[name];
    if (prop?.type === 'multi_select') return prop.multi_select.map((t) => t.name);
  }
  return [];
}

function getDateProp(page: PageObjectResponse, names: string[]): string | null {
  for (const name of names) {
    const prop = page.properties[name];
    if (prop?.type === 'date' && prop.date?.start) return prop.date.start;
  }
  return null;
}

function getFileProp(page: PageObjectResponse, names: string[]): string | null {
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

function resolveAssetUrl(url: string | null, base: string): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const clean = url.replace(/^\//, '');
  return `${base}${clean}`;
}

async function queryAll(
  client: Client,
  databaseId: string,
): Promise<PageObjectResponse[]> {
  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const response: QueryDatabaseResponse = await client.databases.query({
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
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return pages;
}

async function getBlocks(client: Client, blockId: string): Promise<BlockObjectResponse[]> {
  const blocks: BlockObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const response = await client.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
    });
    for (const block of response.results) {
      if (isFullBlock(block)) blocks.push(block);
    }
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return blocks;
}

async function renderBlocks(client: Client, blocks: BlockObjectResponse[]): Promise<string> {
  const parts: string[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    if (block.type === 'bulleted_list_item') {
      const items: string[] = [];
      while (i < blocks.length && blocks[i].type === 'bulleted_list_item') {
        const b = blocks[i];
        if (b.type === 'bulleted_list_item') {
          items.push(`<li>${richTextToHtml(b.bulleted_list_item.rich_text)}</li>`);
        }
        i += 1;
      }
      parts.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    if (block.type === 'numbered_list_item') {
      const items: string[] = [];
      while (i < blocks.length && blocks[i].type === 'numbered_list_item') {
        const b = blocks[i];
        if (b.type === 'numbered_list_item') {
          items.push(`<li>${richTextToHtml(b.numbered_list_item.rich_text)}</li>`);
        }
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

async function renderBlock(client: Client, block: BlockObjectResponse): Promise<string> {
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

function mapProject(page: PageObjectResponse, base: string): Project {
  const imageFromFiles = getFileProp(page, ['Image', 'Cover']);
  const imageFromUrl = getUrlProp(page, ['Image URL']);
  return {
    id: page.id,
    name: getTitle(page),
    description: getRichTextProp(page, ['Description']),
    tags: getMultiSelectProp(page, ['Tags']),
    siteUrl: getUrlProp(page, ['Site URL', 'URL']),
    githubUrl: getUrlProp(page, ['GitHub URL', 'Github URL']),
    imageUrl: resolveAssetUrl(imageFromFiles ?? imageFromUrl, base),
    featured: getCheckboxProp(page, ['Featured']),
    order: getNumberProp(page, ['Order']),
  };
}

function mapBook(page: PageObjectResponse, base: string): Book {
  const cover = getFileProp(page, ['Cover', 'Image']) ?? getUrlProp(page, ['Cover URL', 'Image URL']);
  return {
    id: page.id,
    name: getTitle(page),
    author: getRichTextProp(page, ['Author']),
    status: getSelectProp(page, ['Status']) || 'Want to read',
    coverUrl: resolveAssetUrl(cover, base),
    notes: getRichTextProp(page, ['Notes']),
    order: getNumberProp(page, ['Order']),
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function getProjects(): Promise<Project[]> {
  const base = import.meta.env.BASE_URL;

  if (!hasNotionConfig()) {
    console.warn('[notion] Missing env vars — using seed projects.');
    return seedProjects.map((p) => ({
      ...p,
      imageUrl: resolveAssetUrl(p.imageUrl, base),
    }));
  }

  const client = getClient();
  const pages = await queryAll(client, env('NOTION_PROJECTS_DB_ID')!);
  return pages
    .map((page) => mapProject(page, base))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  if (!hasNotionConfig()) {
    console.warn('[notion] Missing env vars — returning empty blog list.');
    return [];
  }

  const base = import.meta.env.BASE_URL;
  const client = getClient();
  const pages = await queryAll(client, env('NOTION_BLOGS_DB_ID')!);
  const posts: BlogPost[] = [];

  for (const page of pages) {
    const slug = getRichTextProp(page, ['Slug']) || slugify(getTitle(page));
    const cover =
      getFileProp(page, ['Cover', 'Image']) ?? getUrlProp(page, ['Cover URL', 'Image URL']);
    const blocks = await getBlocks(client, page.id);
    posts.push({
      id: page.id,
      name: getTitle(page),
      slug,
      summary: getRichTextProp(page, ['Summary']),
      date: getDateProp(page, ['Date']),
      coverUrl: resolveAssetUrl(cover, base),
      contentHtml: await renderBlocks(client, blocks),
    });
  }

  return posts.sort((a, b) => {
    const da = a.date ? Date.parse(a.date) : 0;
    const db = b.date ? Date.parse(b.date) : 0;
    return db - da;
  });
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const posts = await getBlogPosts();
  return posts.find((post) => post.slug === slug);
}

export async function getBooks(): Promise<Book[]> {
  if (!hasNotionConfig()) {
    console.warn('[notion] Missing env vars — returning empty books list.');
    return [];
  }

  const base = import.meta.env.BASE_URL;
  const client = getClient();
  const pages = await queryAll(client, env('NOTION_BOOKS_DB_ID')!);
  return pages
    .map((page) => mapBook(page, base))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}
