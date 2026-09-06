import type { Difficulty } from "@/lib/questions/types";

/** 搜索索引条目（构建期生成到 /search-index.json） */
export interface SearchDoc {
  url: string;
  title: string;
  category: string;
  categoryName: string;
  topic: string;
  topicName: string;
  section: string;
  difficulty: Difficulty;
  tags: string[];
  summary: string;
  headings: string[];
  body: string;
}

export const SEARCH_INDEX_PATH = "/search-index.json";
