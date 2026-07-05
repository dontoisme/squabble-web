import Link from 'next/link';
import {
  BookOpen,
  Compass,
  Headphones,
  Library,
  LifeBuoy,
  Server,
  Settings,
  Shield,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { getAllPages, getHelpTree } from '@/lib/help/content';
import type { HelpPageMeta } from '@/lib/help/types';

const sectionIcons: Record<string, LucideIcon> = {
  compass: Compass,
  library: Library,
  server: Server,
  headphones: Headphones,
  shield: Shield,
  trophy: Trophy,
  settings: Settings,
  'life-buoy': LifeBuoy,
};

const MAX_VISIBLE_PAGES = 5;

// Curated entry points surfaced above the section grid — the fastest paths
// for a brand-new adventurer. Titles/descriptions are pulled live from each
// page's frontmatter, so this only needs to stay in sync on href.
const POPULAR_HREFS = [
  '/help/getting-started/quick-start',
  '/help/guilds/create-or-join',
  '/help/player/timestamp-comments',
  '/help/library/importing-books',
];

export default function HelpHomePage() {
  const tree = getHelpTree();
  const allPages = getAllPages();

  const popularPages = POPULAR_HREFS.map((href) =>
    allPages.find((page) => page.href === href)
  ).filter((page): page is HelpPageMeta => page !== undefined);

  const iconForSection = (sectionDir: string): LucideIcon => {
    const section = tree.find((s) => s.dir === sectionDir);
    return sectionIcons[section?.icon ?? ''] ?? BookOpen;
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-12">
        <p className="mb-2 text-sm font-medium uppercase tracking-wider text-copper">
          Squabble Inn
        </p>
        <h1 className="mb-3 text-4xl font-bold text-foreground">
          The Field Guide
        </h1>
        <p className="text-lg text-muted-foreground">
          Everything an adventurer needs to know — building your library,
          mastering the player, and questing with your guild.
        </p>
      </div>

      {popularPages.length > 0 ? (
        <div className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-copper">
            Start here
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popularPages.map((page) => {
              const IconComponent = iconForSection(page.section);
              return (
                <Link
                  key={page.href}
                  href={page.href}
                  className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-copper/50"
                >
                  <IconComponent
                    className="mb-2 h-5 w-5 text-copper"
                    aria-hidden
                  />
                  <h3 className="mb-1 text-sm font-semibold text-foreground transition-colors group-hover:text-copper">
                    {page.title}
                  </h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {page.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {tree.map((section) => {
          const IconComponent = sectionIcons[section.icon ?? ''] ?? BookOpen;
          const visiblePages = section.pages.slice(0, MAX_VISIBLE_PAGES);
          const hasMore = section.pages.length > MAX_VISIBLE_PAGES;
          return (
            <div
              key={section.dir}
              className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-copper/50"
            >
              <div className="mb-2 flex items-center gap-2">
                <IconComponent className="h-5 w-5 text-copper" aria-hidden />
                <h2 className="font-semibold text-foreground">
                  {section.title}
                </h2>
              </div>
              {section.description ? (
                <p className="mb-3 text-sm text-muted-foreground">
                  {section.description}
                </p>
              ) : null}
              <ul className="space-y-1">
                {visiblePages.map((page) => (
                  <li key={page.href}>
                    <Link
                      href={page.href}
                      className="text-sm text-muted-foreground hover:text-copper transition-colors"
                    >
                      {page.title}
                    </Link>
                  </li>
                ))}
              </ul>
              {hasMore ? (
                <Link
                  href={section.pages[0].href}
                  className="mt-2 inline-block text-sm font-medium text-copper transition-colors hover:text-foreground"
                >
                  View all {section.pages.length} articles →
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
