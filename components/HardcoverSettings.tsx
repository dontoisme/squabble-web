'use client';

import { useState } from 'react';
import { useHardcoverToken } from '@/hooks/useHardcover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Settings, ExternalLink, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export function HardcoverSettings() {
  const { token, setToken, hasToken, loaded } = useHardcoverToken();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setInputValue(token || '');
    }
  };

  const handleSave = () => {
    const trimmed = inputValue.trim();
    setToken(trimmed || null);
    setOpen(false);
    if (trimmed) {
      toast.success('Hardcover API token saved');
    } else {
      toast.info('Hardcover API token removed');
    }
  };

  const handleClear = () => {
    setToken(null);
    setInputValue('');
    toast.info('Hardcover API token cleared');
  };

  if (!loaded) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          {hasToken ? (
            <span className="flex items-center gap-1 text-green-500">
              <Check className="w-3 h-3" />
              Hardcover
            </span>
          ) : (
            <span className="text-muted-foreground">Connect Hardcover</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hardcover Integration</DialogTitle>
          <DialogDescription>
            Connect your Hardcover account to enable book search and cover images.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="hardcover-token">API Token</Label>
            <Input
              id="hardcover-token"
              type="password"
              placeholder="Enter your Hardcover API token"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Get your token from{' '}
              <a
                href="https://hardcover.app/account/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Hardcover Account Settings
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          {hasToken && (
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-muted-foreground">Token configured</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="ml-auto text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
