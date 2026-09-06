import { getCategoryDef, taxonomy, type CategoryDef, type TopicDef } from "@content/taxonomy";

import { MarkdownRepository } from "./markdown-repository";
import type { QuestionRepository } from "./repository";
import type { QuestionMeta } from "./types";

export type { Question, QuestionMeta, QuestionSource, TocItem, Difficulty } from "./types";
export { DIFFICULTY_LABEL } from "./types";

/** 当前使用的数据源；二期切换到数据库时只需替换这里 */
export const questions: QuestionRepository = new MarkdownRepository();

export interface TopicWithCount extends TopicDef {
  count: number;
  url: string;
}

export interface CategoryWithCount extends Omit<CategoryDef, "topics"> {
  count: number;
  url: string;
  topics: TopicWithCount[];
}

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const all = await questions.listAll();
  return taxonomy.map((c) => {
    const topics = c.topics.map((t) => ({
      ...t,
      count: all.filter((q) => q.category === c.id && q.topic === t.id).length,
      url: `/${c.id}/${t.id}/`,
    }));
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      topics,
      count: topics.reduce((sum, t) => sum + t.count, 0),
      url: `/${c.id}/`,
    };
  });
}

export async function getCategoryWithCounts(
  categoryId: string,
): Promise<CategoryWithCount | null> {
  if (!getCategoryDef(categoryId)) return null;
  const categories = await getCategoriesWithCounts();
  return categories.find((c) => c.id === categoryId) ?? null;
}

export interface SectionGroup {
  section: string;
  /** 用于页面内锚点 */
  anchor: string;
  questions: QuestionMeta[];
}

export function sectionAnchor(section: string, index: number): string {
  return `section-${index + 1}`;
}

/** 某主题下的题目，按 taxonomy 中 sections 的顺序分组（空小节不返回） */
export async function getTopicSections(
  categoryId: string,
  topicId: string,
): Promise<SectionGroup[]> {
  const topicDef = getCategoryDef(categoryId)?.topics.find((t) => t.id === topicId);
  if (!topicDef) return [];
  const all = await questions.listAll();
  const inTopic = all.filter((q) => q.category === categoryId && q.topic === topicId);
  return topicDef.sections
    .map((section, index) => ({
      section,
      anchor: sectionAnchor(section, index),
      questions: inTopic.filter((q) => q.section === section),
    }))
    .filter((g) => g.questions.length > 0);
}

export async function getAdjacentQuestions(
  question: QuestionMeta,
): Promise<{ prev: QuestionMeta | null; next: QuestionMeta | null }> {
  const all = await questions.listAll();
  const inTopic = all.filter(
    (q) => q.category === question.category && q.topic === question.topic,
  );
  const index = inTopic.findIndex((q) => q.slug === question.slug);
  return {
    prev: index > 0 ? inTopic[index - 1] : null,
    next: index >= 0 && index < inTopic.length - 1 ? inTopic[index + 1] : null,
  };
}

export async function getRecentQuestions(limit = 6): Promise<QuestionMeta[]> {
  const all = await questions.listAll();
  return [...all]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0))
    .slice(0, limit);
}

export function getTopicName(categoryId: string, topicId: string): string {
  return getCategoryDef(categoryId)?.topics.find((t) => t.id === topicId)?.name ?? topicId;
}

export function getCategoryName(categoryId: string): string {
  return getCategoryDef(categoryId)?.name ?? categoryId;
}
