import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import Link from 'next/link';
import {
  Clock,
  EyeOff,
  Globe,
  Info,
  Lightbulb,
  Smartphone,
  TriangleAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CalloutVariant = 'info' | 'tip' | 'warning' | 'spoiler';

const calloutConfig: Record<
  CalloutVariant,
  { icon: typeof Info; label: string; className: string }
> = {
  info: {
    icon: Info,
    label: 'Note',
    className: 'border-l-muted-foreground',
  },
  tip: {
    icon: Lightbulb,
    label: 'Tip',
    className: 'border-l-copper',
  },
  warning: {
    icon: TriangleAlert,
    label: 'Heads up',
    className: 'border-l-warning',
  },
  spoiler: {
    icon: EyeOff,
    label: 'Spoiler protection',
    className: 'border-l-copper',
  },
};

export function Callout({
  variant = 'info',
  title,
  children,
}: {
  variant?: CalloutVariant;
  title?: string;
  children: ReactNode;
}) {
  const config = calloutConfig[variant] ?? calloutConfig.info;
  const IconComponent = config.icon;
  return (
    <aside
      className={cn(
        'my-6 rounded-lg border border-border border-l-4 bg-card px-4 py-3 not-prose',
        config.className
      )}
    >
      <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
        <IconComponent className="h-4 w-4 text-copper" aria-hidden />
        {title ?? config.label}
      </div>
      <div className="mt-1.5 text-sm text-muted-foreground [&_a]:text-copper [&_a:hover]:underline [&_strong]:text-foreground">
        {children}
      </div>
    </aside>
  );
}

export function Steps({ children }: { children: ReactNode }) {
  return (
    <ol className="not-prose my-6 space-y-0 list-none p-0 [counter-reset:step]">
      {children}
    </ol>
  );
}

export function Step({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0 [counter-increment:step]">
      <div className="flex flex-col items-center">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-copper text-sm font-bold text-primary-foreground before:content-[counter(step)]" />
        <span className="w-px flex-1 bg-border mt-2" aria-hidden />
      </div>
      <div className="min-w-0 pt-0.5">
        <p className="font-semibold text-foreground m-0">{title}</p>
        {children ? (
          <div className="mt-1 text-sm text-muted-foreground [&_a]:text-copper [&_a:hover]:underline [&_strong]:text-foreground">
            {children}
          </div>
        ) : null}
      </div>
    </li>
  );
}

export function Screenshot({
  src,
  alt,
  caption,
}: {
  src?: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure className="not-prose my-6 flex flex-col items-center">
      {src ? (
        // Mobile screenshots are tall portrait captures; plain <img> keeps
        // the content pipeline free of next/image size metadata requirements.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="max-h-[560px] w-auto max-w-full rounded-xl border border-border shadow-lg"
        />
      ) : (
        <div className="flex h-64 w-full max-w-xs items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
          Screenshot coming soon
        </div>
      )}
      {caption ? (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

type Platform = 'mobile' | 'web' | 'coming-soon';

const platformConfig: Record<
  Platform,
  { icon: typeof Globe; label: string; className: string }
> = {
  mobile: {
    icon: Smartphone,
    label: 'Mobile app',
    className: 'bg-copper/15 text-copper',
  },
  web: {
    icon: Globe,
    label: 'Also on web',
    className: 'bg-success/15 text-success',
  },
  'coming-soon': {
    icon: Clock,
    label: 'Coming soon to web',
    className: 'bg-muted text-muted-foreground',
  },
};

export function PlatformBadge({ platform }: { platform: Platform }) {
  const config = platformConfig[platform] ?? platformConfig.mobile;
  const IconComponent = config.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium align-middle whitespace-nowrap',
        config.className
      )}
    >
      <IconComponent className="h-3 w-3" aria-hidden />
      {config.label}
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">
      {children}
    </kbd>
  );
}

function MdxLink({ href = '', ...props }: ComponentPropsWithoutRef<'a'>) {
  if (href.startsWith('/')) {
    return <Link href={href} {...props} />;
  }
  const isExternal = href.startsWith('http');
  return (
    <a
      href={href}
      {...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
      {...props}
    />
  );
}

export const mdxComponents = {
  Callout,
  Steps,
  Step,
  Screenshot,
  PlatformBadge,
  Kbd,
  a: MdxLink,
};
