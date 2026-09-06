import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { QuestionList } from "@/components/question-list";
import { SectionChips } from "@/components/section-chips";
import { SiteBreadcrumb } from "@/components/site-breadcrumb";
import { TopicSidebar } from "@/components/topic-sidebar";
import { getCategoryWithCounts, getTopicSections } from "@/lib/questions";
import { taxonomy } from "@content/taxonomy";

export const dynamicParams = false;

export function generateStaticParams() {
  return taxonomy.flatMap((c) => c.topics.map((t) => ({ category: c.id, topic: t.id })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[category]/[topic]">): Promise<Metadata> {
  const { category, topic } = await params;
  const data = await getCategoryWithCounts(category);
  const topicDef = data?.topics.find((t) => t.id === topic);
  if (!data || !topicDef) return {};
  return {
    title: `${topicDef.name}面试题`,
    description: topicDef.description,
  };
}

export default async function TopicPage({ params }: PageProps<"/[category]/[topic]">) {
  const { category, topic } = await params;
  const data = await getCategoryWithCounts(category);
  const topicDef = data?.topics.find((t) => t.id === topic);
  if (!data || !topicDef) notFound();

  const sections = await getTopicSections(category, topic);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:grid md:grid-cols-[13.5rem_minmax(0,1fr)] md:gap-10 md:py-10">
      <TopicSidebar category={data} activeTopic={topic} />

      <div className="min-w-0">
        <SiteBreadcrumb
          items={[{ label: data.name, href: data.url }, { label: topicDef.name }]}
        />

        <header className="mt-4">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{topicDef.name}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {topicDef.description}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {topicDef.count > 0 ? `共 ${topicDef.count} 道题 · ${sections.length} 个小节` : ""}
          </p>
        </header>

        {sections.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            这个主题的题目还在整理中，敬请期待。
          </div>
        ) : (
          <>
            <div className="mt-6">
              <SectionChips sections={sections} />
            </div>

            <div className="mt-6 flex flex-col gap-10">
              {sections.map((group) => (
                <section key={group.anchor} aria-labelledby={group.anchor}>
                  <h2
                    id={group.anchor}
                    className="flex items-baseline gap-2 border-b pb-2 text-base font-semibold sm:text-lg"
                  >
                    {group.section}
                    <span className="text-xs font-normal text-muted-foreground">
                      {group.questions.length} 题
                    </span>
                  </h2>
                  <QuestionList questions={group.questions} />
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
