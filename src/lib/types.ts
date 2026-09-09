export interface Project {
  id: string;
  name: string;
  description: string;
  tags: string[];
  siteUrl: string | null;
  githubUrl: string | null;
  imageUrl: string | null;
  featured: boolean;
  order: number;
}

export interface BlogPost {
  id: string;
  name: string;
  slug: string;
  summary: string;
  date: string | null;
  coverUrl: string | null;
  contentHtml: string;
}

export interface Book {
  id: string;
  name: string;
  author: string;
  status: string;
  coverUrl: string | null;
  notes: string;
  order: number;
}
