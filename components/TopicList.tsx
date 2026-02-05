'use client';

import { TopicWithVisibility } from '@/hooks/useTopics';
import { formatTimestamp } from '@/lib/utils/time';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, MessageSquare } from 'lucide-react';

interface TopicListProps {
  topics: TopicWithVisibility[];
  hiddenCount: number;
  loading: boolean;
  onSelectTopic: (topicId: string) => void;
}

export function TopicList({ topics, hiddenCount, loading, onSelectTopic }: TopicListProps) {
  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground animate-pulse">
        Loading topics...
      </div>
    );
  }

  const visibleTopics = topics.filter((t) => t.isVisible);

  if (visibleTopics.length === 0 && hiddenCount === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No topics yet</p>
        <p className="text-sm">Start a discussion thread!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visibleTopics.map((topic) => (
        <Card
          key={topic.id}
          className={`cursor-pointer hover:bg-muted/50 transition-colors ${topic.isOwn ? 'border-primary/30' : ''}`}
          onClick={() => onSelectTopic(topic.id)}
        >
          <CardContent className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{topic.title}</h4>
                {topic.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {topic.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-muted-foreground">
                    {topic.createdByName}
                  </span>
                  <Badge variant="outline" className="font-mono text-xs py-0">
                    @ {formatTimestamp(topic.unlockTimestamp)}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <MessageSquare className="w-3 h-3" />
                {topic.replyCount}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {hiddenCount > 0 && (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="py-4 text-center">
            <Lock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {hiddenCount} {hiddenCount === 1 ? 'topic' : 'topics'} hidden — listen further to unlock
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
