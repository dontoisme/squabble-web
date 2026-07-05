import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HelpSidebar } from '@/components/help/HelpSidebar';
import { getHelpTree } from '@/lib/help/content';

export const metadata: Metadata = {
  title: {
    template: '%s — Squabble Inn Field Guide',
    default: 'Squabble Inn Field Guide',
  },
  description:
    'The complete guide to Squabble Inn — your library, the player, guilds, quests, and everything in between.',
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tree = getHelpTree();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <nav className="flex items-center gap-6">
            <Link href="/" className="font-semibold text-lg">
              Squabble
            </Link>
            <Link
              href="/help"
              className="text-sm text-copper hover:text-foreground transition-colors"
            >
              Field Guide
            </Link>
          </nav>
          <Button asChild size="sm">
            <Link href="/library">Open App</Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 flex-1 flex flex-col md:flex-row md:gap-8">
        <HelpSidebar tree={tree} />
        <main className="min-w-0 flex-1 py-8">{children}</main>
      </div>

      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Squabble Inn — read together, spoil nothing.
        </div>
      </footer>
    </div>
  );
}
