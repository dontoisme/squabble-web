'use client';

import { useState } from 'react';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type Platform = 'ios' | 'android' | 'both';

const platformLabels: Record<Platform, string> = {
  ios: 'iOS',
  android: 'Android',
  both: 'Both',
};

export function WaitlistForm({ source = 'landing' }: { source?: string }) {
  const [email, setEmail] = useState('');
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!platform) {
      toast.error('Please select a platform.');
      return;
    }

    setLoading(true);
    try {
      const normalized = email.toLowerCase().trim();
      const hashBuffer = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(normalized),
      );
      const emailHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      await setDoc(doc(db, 'waitlist', emailHash), {
        email: normalized,
        platform,
        source,
        createdAt: Timestamp.now(),
      });
      setSubmitted(true);
    } catch (err: unknown) {
      // Rules only allow create, not update — permission-denied means duplicate
      if (err && typeof err === 'object' && 'code' in err && err.code === 'permission-denied') {
        setSubmitted(true);
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <p className="text-copper font-medium text-lg">
        You&apos;re on the list! We&apos;ll be in touch soon.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto flex flex-col gap-4">
      <div className="flex gap-2">
        <Input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 h-11"
        />
        <Button type="submit" size="lg" disabled={loading} className="text-base px-6">
          {loading ? 'Joining...' : 'Join the Alpha'}
        </Button>
      </div>
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm text-muted-foreground">Platform:</span>
        {(Object.keys(platformLabels) as Platform[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPlatform(p)}
            className={`rounded-full px-3 py-1 text-sm border transition-colors ${
              platform === p
                ? 'border-copper bg-copper/10 text-copper'
                : 'border-border text-muted-foreground hover:border-copper/50'
            }`}
          >
            {platformLabels[p]}
          </button>
        ))}
      </div>
    </form>
  );
}
