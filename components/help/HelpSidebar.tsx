'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Compass,
  Headphones,
  Library,
  LifeBuoy,
  Menu,
  Server,
  Settings,
  Shield,
  Trophy,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { HelpSection } from '@/lib/help/types';
import { cn } from '@/lib/utils';

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

function NavList({
  tree,
  pathname,
}: {
  tree: HelpSection[];
  pathname: string;
}) {
  return (
    <nav className="space-y-6">
      {tree.map((section) => {
        const IconComponent = sectionIcons[section.icon ?? ''] ?? BookOpen;
        return (
          <div key={section.dir}>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <IconComponent className="h-4 w-4 text-copper" aria-hidden />
              {section.title}
            </div>
            <ul className="space-y-0.5 border-l border-border">
              {section.pages.map((page) => {
                const active = pathname === page.href;
                return (
                  <li key={page.href}>
                    <Link
                      href={page.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'block -ml-px border-l py-1 pl-4 pr-2 text-sm transition-colors',
                        active
                          ? 'border-copper font-medium text-copper'
                          : 'border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground'
                      )}
                    >
                      {page.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function HelpSidebar({ tree }: { tree: HelpSection[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile: collapsible nav above the article */}
      <div className="md:hidden border-b border-border">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex w-full items-center gap-2 py-3 text-sm font-medium text-foreground"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          Browse the Field Guide
        </button>
        {open ? (
          <div className="pb-4">
            <NavList tree={tree} pathname={pathname} />
          </div>
        ) : null}
      </div>

      {/* Desktop: sticky sidebar */}
      <aside className="hidden md:block w-64 shrink-0 self-start sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto py-8 pr-6">
        <NavList tree={tree} pathname={pathname} />
      </aside>
    </>
  );
}
