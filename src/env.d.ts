/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly NOTION_TOKEN?: string;
  readonly NOTION_PROJECTS_DB_ID?: string;
  readonly NOTION_BLOGS_DB_ID?: string;
  readonly NOTION_BOOKS_DB_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
