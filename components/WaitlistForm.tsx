'use client';

import { useState, useEffect } from 'react';
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
  const [showPlatformError, setShowPlatformError] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('squabble:waitlist:submitted') === 'true') {
      setSubmitted(true);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!platform) {
      setShowPlatformError(true);
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
      localStorage.setItem('squabble:waitlist:submitted', 'true');
      setSubmitted(true);
    } catch (err: unknown) {
      // Rules only allow create, not update — permission-denied means duplicate
      if (err && typeof err === 'object' && 'code' in err && err.code === 'permission-denied') {
        localStorage.setItem('squabble:waitlist:submitted', 'true');
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
      <div className="flex flex-col items-center gap-1">
        <span className={`text-sm font-medium transition-colors ${
          showPlatformError ? 'text-red-400' : 'text-muted-foreground'
        }`}>
          I want early access on:
        </span>
        <div className={`flex items-center gap-2 rounded-lg px-2 py-1 transition-all ${
          showPlatformError ? 'ring-1 ring-red-400/60' : ''
        }`}>
          {(Object.keys(platformLabels) as Platform[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setPlatform(p); setShowPlatformError(false); }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
                platform === p
                  ? 'border-copper bg-copper/10 text-copper'
                  : 'border-border text-muted-foreground hover:border-copper/50'
              }`}
            >
              {platformLabels[p]}
            </button>
          ))}
        </div>
      </div>
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
    </form>
  );
}
