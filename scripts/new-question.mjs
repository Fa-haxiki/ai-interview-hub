#!/usr/bin/env node
/**
 * 交互式生成一道新题目的 Markdown 骨架：
 *   pnpm new
 *   pnpm new --category ai --topic rag --section 评估 --slug my-question --title "……"
 *
 * 分类 / 主题 / 小节均来自 content/taxonomy.ts，order 自动取该小节现有最大值 + 1。
 */
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";

import matter from "gray-matter";

import { taxonomy } from "../content/taxonomy.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content", "questions");
const DIFFICULTIES = ["easy", "medium", "hard"];
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const { values: args } = parseArgs({
  options: {
    category: { type: "string" },
    topic: { type: "string" },
    section: { type: "string" },
    title: { type: "string" },
    slug: { type: "string" },
    difficulty: { type: "string" },
    tags: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
});

if (args.help) {
  stdout.write(`用法：pnpm new [选项]

不带选项时进入交互模式；带选项时跳过对应提问。
  --category <id>     分类 id（${taxonomy.map((c) => c.id).join(" | ")}）
  --topic <id>        主题 id
  --section <name>    小节名称（须在 taxonomy 中定义）
  --title <text>      题目标题
  --slug <kebab>      文件名（小写字母、数字、连字符）
  --difficulty <lvl>  easy | medium | hard（默认 medium）
  --tags <a,b,c>      逗号分隔的标签
`);
  process.exit(0);
}

const rl = createInterface({ input: stdin, output: stdout });
// stdin 关闭（Ctrl+D / 管道结束）后，后续提问直接以 AbortError 结束，避免挂起
const aborter = new AbortController();
rl.on("close", () => aborter.abort());

async function ask(question, { defaultValue, validate } = {}) {
  for (;;) {
    const suffix = defaultValue !== undefined ? `（默认 ${defaultValue}）` : "";
    const raw = (
      await rl.question(`${question}${suffix}：`, { signal: aborter.signal })
    ).trim();
    const value = raw === "" && defaultValue !== undefined ? String(defaultValue) : raw;
    const error = validate?.(value);
    if (!error) return value;
    stdout.write(`  ✗ ${error}\n`);
  }
}

async function choose(label, options, { preset, describe = (o) => o.name } = {}) {
  if (preset !== undefined) {
    const hit = options.find((o) => (o.id ?? o) === preset);
    if (hit) return hit;
    stdout.write(`  ✗ ${label}「${preset}」不存在，请从下面选择：\n`);
  }
  options.forEach((o, i) => {
    stdout.write(`  ${i + 1}. ${describe(o)}\n`);
  });
  const answer = await ask(`请选择${label}序号`, {
    defaultValue: 1,
    validate: (v) => {
      const n = Number(v);
      return Number.isInteger(n) && n >= 1 && n <= options.length
        ? null
        : `请输入 1 到 ${options.length} 之间的序号`;
    },
  });
  return options[Number(answer) - 1];
}

async function nextOrder(topicDir, section) {
  if (!existsSync(topicDir)) return 1;
  let max = 0;
  for (const file of await readdir(topicDir)) {
    if (!file.endsWith(".md")) continue;
    const { data } = matter(await readFile(path.join(topicDir, file), "utf8"));
    if (data.section === section && Number.isInteger(data.order)) {
      max = Math.max(max, data.order);
    }
  }
  return max + 1;
}

function yamlList(items) {
  return `[${items.map((t) => (/[:#,\[\]{}"']/.test(t) ? JSON.stringify(t) : t)).join(", ")}]`;
}

try {
  stdout.write("\n新建题目\n\n");

  const category = await choose("分类", taxonomy, {
    preset: args.category,
    describe: (c) => `${c.name}（${c.id}）`,
  });
  const topic = await choose("主题", category.topics, {
    preset: args.topic,
    describe: (t) => `${t.name}（${t.id}）`,
  });
  const sectionName = await choose(
    "小节",
    topic.sections.map((s) => ({ id: s, name: s })),
    { preset: args.section },
  );
  const section = sectionName.id;

  const title =
    args.title?.trim() ||
    (await ask("题目标题", { validate: (v) => (v ? null : "标题不能为空") }));

  const topicDir = path.join(CONTENT_DIR, category.id, topic.id);
  const slug = await (async () => {
    const validate = (v) => {
      if (!SLUG_RE.test(v)) return "slug 只能包含小写字母、数字和连字符，例如 what-is-rag";
      if (existsSync(path.join(topicDir, `${v}.md`))) return `文件 ${v}.md 已存在`;
      return null;
    };
    if (args.slug) {
      const error = validate(args.slug);
      if (!error) return args.slug;
      stdout.write(`  ✗ ${error}\n`);
    }
    return ask("文件名 slug（英文 kebab-case）", { validate });
  })();

  const difficulty = await (async () => {
    if (args.difficulty && DIFFICULTIES.includes(args.difficulty)) return args.difficulty;
    return ask("难度 easy | medium | hard", {
      defaultValue: "medium",
      validate: (v) => (DIFFICULTIES.includes(v) ? null : "请输入 easy、medium 或 hard"),
    });
  })();

  const tagsRaw = args.tags ?? (await ask("标签（逗号分隔，可留空）", { defaultValue: "" }));
  const tags = tagsRaw
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);

  const order = await nextOrder(topicDir, section);
  const today = new Date().toISOString().slice(0, 10);

  const content = `---
title: ${JSON.stringify(title)}
category: ${category.id}
topic: ${topic.id}
section: ${section}
difficulty: ${difficulty}
order: ${order}
tags: ${yamlList(tags)}
sources: []
# 填写来源后删除上面的 sources: []，英文来源标 lang: en，页面会显示「英文 · 已翻译整理」
# sources:
#   - title: "来源标题 - 站点名"
#     url: "https://example.com/article"
#     lang: zh
createdAt: "${today}"
---

一句话结论：……

## 原理展开

……

## 实践取舍

……

## 可能的追问

- 追问一？简短答法。
- 追问二？简短答法。
`;

  await mkdir(topicDir, { recursive: true });
  const filePath = path.join(topicDir, `${slug}.md`);
  await writeFile(filePath, content, "utf8");

  stdout.write(`\n✓ 已创建 ${path.relative(ROOT, filePath)}\n`);
  stdout.write(`  分类/主题/小节：${category.name} / ${topic.name} / ${section}（order ${order}）\n`);
  stdout.write(`  预览地址：/${category.id}/${topic.id}/${slug}/\n\n`);
} catch (error) {
  if (error?.name === "AbortError") {
    stdout.write("\n已取消。\n");
    process.exitCode = 1;
  } else {
    throw error;
  }
} finally {
  rl.close();
}
