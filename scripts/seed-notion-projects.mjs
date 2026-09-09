/**
 * One-time seed: upsert portfolio projects into the Notion Projects database.
 * Usage: node scripts/seed-notion-projects.mjs
 */
import { Client } from '@notionhq/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv() {
  const text = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i === -1) continue;
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return env;
}

const env = loadEnv();
const token = env.NOTION_TOKEN;
const databaseId = env.NOTION_PROJECTS_DB_ID;

if (!token || !databaseId) {
  console.error('Missing NOTION_TOKEN or NOTION_PROJECTS_DB_ID in .env');
  process.exit(1);
}

const client = new Client({ auth: token });

const projects = JSON.parse(
  readFileSync(resolve(process.cwd(), 'data/seed-projects.json'), 'utf8'),
);

function rich(text) {
  return [{ text: { content: text ?? '' } }];
}

async function findPageByName(name) {
  const response = await client.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Name',
      title: { equals: name },
    },
  });
  return response.results[0] ?? null;
}

function buildProperties(project) {
  const props = {
    Name: { title: rich(project.name) },
    Description: { rich_text: rich(project.description) },
    Tags: {
      multi_select: (project.tags ?? []).map((name) => ({ name })),
    },
    Featured: { checkbox: Boolean(project.featured) },
    Order: { number: project.order ?? 0 },
    Published: { checkbox: true },
  };

  if (project.siteUrl) props['Site URL'] = { url: project.siteUrl };
  if (project.githubUrl) props['Github URL'] = { url: project.githubUrl };
  if (project.imageUrl) props['Image URL'] = { url: project.imageUrl };

  return props;
}

const db = await client.databases.retrieve({ database_id: databaseId });
const propNames = Object.keys(db.properties);
console.log('DB properties:', propNames.join(', '));

const required = [
  'Name',
  'Description',
  'Tags',
  'Site URL',
  'Image URL',
  'Featured',
  'Order',
  'Published',
];
const missing = required.filter((p) => !propNames.includes(p));
const hasGithub =
  propNames.includes('GitHub URL') || propNames.includes('Github URL');
if (missing.length || !hasGithub) {
  console.error(
    'Missing Notion properties (add them in Notion first):',
    [...missing, !hasGithub ? 'Github URL' : null].filter(Boolean).join(', '),
  );
  process.exit(1);
}

for (const project of projects) {
  const existing = await findPageByName(project.name);
  const properties = buildProperties(project);

  if (existing) {
    await client.pages.update({ page_id: existing.id, properties });
    console.log('Updated:', project.name);
  } else {
    await client.pages.create({
      parent: { database_id: databaseId },
      properties,
    });
    console.log('Created:', project.name);
  }
}

console.log('Done. Seeded', projects.length, 'projects with Published=true.');
