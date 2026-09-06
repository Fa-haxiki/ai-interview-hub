import type { CategoryId } from "@content/taxonomy";

export type Difficulty = "easy" | "medium" | "hard";

export type SourceLang = "zh" | "en";

export interface QuestionSource {
  title: string;
  url: string;
  /** 来源语言；英文来源会在页面上标记「已翻译整理」 */
  lang: SourceLang;
  note?: string;
}

export interface TocItem {
  id: string;
  text: string;
  depth: 2 | 3;
}

/** 列表页 / 搜索索引使用的轻量元信息 */
export interface QuestionMeta {
  slug: string;
  title: string;
  category: CategoryId;
  topic: string;
  section: string;
  difficulty: Difficulty;
  tags: string[];
  sources: QuestionSource[];
  /** YYYY-MM-DD */
  createdAt: string;
  /** YYYY-MM-DD */
  updatedAt: string;
  /** 主题内排序，越小越靠前 */
  order: number;
  /** 正文首段摘要（纯文本） */
  summary: string;
  /** 站内路径，如 /ai/rag/what-is-rag/ */
  url: string;
}

/** 详情页使用的完整题目 */
export interface Question extends QuestionMeta {
  html: string;
  toc: TocItem[];
  /** 正文纯文本，供搜索索引使用 */
  plainText: string;
  readingMinutes: number;
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
};
