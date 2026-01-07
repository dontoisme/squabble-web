'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Guild } from '@/lib/firebase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useGuild } from '@/hooks/useGuild';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const { user, loading: authLoading } = useAuth();
  const { joinGuild, hasGuild, guild: currentGuild } = useGuild();

  const [guild, setGuild] = useState<Guild | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch guild by invite code
  useEffect(() => {
    async function fetchGuild() {
      try {
        const guildsRef = collection(db, 'guilds');
        const q = query(guildsRef, where('inviteCode', '==', code));
        const snap = await getDocs(q);

        if (snap.empty) {
          setError('Invalid invite code');
        } else {
          setGuild({ id: snap.docs[0].id, ...snap.docs[0].data() } as Guild);
        }
      } catch (err) {
        console.error('Error fetching guild:', err);
        setError('Failed to load invite');
      } finally {
        setLoading(false);
      }
    }

    if (code) {
      fetchGuild();
    }
  }, [code]);

  const handleJoin = async () => {
    if (!guild) return;

    setJoining(true);
    try {
      await joinGuild(code);
      toast.success(`Joined ${guild.name}!`);
      router.push('/guild');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join guild';
      toast.error(message);
    } finally {
      setJoining(false);
    }
  };

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error || !guild) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h1 className="text-xl font-semibold mb-2">Invalid Invite</h1>
            <p className="text-muted-foreground mb-4">
              This invite link is invalid or has expired.
            </p>
            <Link href="/">
              <Button variant="outline">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already in this guild
  if (hasGuild && currentGuild?.id === guild.id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <Users className="h-12 w-12 mx-auto text-primary mb-4" />
            <h1 className="text-xl font-semibold mb-2">You're already a member!</h1>
            <p className="text-muted-foreground mb-4">
              You're already in <strong>{guild.name}</strong>.
            </p>
            <Link href="/guild">
              <Button>Go to Guild</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already in a different guild
  if (hasGuild) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h1 className="text-xl font-semibold mb-2">Already in a Guild</h1>
            <p className="text-muted-foreground mb-4">
              You're already in <strong>{currentGuild?.name}</strong>. Leave that guild first to join <strong>{guild.name}</strong>.
            </p>
            <Link href="/guild">
              <Button variant="outline">Go to Your Guild</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Join Guild</CardTitle>
          <CardDescription>
            You've been invited to join
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Guild info */}
          <div className="text-center">
            <h2 className="text-xl font-bold">{guild.name}</h2>
            <p className="text-sm text-muted-foreground">
              {guild.memberCount} {guild.memberCount === 1 ? 'member' : 'members'}
            </p>
          </div>

          {/* Actions */}
          {user ? (
            <Button
              className="w-full"
              size="lg"
              onClick={handleJoin}
              disabled={joining}
            >
              {joining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Guild'
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Sign in or create an account to join
              </p>
              <div className="flex gap-2">
                <Link href={`/login?redirect=/invite/${code}`} className="flex-1">
                  <Button variant="outline" className="w-full">Log In</Button>
                </Link>
                <Link href={`/signup?redirect=/invite/${code}`} className="flex-1">
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
