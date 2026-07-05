import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { Breadcrumbs } from '@/components/help/Breadcrumbs';
import { PrevNext } from '@/components/help/PrevNext';
import { mdxComponents } from '@/components/help/mdx-components';
import {
  getAdjacentPages,
  getAllPages,
  getPageBySlug,
  getSectionForPage,
} from '@/lib/help/content';

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPages().map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getPageBySlug(slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    openGraph: {
      title: `${page.title} — Squabble Inn Field Guide`,
      description: page.description,
    },
  };
}

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const page = getPageBySlug(slug);
  if (!page) notFound();

  const section = getSectionForPage(page);
  const { prev, next } = getAdjacentPages(page);

  return (
    <div className="max-w-3xl">
      <Breadcrumbs section={section} page={page} />
      <h1 className="mb-2 text-3xl font-bold text-foreground">{page.title}</h1>
      <p className="mb-8 text-lg text-muted-foreground">{page.description}</p>
      <article className="prose prose-tavern max-w-none">
        <MDXRemote
          source={page.content}
          components={mdxComponents}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [
                rehypeSlug,
                [rehypeAutolinkHeadings, { behavior: 'wrap' }],
              ],
            },
          }}
        />
      </article>
      <PrevNext prev={prev} next={next} />
    </div>
  );
}
