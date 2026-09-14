import { ClockIcon, CalendarIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CheckinCount } from "@/components/checkin-count";
import { CheckinDock } from "@/components/checkin-dock";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { FollowUpAssistant } from "@/components/follow-up-assistant";
import { PrevNext } from "@/components/prev-next";
import { ProgressTracker } from "@/components/progress-tracker";
import { QaAccordion } from "@/components/qa-accordion";
import { SiteBreadcrumb } from "@/components/site-breadcrumb";
import { SourceList } from "@/components/source-list";
import { Toc, TocCollapsible } from "@/components/toc";
import {
  getAdjacentQuestions,
  getCategoryName,
  getTopicName,
  isPackCategory,
  questions,
} from "@/lib/questions";

export const dynamicParams = false;

export async function generateStaticParams() {
  const all = await questions.listAll();
  return all.map((q) => ({ category: q.category, topic: q.topic, slug: q.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[category]/[topic]/[slug]">): Promise<Metadata> {
  const { category, topic, slug } = await params;
  const question = await questions.get(category, topic, slug);
  if (!question) return {};
  return {
    title: question.title,
    description: question.summary,
  };
}

export default async function QuestionPage({
  params,
}: PageProps<"/[category]/[topic]/[slug]">) {
  const { category, topic, slug } = await params;
  const question = await questions.get(category, topic, slug);
  if (!question) notFound();

  const { prev, next } = await getAdjacentQuestions(question);
  const categoryName = getCategoryName(category);
  const topicName = getTopicName(category, topic);
  const topicUrl = `/${category}/${topic}/`;
  const backHref = isPackCategory(category) ? `/${category}/` : topicUrl;
  const backLabel = isPackCategory(category) ? categoryName : topicName;
  const isPack = question.kind === "qa-pack";

  return (
    <div
      className={
        isPack
          ? "mx-auto max-w-6xl px-4 py-6 md:py-10"
          : "mx-auto max-w-6xl px-4 py-6 md:py-10 lg:grid lg:grid-cols-[minmax(0,1fr)_13.5rem] lg:gap-12"
      }
    >
      <article className="min-w-0">
        <SiteBreadcrumb
          items={
            isPack
              ? [
                  { label: categoryName, href: `/${category}/` },
                  { label: question.section },
                ]
              : [
                  { label: categoryName, href: `/${category}/` },
                  { label: topicName, href: topicUrl },
                  { label: question.section },
                ]
          }
        />

        <header className="mt-4">
          <h1 className="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
            {question.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground sm:text-sm">
            {!isPack && <DifficultyBadge difficulty={question.difficulty} />}
            {isPack ? (
              <span>
                {question.section} · {question.qaCount} 题
              </span>
            ) : (
              <Link href={`${topicUrl}`} className="hover:text-foreground">
                {topicName} · {question.section}
              </Link>
            )}
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="size-3.5" />
              约 {question.readingMinutes} 分钟
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarIcon className="size-3.5" />
              更新于 {question.updatedAt}
            </span>
            {!isPack && <CheckinCount checkinKey={question.url} withIcon />}
          </div>
          {question.notes && (
            <p className="mt-2 text-sm text-muted-foreground">{question.notes}</p>
          )}
          {question.tags.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {question.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-md bg-muted px-2 py-0.5 text-xs text-foreground/80"
                >
                  #{tag}
                </li>
              ))}
            </ul>
          )}
        </header>

        {!isPack && (
          <div className="mt-6 lg:hidden">
            <TocCollapsible items={question.toc} />
          </div>
        )}

        {isPack ? (
          <QaAccordion items={question.qaItems} packUrl={question.url} />
        ) : (
          <div
            className="prose prose-neutral mt-6 max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: question.html }}
          />
        )}

        {!isPack && (
          <FollowUpAssistant
            followUps={question.followUps}
            pageTitle={question.title}
            pageUrl={question.url}
          />
        )}
        <ProgressTracker
          question={{
            category: question.category,
            topic: question.topic,
            slug: question.slug,
            title: question.title,
            section: question.section,
            path: question.url,
          }}
        />
        <SourceList sources={question.sources} />
        <PrevNext prev={prev} next={next} />
      </article>

      {!isPack && <CheckinDock checkinKey={question.url} />}

      {!isPack && (
        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
            <Toc items={question.toc} />
            <Link
              href={backHref}
              className="mt-6 block px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              ← 返回「{backLabel}」
            </Link>
          </div>
        </aside>
      )}
    </div>
  );
}
