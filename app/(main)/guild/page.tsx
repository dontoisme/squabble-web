'use client';

import { useState } from 'react';
import { useGuild } from '@/hooks/useGuild';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function GuildPage() {
  const {
    guild,
    members,
    loading,
    createGuild,
    joinGuild,
    hasGuild,
    isOwner,
  } = useGuild();

  const [mode, setMode] = useState<'none' | 'create' | 'join'>('none');
  const [guildName, setGuildName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateGuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guildName.trim()) return;

    setSubmitting(true);
    try {
      await createGuild(guildName.trim());
      toast.success('Guild created!');
      setMode('none');
      setGuildName('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create guild';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinGuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setSubmitting(true);
    try {
      await joinGuild(inviteCode.trim());
      toast.success('Joined guild!');
      setMode('none');
      setInviteCode('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join guild';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyInviteCode = () => {
    if (guild?.inviteCode) {
      navigator.clipboard.writeText(guild.inviteCode);
      toast.success('Invite code copied!');
    }
  };

  const copyInviteLink = () => {
    if (guild?.inviteCode) {
      const url = `${window.location.origin}/invite/${guild.inviteCode}`;
      navigator.clipboard.writeText(url);
      toast.success('Invite link copied!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading guild...</div>
      </div>
    );
  }

  // Show current guild
  if (hasGuild && guild) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{guild.name}</CardTitle>
                <CardDescription>
                  {guild.memberCount} member{guild.memberCount !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              {isOwner && <Badge>Owner</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Invite Friends</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-lg tracking-widest">
                  {guild.inviteCode}
                </code>
                <Button variant="outline" size="sm" onClick={copyInviteCode}>
                  Copy Code
                </Button>
                <Button size="sm" onClick={copyInviteLink}>
                  Copy Link
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Share the code or link with friends to invite them
              </p>
            </div>

            <Separator />

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Members</Label>
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md"
                  >
                    <div>
                      <span className="font-medium">{member.displayName}</span>
                      <span className="text-muted-foreground text-sm ml-2">
                        {member.email}
                      </span>
                    </div>
                    {member.role === 'owner' && (
                      <Badge variant="secondary">Owner</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No guild - show create/join options
  return (
    <div className="max-w-md mx-auto space-y-6">
      {mode === 'none' && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Join or Create a Guild</CardTitle>
            <CardDescription>
              Guilds let you share notes with friends as you listen together
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full"
              size="lg"
              onClick={() => setMode('create')}
            >
              Create a Guild
            </Button>
            <Button
              className="w-full"
              size="lg"
              variant="outline"
              onClick={() => setMode('join')}
            >
              Join with Invite Code
            </Button>
          </CardContent>
        </Card>
      )}

      {mode === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle>Create a Guild</CardTitle>
            <CardDescription>
              Start a new reading group with your friends
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateGuild}>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="guildName">Guild Name</Label>
                <Input
                  id="guildName"
                  placeholder="The Fellowship"
                  value={guildName}
                  onChange={(e) => setGuildName(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode('none')}
                disabled={submitting}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Guild'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {mode === 'join' && (
        <Card>
          <CardHeader>
            <CardTitle>Join a Guild</CardTitle>
            <CardDescription>
              Enter the 6-character invite code from a friend
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleJoinGuild}>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invite Code</Label>
                <Input
                  id="inviteCode"
                  placeholder="ABC123"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="font-mono text-lg tracking-widest text-center uppercase"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode('none')}
                disabled={submitting}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? 'Joining...' : 'Join Guild'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}
