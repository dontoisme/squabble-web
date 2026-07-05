import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { HelpPageMeta, HelpSection } from '@/lib/help/types';

export function Breadcrumbs({
  section,
  page,
}: {
  section?: HelpSection;
  page: HelpPageMeta;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground"
    >
      <Link href="/help" className="hover:text-foreground transition-colors">
        Help
      </Link>
      {section ? (
        <>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <Link
            href={section.pages[0]?.href ?? '/help'}
            className="hover:text-foreground transition-colors"
          >
            {section.title}
          </Link>
        </>
      ) : null}
      <ChevronRight className="h-3.5 w-3.5" aria-hidden />
      <span className="text-foreground">{page.title}</span>
    </nav>
  );
}
