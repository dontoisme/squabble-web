'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Check, Copy } from 'lucide-react';

type Platform = 'ios' | 'android' | 'both';

const platformLabels: Record<Platform, string> = {
  ios: 'iOS',
  android: 'Android',
  both: 'Both',
};

interface WaitlistFormProps {
  source?: string;
  referredByGuildId?: string;
  referredGuildName?: string;
}

export function WaitlistForm({
  source = 'landing',
  referredByGuildId,
  referredGuildName,
}: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPlatformError, setShowPlatformError] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [guildName, setGuildName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function syncFromStorage() {
      if (localStorage.getItem('squabble:waitlist:submitted') === 'true') {
        setSubmitted(true);
        setInviteCode(localStorage.getItem('squabble:waitlist:inviteCode'));
        setGuildName(localStorage.getItem('squabble:waitlist:guildName'));
      }
    }

    syncFromStorage();

    // Sync across instances on the same page
    window.addEventListener('waitlist:submitted', syncFromStorage);
    return () => window.removeEventListener('waitlist:submitted', syncFromStorage);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!platform) {
      setShowPlatformError(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          platform,
          source,
          referredByGuildId,
        }),
      });

      if (!res.ok) {
        throw new Error('Request failed');
      }

      const data = await res.json();

      localStorage.setItem('squabble:waitlist:submitted', 'true');
      if (data.inviteCode) {
        localStorage.setItem('squabble:waitlist:inviteCode', data.inviteCode);
        setInviteCode(data.inviteCode);
      }
      if (data.guildName) {
        localStorage.setItem('squabble:waitlist:guildName', data.guildName);
        setGuildName(data.guildName);
      }
      setSubmitted(true);
      window.dispatchEvent(new Event('waitlist:submitted'));
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!inviteCode) return;
    const url = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (submitted) {
    // Referred user — simple confirmation
    if (referredByGuildId) {
      return (
        <div className="text-center space-y-2">
          <p className="text-copper font-medium text-lg">
            You&apos;re on the list!
          </p>
          {referredGuildName && (
            <p className="text-sm text-muted-foreground">
              You&apos;ll join <span className="text-foreground font-medium">{referredGuildName}</span> when we launch.
            </p>
          )}
        </div>
      );
    }

    // Direct signup — show invite link
    return (
      <div className="text-center space-y-3">
        <p className="text-copper font-medium text-lg">
          You&apos;re on the list!
        </p>
        {guildName && (
          <p className="text-sm text-muted-foreground">
            Your guild <span className="text-foreground font-medium">{guildName}</span> is ready.
          </p>
        )}
        {inviteCode && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Share this link to invite friends to your guild:
            </p>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-lg border border-copper/30 bg-copper/5 px-4 py-2 text-sm font-mono text-copper hover:bg-copper/10 transition-colors"
            >
              {typeof window !== 'undefined'
                ? `${window.location.origin}/invite/${inviteCode}`
                : `/invite/${inviteCode}`}
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>
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
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 h-11"
        />
        <Button type="submit" size="lg" disabled={loading} className="text-base px-6 w-full sm:w-auto">
          {loading ? 'Joining...' : 'Join the Alpha'}
        </Button>
      </div>
    </form>
  );
}
