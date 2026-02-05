'use client';

import { useState } from 'react';
import { useTopicReplies, ReplyWithVisibility, TOPIC_REPLY_MAX_LENGTH } from '@/hooks/useTopics';
import { formatTimestamp, parseTimestamp } from '@/lib/utils/time';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Lock, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TopicDetailProps {
  topicId: string;
  topicTitle: string;
  topicDescription?: string;
  topicCreatedByName: string;
  topicUnlockTimestamp: number;
  topicCreatedBy: string;
  bookId: string;
  currentUserId?: string;
  userProgressTimestamp: number;
  onBack: () => void;
  onDeleteTopic: (topicId: string) => Promise<void>;
}

export function TopicDetail({
  topicId,
  topicTitle,
  topicDescription,
  topicCreatedByName,
  topicUnlockTimestamp,
  topicCreatedBy,
  bookId,
  currentUserId,
  userProgressTimestamp,
  onBack,
  onDeleteTopic,
}: TopicDetailProps) {
  const { replies, loading, postReply, deleteReply } = useTopicReplies(topicId, bookId, userProgressTimestamp);

  const [replyText, setReplyText] = useState('');
  const [timestampInput, setTimestampInput] = useState(formatTimestamp(userProgressTimestamp));
  const [posting, setPosting] = useState(false);
  const [deletingTopic, setDeletingTopic] = useState(false);
  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null);

  const charCount = replyText.length;
  const isOverLimit = charCount > TOPIC_REPLY_MAX_LENGTH;
  const isOwnTopic = currentUserId === topicCreatedBy;

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isOverLimit || posting) return;

    setPosting(true);
    try {
      const unlockTimestamp = parseTimestamp(timestampInput);
      await postReply(replyText.trim(), unlockTimestamp);
      setReplyText('');
      toast.success('Reply posted!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to post reply';
      toast.error(message);
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteTopic = async () => {
    setDeletingTopic(true);
    try {
      await onDeleteTopic(topicId);
      toast.success('Topic deleted');
      onBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete topic';
      toast.error(message);
    } finally {
      setDeletingTopic(false);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    setDeletingReplyId(replyId);
    try {
      await deleteReply(replyId);
      toast.success('Reply deleted');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete reply';
      toast.error(message);
    } finally {
      setDeletingReplyId(null);
    }
  };

  const visibleReplies = replies.filter((r) => r.isVisible);
  const hiddenReplies = replies.filter((r) => !r.isVisible);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Topic */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg">{topicTitle}</h3>
              {topicDescription && (
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {topicDescription}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">
                  by {topicCreatedByName}
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  @ {formatTimestamp(topicUnlockTimestamp)}
                </Badge>
              </div>
            </div>
            {isOwnTopic && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={handleDeleteTopic}
                disabled={deletingTopic}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground animate-pulse">
          Loading replies...
        </div>
      ) : (
        <div className="space-y-3">
          {visibleReplies.length === 0 && hiddenReplies.length === 0 && (
            <p className="text-center py-4 text-sm text-muted-foreground">
              No replies yet. Be the first to respond!
            </p>
          )}

          {visibleReplies.map((reply) => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              isOwn={reply.isOwn}
              onDelete={() => handleDeleteReply(reply.id)}
              deleting={deletingReplyId === reply.id}
            />
          ))}

          {hiddenReplies.length > 0 && (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="py-4 text-center">
                <Lock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {hiddenReplies.length} {hiddenReplies.length === 1 ? 'reply' : 'replies'} hidden — listen further to unlock
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Reply input */}
      <Card>
        <CardContent className="py-4">
          <form onSubmit={handlePostReply} className="space-y-3">
            <div>
              <Label className="text-xs">Timestamp (HH:MM:SS or MM:SS)</Label>
              <Input
                type="text"
                placeholder="1:23:45"
                value={timestampInput}
                onChange={(e) => setTimestampInput(e.target.value)}
                disabled={posting}
                className="h-9 font-mono text-sm mt-1"
              />
            </div>
            <Textarea
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={posting}
              rows={2}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                {charCount}/{TOPIC_REPLY_MAX_LENGTH}
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={posting || !replyText.trim() || isOverLimit}
              >
                {posting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Reply'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ReplyCard({
  reply,
  isOwn,
  onDelete,
  deleting,
}: {
  reply: ReplyWithVisibility;
  isOwn: boolean;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <Card className={isOwn ? 'border-primary/30 bg-primary/5' : ''}>
      <CardContent className="py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{reply.userDisplayName}</span>
              <Badge variant="outline" className="font-mono text-xs">
                @ {formatTimestamp(reply.unlockTimestamp)}
              </Badge>
              {isOwn && (
                <Badge variant="secondary" className="text-xs">You</Badge>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap break-words">{reply.text}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatRelativeDate(reply.createdAt)}
            </p>
          </div>
          {isOwn && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive h-8 px-2"
              onClick={onDelete}
              disabled={deleting}
            >
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
