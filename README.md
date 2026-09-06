# 面试题笔记

个人自用的面试题笔记站：把前端、后端、AI 方向的高频面试题按「分类 → 主题 → 小节」整理成 Markdown，用**面试者的口吻**作答，每题附参考来源（英文来源翻译整理后标记）。一期收录 AI / RAG 与知识库方向 40+ 道题。

纯静态站点，构建产物部署在 Cloudflare Workers（静态资源），`git push` 即自动发布。

## 技术栈

- [Next.js](https://nextjs.org) App Router + TypeScript，`output: "export"` 静态导出
- Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) + `@tailwindcss/typography`，`next-themes` 暗色模式
- Markdown 构建期渲染：`gray-matter` + `unified` / `remark-gfm` / `rehype-slug` / `rehype-autolink-headings` / `@shikijs/rehype`
- frontmatter 用 `zod` 校验，字段不合法或分类不存在时直接构建失败
- 客户端搜索：`fuse.js`，索引 `/search-index.json` 在构建期生成
- 不引用任何外部 CDN / 字体，使用系统中文字体栈，保证国内访问速度

## 本地开发

环境：Node.js ≥ 20.9（本地使用 24）、pnpm 11。

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # 静态导出到 out/
pnpm preview      # 用 serve 预览 out/
pnpm lint
```

## 目录结构

```text
content/
  taxonomy.ts                 # 分类 / 主题 / 小节定义（唯一事实来源）
  questions/<category>/<topic>/<slug>.md   # 题目正文
scripts/
  new-question.mjs            # pnpm new：交互式生成题目骨架
src/
  app/                        # 首页、/[category]、/[category]/[topic]、题目详情、search-index.json
  components/                 # 站点组件与 shadcn/ui
  lib/markdown.ts             # Markdown → HTML、TOC 提取、摘要
  lib/questions/              # QuestionRepository 接口 + MarkdownRepository 实现
wrangler.jsonc                # Cloudflare Workers 静态资源（assets.directory = out）
```

数据访问统一走 `src/lib/questions/repository.ts` 的 `QuestionRepository` 接口，页面与搜索索引都不直接读文件。二期若要加后台录入 + 云数据库，只需实现一个新的 Repository 并在 `src/lib/questions/index.ts` 里替换即可。

## 新增题目

### 1. 生成骨架

```bash
pnpm new
```

按提示选择分类、主题、小节，输入标题、slug（英文 kebab-case）、难度和标签，脚本会在 `content/questions/<category>/<topic>/<slug>.md` 生成带 frontmatter 的骨架，`order` 自动取该小节现有最大值 + 1。也可以用参数跳过提问：

```bash
pnpm new --category ai --topic rag --section 评估 --slug ragas-metrics --title "RAGAS 的四个指标分别衡量什么？"
```

### 2. Frontmatter 字段

```yaml
---
title: "Rerank 是什么？为什么检索之后还要重排序？"
category: ai                 # 必须是 taxonomy 中的分类 id
topic: rag                   # 必须是该分类下的主题 id
section: 混合检索与重排        # 必须是该主题 sections 中的一项
difficulty: medium           # easy | medium | hard
order: 3                     # 小节内排序，整数
tags: [Rerank, Cross-Encoder]
sources:
  - title: "RAG Interview Questions (2026) - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en                 # zh | en；en 在页面显示「英文 · 已翻译整理」
    note: "可选备注"
createdAt: "2026-09-06"
updatedAt: "2026-09-06"      # 可选
---
```

校验规则在 `src/lib/questions/markdown-repository.ts`，任何一题不合法都会让 `pnpm build` 失败并指出文件路径。

### 3. 正文写法

正文即答案，第一人称面试者口吻，推荐结构：

1. 结论先行：开头一两句给出核心观点；
2. 原理展开：用 `##` 二级标题分段，可用表格、代码块；
3. 实践取舍 / 项目经验；
4. 结尾固定一节 `## 可能的追问`，列 2 条追问与简短答法。

- 全中文撰写，术语保留英文（Recall@K、HNSW 等）；
- 来源内容用自己的话重新组织，不复制原文；英文来源标 `lang: en`；
- 二级标题会自动生成锚点与右侧目录，不要在正文里再写一级标题。

### 4. 新增分类 / 主题 / 小节

编辑 `content/taxonomy.ts`：分类下加 `topics`，主题下加 `sections`。没有题目的主题会在站内显示「筹备中」，不需要额外配置。

## 部署到 Cloudflare

当前控制台的 Workers Builds 会先跑 `pnpm build`，再执行 `npx wrangler deploy`。`wrangler.jsonc` 用 `assets.directory = "./out"` 把静态导出目录交给 Wrangler，不要再用 `wrangler pages deploy`。

### 方式一：连接 GitHub 仓库（推荐，push 自动部署）

1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → 连接本仓库。
2. 构建配置：
   - Build command：`pnpm build`
   - Deploy command：`npx wrangler deploy`（Workers Builds 默认值，不要改成 `wrangler pages deploy`）
   - 环境变量：`NODE_VERSION = 22`、`PNPM_VERSION = 11.12.0`
3. 保存后 push `main` 即自动发布，得到 `https://<name>.workers.dev` 或绑定的自定义域名；其他分支会生成预览。

### 方式二：本地用 wrangler 直接上传

```bash
pnpm dlx wrangler login     # 首次登录，会打开浏览器授权
pnpm build
pnpm run deploy:cf          # = wrangler deploy，上传 out/
```

注意 `pnpm deploy` 是 pnpm 内置命令，这里必须用 `pnpm run deploy:cf`。

## 二期规划

- 后台录入：Cloudflare Pages Functions + D1，或直接通过 GitHub Contents API 写回 Markdown 触发重建
- 简单密码 / Cloudflare Access 保护 `/admin`
- 更多主题：Agent、大模型基础、Prompt 工程、前端与后端各方向

## 版权说明

题目答案基于公开资料整理并注明来源，英文来源已翻译整理，仅供个人学习使用。
