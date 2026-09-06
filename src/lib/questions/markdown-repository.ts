import { promises as fs } from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import { z } from "zod";

import { categoryIds, getCategoryDef, getTopicDef, taxonomy } from "@content/taxonomy";
import { estimateReadingMinutes, renderMarkdown } from "@/lib/markdown";

import type { QuestionRepository } from "./repository";
import type { Question, QuestionMeta } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content", "questions");

const dateField = z
  .union([z.iso.date(), z.date()])
  .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v));

const frontmatterSchema = z.object({
  title: z.string().min(1, "title 不能为空"),
  category: z.enum(categoryIds),
  topic: z.string().min(1),
  section: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.array(z.string().min(1)).default([]),
  sources: z
    .array(
      z.object({
        title: z.string().min(1),
        url: z.url(),
        lang: z.enum(["zh", "en"]).default("zh"),
        note: z.string().optional(),
      }),
    )
    .default([]),
  createdAt: dateField,
  updatedAt: dateField.optional(),
  order: z.number().int().default(999),
});

type Frontmatter = z.infer<typeof frontmatterSchema>;

function questionUrl(category: string, topic: string, slug: string): string {
  return `/${category}/${topic}/${slug}/`;
}

async function readQuestionFile(filePath: string): Promise<Question> {
  const raw = await fs.readFile(filePath, "utf8");
  const { data, content } = matter(raw);

  const rel = path.relative(CONTENT_DIR, filePath);
  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`题目 frontmatter 校验失败：${rel}\n${issues}`);
  }
  const fm: Frontmatter = parsed.data;

  const [dirCategory, dirTopic, fileName] = rel.split(path.sep);
  const slug = fileName.replace(/\.md$/, "");

  if (fm.category !== dirCategory || fm.topic !== dirTopic) {
    throw new Error(
      `题目 ${rel} 的 category/topic（${fm.category}/${fm.topic}）与所在目录（${dirCategory}/${dirTopic}）不一致`,
    );
  }
  if (!getCategoryDef(fm.category)) {
    throw new Error(`题目 ${rel} 使用了未定义的分类：${fm.category}`);
  }
  const topicDef = getTopicDef(fm.category, fm.topic);
  if (!topicDef) {
    throw new Error(`题目 ${rel} 使用了未定义的主题：${fm.category}/${fm.topic}`);
  }
  if (!topicDef.sections.includes(fm.section)) {
    throw new Error(
      `题目 ${rel} 的 section「${fm.section}」不在主题 ${fm.topic} 的 sections 列表中，可选：${topicDef.sections.join("、")}`,
    );
  }

  const rendered = await renderMarkdown(content);

  return {
    slug,
    title: fm.title,
    category: fm.category,
    topic: fm.topic,
    section: fm.section,
    difficulty: fm.difficulty,
    tags: fm.tags,
    sources: fm.sources,
    createdAt: fm.createdAt,
    updatedAt: fm.updatedAt ?? fm.createdAt,
    order: fm.order,
    summary: rendered.summary,
    url: questionUrl(fm.category, fm.topic, slug),
    html: rendered.html,
    toc: rendered.toc,
    plainText: rendered.plainText,
    readingMinutes: estimateReadingMinutes(rendered.plainText),
  };
}

async function listMarkdownFiles(): Promise<string[]> {
  const files: string[] = [];
  let categories: string[] = [];
  try {
    categories = await fs.readdir(CONTENT_DIR);
  } catch {
    return files;
  }
  for (const category of categories) {
    const categoryDir = path.join(CONTENT_DIR, category);
    if (!(await fs.stat(categoryDir)).isDirectory()) continue;
    for (const topic of await fs.readdir(categoryDir)) {
      const topicDir = path.join(categoryDir, topic);
      if (!(await fs.stat(topicDir)).isDirectory()) continue;
      for (const file of await fs.readdir(topicDir)) {
        if (file.endsWith(".md") && !file.startsWith("_")) {
          files.push(path.join(topicDir, file));
        }
      }
    }
  }
  return files;
}

const categoryOrder = new Map(taxonomy.map((c, i) => [c.id, i]));

function compareQuestions(a: QuestionMeta, b: QuestionMeta): number {
  const ca = categoryOrder.get(a.category) ?? 0;
  const cb = categoryOrder.get(b.category) ?? 0;
  if (ca !== cb) return ca - cb;

  const categoryDef = getCategoryDef(a.category);
  const topics = categoryDef?.topics ?? [];
  const ta = topics.findIndex((t) => t.id === a.topic);
  const tb = topics.findIndex((t) => t.id === b.topic);
  if (ta !== tb) return ta - tb;

  const sections = topics[ta]?.sections ?? [];
  const sa = sections.indexOf(a.section);
  const sb = sections.indexOf(b.section);
  if (sa !== sb) return sa - sb;

  if (a.order !== b.order) return a.order - b.order;
  return a.title.localeCompare(b.title, "zh-Hans-CN");
}

function toMeta(q: Question): QuestionMeta {
  return {
    slug: q.slug,
    url: q.url,
    title: q.title,
    category: q.category,
    topic: q.topic,
    section: q.section,
    difficulty: q.difficulty,
    tags: q.tags,
    sources: q.sources,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
    order: q.order,
    summary: q.summary,
  };
}

/**
 * 从 content/questions 读取 Markdown 的实现。
 * 构建期会被多个页面反复调用，因此在模块级缓存解析结果。
 */
export class MarkdownRepository implements QuestionRepository {
  private cache: Promise<Question[]> | null = null;

  private load(): Promise<Question[]> {
    if (!this.cache) {
      this.cache = (async () => {
        const files = await listMarkdownFiles();
        const questions = await Promise.all(files.map(readQuestionFile));
        const seen = new Set<string>();
        for (const q of questions) {
          if (seen.has(q.url)) throw new Error(`重复的题目路径：${q.url}`);
          seen.add(q.url);
        }
        return questions.sort(compareQuestions);
      })();
    }
    return this.cache;
  }

  async listAll(): Promise<QuestionMeta[]> {
    return (await this.load()).map(toMeta);
  }

  async listAllFull(): Promise<Question[]> {
    return this.load();
  }

  async get(category: string, topic: string, slug: string): Promise<Question | null> {
    const all = await this.load();
    return (
      all.find((q) => q.category === category && q.topic === topic && q.slug === slug) ?? null
    );
  }
}
