import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import matter from 'gray-matter';
import type {
  HelpPage,
  HelpPageMeta,
  HelpSection,
  HelpSectionMeta,
} from './types';

// Single source of truth for content location — one-line change when this
// app moves into the monorepo (docs/web-parity/01-monorepo-migration.md).
const CONTENT_DIR = path.join(process.cwd(), 'content', 'help');

function parsePage(sectionDir: string, file: string): HelpPage {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, sectionDir, file), 'utf8');
  const { data, content } = matter(raw);
  const pageSlug = file.replace(/\.mdx$/, '');
  return {
    title: typeof data.title === 'string' ? data.title : pageSlug,
    description: typeof data.description === 'string' ? data.description : '',
    order: typeof data.order === 'number' ? data.order : 999,
    slug: [sectionDir, pageSlug],
    href: `/help/${sectionDir}/${pageSlug}`,
    section: sectionDir,
    content,
  };
}

function toMeta(page: HelpPage): HelpPageMeta {
  const { content: _content, ...meta } = page;
  return meta;
}

/** All sections with page metadata, sorted by order. */
export const getHelpTree = cache((): HelpSection[] => {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const sections = fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dirPath = path.join(CONTENT_DIR, entry.name);
      let meta: HelpSectionMeta = { title: entry.name, order: 999 };
      const metaPath = path.join(dirPath, '_section.json');
      if (fs.existsSync(metaPath)) {
        meta = { ...meta, ...JSON.parse(fs.readFileSync(metaPath, 'utf8')) };
      }
      const pages = fs
        .readdirSync(dirPath)
        .filter((file) => file.endsWith('.mdx'))
        .map((file) => toMeta(parsePage(entry.name, file)))
        .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
      return { ...meta, dir: entry.name, pages };
    })
    .filter((section) => section.pages.length > 0)
    .sort((a, b) => a.order - b.order);

  return sections;
});

/** All pages (metadata only) in sidebar order — drives prev/next and sitemap. */
export const getAllPages = cache((): HelpPageMeta[] =>
  getHelpTree().flatMap((section) => section.pages)
);

export function getPageBySlug(slug: string[]): HelpPage | undefined {
  if (slug.length !== 2) return undefined;
  const [sectionDir, pageSlug] = slug;
  const filePath = path.join(CONTENT_DIR, sectionDir, `${pageSlug}.mdx`);
  if (
    !filePath.startsWith(CONTENT_DIR + path.sep) ||
    !fs.existsSync(filePath)
  ) {
    return undefined;
  }
  return parsePage(sectionDir, `${pageSlug}.mdx`);
}

export function getSectionForPage(page: HelpPageMeta): HelpSection | undefined {
  return getHelpTree().find((section) => section.dir === page.section);
}

export function getAdjacentPages(page: HelpPageMeta): {
  prev?: HelpPageMeta;
  next?: HelpPageMeta;
} {
  const pages = getAllPages();
  const index = pages.findIndex((p) => p.href === page.href);
  if (index === -1) return {};
  return {
    prev: index > 0 ? pages[index - 1] : undefined,
    next: index < pages.length - 1 ? pages[index + 1] : undefined,
  };
}
