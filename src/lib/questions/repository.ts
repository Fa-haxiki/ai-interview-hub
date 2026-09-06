import type { Question, QuestionMeta } from "./types";

/**
 * 题目数据源抽象。
 * 一期由 MarkdownRepository 从 content/ 目录读取；
 * 二期若接入云数据库 / 后台录入，只需实现同一接口并在 index.ts 中切换。
 */
export interface QuestionRepository {
  /** 全部题目元信息（按 category → topic → section → order 排好序） */
  listAll(): Promise<QuestionMeta[]>;
  /** 完整题目（含渲染后的 HTML 与目录） */
  get(category: string, topic: string, slug: string): Promise<Question | null>;
  /** 全部题目的完整内容，用于生成搜索索引 */
  listAllFull(): Promise<Question[]>;
}
