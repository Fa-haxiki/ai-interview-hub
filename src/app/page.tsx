import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { CategoryCard } from "@/components/category-card";
import { QuestionRow } from "@/components/question-list";
import { Button } from "@/components/ui/button";
import {
  getCategoriesWithCounts,
  getRecentQuestions,
  getTopicName,
} from "@/lib/questions";
import { siteConfig } from "@/lib/site";

export default async function HomePage() {
  const [categories, recent] = await Promise.all([
    getCategoriesWithCounts(),
    getRecentQuestions(6),
  ]);
  const total = categories.reduce((sum, c) => sum + c.count, 0);
  const topicCount = categories.reduce(
    (sum, c) => sum + c.topics.filter((t) => t.count > 0).length,
    0,
  );
  const featured = categories
    .flatMap((c) => c.topics)
    .sort((a, b) => b.count - a.count)[0];

  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="py-12 sm:py-16 md:py-20">
        <p className="text-sm font-medium text-brand">个人学习笔记</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
          {siteConfig.name}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {siteConfig.description}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          {featured && featured.count > 0 && (
            <Button asChild size="lg" className="h-11 px-5 sm:h-10">
              <Link href={featured.url}>
                开始学习：{featured.name}
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="lg" className="h-11 px-5 sm:h-10">
            <Link href="/ai/">浏览全部分类</Link>
          </Button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          共 {total} 道题 · {topicCount} 个主题
          {recent[0] && ` · 最近更新 ${recent[0].updatedAt}`}
        </p>
      </section>

      <section aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="text-xl font-semibold tracking-tight">
          分类
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section aria-labelledby="recent-heading" className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <h2 id="recent-heading" className="text-xl font-semibold tracking-tight">
              最近更新
            </h2>
          </div>
          <ul className="mt-2 flex flex-col divide-y">
            {recent.map((q) => (
              <QuestionRow
                key={q.url}
                question={q}
                showTopic
                topicName={getTopicName(q.category, q.topic)}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
