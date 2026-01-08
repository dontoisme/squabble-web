'use client';

import { useState } from 'react';
import { GhostProgress } from '@/hooks/useGuildProgress';
import { formatTimestamp } from '@/lib/utils/time';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProgressBarWithGhostsProps {
  progressSeconds: number;
  progressPercent: number;
  totalDurationSeconds: number;
  ghosts: GhostProgress[];
}

// Generate consistent colors for ghosts based on user ID
function getGhostColor(userId: string): string {
  // Simple hash to pick from a palette
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Pastel ghost colors
  const colors = [
    'bg-purple-400',
    'bg-pink-400',
    'bg-blue-400',
    'bg-green-400',
    'bg-yellow-400',
    'bg-orange-400',
    'bg-teal-400',
    'bg-indigo-400',
  ];

  return colors[Math.abs(hash) % colors.length];
}

export function ProgressBarWithGhosts({
  progressSeconds,
  progressPercent,
  totalDurationSeconds,
  ghosts,
}: ProgressBarWithGhostsProps) {
  return (
    <TooltipProvider>
      <div className="space-y-1">
        {/* Progress label */}
        <div className="flex justify-between text-sm">
          <span>{formatTimestamp(progressSeconds)}</span>
          <span className="text-muted-foreground">{progressPercent.toFixed(1)}%</span>
        </div>

        {/* Progress bar with ghosts */}
        <div className="relative h-3 bg-muted rounded-full overflow-visible">
          {/* User's progress fill */}
          <div
            className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Ghost markers */}
          {ghosts.map((ghost) => (
            <Tooltip key={ghost.userId}>
              <TooltipTrigger asChild>
                <div
                  className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-background shadow-sm cursor-pointer transition-transform hover:scale-125 ${getGhostColor(ghost.userId)}`}
                  style={{
                    left: `calc(${Math.min(ghost.progressPercent, 100)}% - 6px)`,
                  }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p className="font-medium">{ghost.displayName}</p>
                <p className="text-muted-foreground">
                  {formatTimestamp(ghost.progressTimestamp)} ({ghost.progressPercent.toFixed(0)}%)
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Ghost legend (if any ghosts) */}
        {ghosts.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
            {ghosts.map((ghost) => (
              <div key={ghost.userId} className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${getGhostColor(ghost.userId)}`}
                />
                <span>{ghost.displayName}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
