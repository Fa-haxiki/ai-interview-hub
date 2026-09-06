import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteBreadcrumb } from "@/components/site-breadcrumb";
import { getCategoryWithCounts } from "@/lib/questions";
import { taxonomy } from "@content/taxonomy";

export const dynamicParams = false;

export function generateStaticParams() {
  return taxonomy.map((c) => ({ category: c.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[category]">): Promise<Metadata> {
  const { category } = await params;
  const data = await getCategoryWithCounts(category);
  if (!data) return {};
  return {
    title: `${data.name}面试题`,
    description: data.description,
  };
}

export default async function CategoryPage({ params }: PageProps<"/[category]">) {
  const { category } = await params;
  const data = await getCategoryWithCounts(category);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <SiteBreadcrumb items={[{ label: data.name }]} />

      <header className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{data.name}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {data.description}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {data.count > 0 ? `共 ${data.count} 道题` : "内容筹备中"}
        </p>
      </header>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.topics.map((topic) => {
          const ready = topic.count > 0;
          return (
            <li key={topic.id}>
              <Link
                href={topic.url}
                className="group flex h-full flex-col rounded-xl border bg-card p-5 transition-colors hover:border-foreground/20 hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold group-hover:text-brand sm:text-lg">
                    {topic.name}
                  </h2>
                  <span className="shrink-0 rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
                    {ready ? `${topic.count} 题` : "筹备中"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {topic.description}
                </p>
                {ready && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {topic.sections.length} 个小节
                  </p>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
