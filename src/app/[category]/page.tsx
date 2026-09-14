import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PackDocumentList } from "@/components/pack-document-list";
import { SiteBreadcrumb } from "@/components/site-breadcrumb";
import { getCategoryWithCounts, isPackCategory, questions } from "@/lib/questions";
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
    title: isPackCategory(category) ? data.name : `${data.name}面试题`,
    description: data.description,
  };
}

export default async function CategoryPage({ params }: PageProps<"/[category]">) {
  const { category } = await params;
  const data = await getCategoryWithCounts(category);
  if (!data) notFound();

  if (isPackCategory(category)) {
    const documents = (await questions.listAll()).filter((q) => q.category === category);
    const qaTotal = documents.reduce((sum, q) => sum + q.qaCount, 0);
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <SiteBreadcrumb items={[{ label: data.name }]} />
        <header className="mt-4">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{data.name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {data.description}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {documents.length > 0
              ? `共 ${documents.length} 份面经 · ${qaTotal} 题`
              : "内容筹备中"}
          </p>
        </header>
        {documents.length > 0 ? (
          <PackDocumentList documents={documents} />
        ) : (
          <div className="mt-8 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            面经还在整理中。
          </div>
        )}
      </div>
    );
  }

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
