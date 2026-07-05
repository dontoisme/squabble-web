import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { HelpPageMeta } from '@/lib/help/types';

function PrevNextLink({
  page,
  direction,
}: {
  page: HelpPageMeta;
  direction: 'prev' | 'next';
}) {
  const isNext = direction === 'next';
  return (
    <Link
      href={page.href}
      className={`group flex flex-1 flex-col gap-1 rounded-lg border border-border bg-card p-4 transition-colors hover:border-copper ${
        isNext ? 'items-end text-right' : 'items-start'
      }`}
    >
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        {!isNext && <ArrowLeft className="h-3 w-3" aria-hidden />}
        {isNext ? 'Next' : 'Previous'}
        {isNext && <ArrowRight className="h-3 w-3" aria-hidden />}
      </span>
      <span className="text-sm font-medium text-foreground group-hover:text-copper transition-colors">
        {page.title}
      </span>
    </Link>
  );
}

export function PrevNext({
  prev,
  next,
}: {
  prev?: HelpPageMeta;
  next?: HelpPageMeta;
}) {
  if (!prev && !next) return null;
  return (
    <div className="mt-12 flex gap-4 border-t border-border pt-6">
      {prev ? <PrevNextLink page={prev} direction="prev" /> : <div className="flex-1" />}
      {next ? <PrevNextLink page={next} direction="next" /> : <div className="flex-1" />}
    </div>
  );
}
