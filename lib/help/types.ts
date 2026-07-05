export interface HelpFrontmatter {
  title: string;
  description: string;
  order: number;
}

/** Page metadata without the MDX body — safe to pass to client components. */
export interface HelpPageMeta extends HelpFrontmatter {
  /** [sectionDir, pageSlug] */
  slug: [string, string];
  href: string;
  section: string;
}

export interface HelpPage extends HelpPageMeta {
  /** Raw MDX body (frontmatter stripped). */
  content: string;
}

export interface HelpSectionMeta {
  title: string;
  order: number;
  icon?: string;
  description?: string;
}

export interface HelpSection extends HelpSectionMeta {
  dir: string;
  pages: HelpPageMeta[];
}
