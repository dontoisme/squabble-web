'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { WaitlistForm } from '@/components/WaitlistForm';

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center text-center">
      <span className="text-4xl mb-4">{icon}</span>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/icon.png" alt="Squabble Inn" width={32} height={32} className="rounded-lg" />
            <span className="font-semibold text-lg text-foreground">Squabble Inn</span>
          </div>
          <nav className="flex items-center gap-3">
            {loading ? null : user ? (
              <Button asChild>
                <Link href="/library">Open App</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Log In</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-24 pb-20 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center mb-8">
            <Image
              src="/icon.png"
              alt="Squabble Inn"
              width={120}
              height={120}
              className="rounded-3xl shadow-2xl shadow-amber-900/20"
            />
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6 tracking-tight">
            Listen together.
            <br />
            <span className="text-copper">Quest together.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            Form a guild, pick your next audiobook, and leave hidden notes
            for your friends to discover as they listen.
          </p>
          <div className="flex flex-col items-center gap-4">
            {loading ? null : user ? (
              <Button size="lg" className="text-base px-8" asChild>
                <Link href="/library">Go to Library</Link>
              </Button>
            ) : (
              <>
                <p className="text-sm text-muted-foreground -mb-1">
                  Sign up for early access to the alpha.
                </p>
                <WaitlistForm source="hero" />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="container mx-auto px-4">
        <div className="border-t border-border" />
      </div>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-foreground mb-4">
          Your guild&apos;s audiobook companion
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
          Everything you need to read together, track progress, and share the experience.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <FeatureCard
            icon={"\u{1F3F0}"}
            title="Form a Guild"
            description="Create or join a guild with your friends. Pick audiobooks from the quest board and listen at your own pace."
          />
          <FeatureCard
            icon={"\u{1F4AC}"}
            title="Timestamped Notes"
            description="Leave comments tied to exact moments in the audiobook. Your guild discovers them when they reach the same spot."
          />
          <FeatureCard
            icon={"\u{1F3C6}"}
            title="Track Progress"
            description="See who's ahead, who's behind, and when the whole guild finishes a quest. Compete or just keep pace."
          />
        </div>
      </section>

      {/* Second row of features */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <FeatureCard
            icon={"\u{2694}\u{FE0F}"}
            title="Epic Quests"
            description="Tackle entire series together. Track progress across multiple books as your guild works through an epic adventure."
          />
          <FeatureCard
            icon={"\u{1F4DA}"}
            title="Book Search"
            description="Search thousands of audiobooks powered by Hardcover. Add them to your guild's quest board with one tap."
          />
          <FeatureCard
            icon={"\u{1F4F1}"}
            title="Mobile & Web"
            description="Listen on the go with the mobile app, catch up on discussions from your browser. Your guild travels with you."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-2xl mx-auto text-center bg-card border border-border rounded-3xl p-6 sm:p-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to start your quest?
          </h2>
          <p className="text-muted-foreground mb-8">
            Gather your party and pick your first audiobook.
          </p>
          {loading ? null : user ? (
            <Button size="lg" className="text-base px-8" asChild>
              <Link href="/library">Open Library</Link>
            </Button>
          ) : (
            <WaitlistForm source="bottom-cta" />
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Image src="/icon.png" alt="" width={20} height={20} className="rounded" />
            Squabble Inn
          </div>
          <p className="text-sm text-muted-foreground">
            A guild audiobook companion
          </p>
        </div>
      </footer>
    </div>
  );
}
