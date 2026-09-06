---
title: "主流的分块策略有哪些？各自的优缺点和适用场景是什么？"
category: ai
topic: rag
section: 文档处理与分块
difficulty: medium
order: 2
tags: [Chunking, 递归切分, 语义切分, 父子块]
sources:
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
  - title: "Production RAG Architecture in 2026 - prompt20"
    url: "https://blog.prompt20.com/posts/rag-production-architecture/"
    lang: en
createdAt: "2026-09-06"
---

我会按“从简单到复杂”的顺序介绍，并强调**默认从递归切分开始，只有当有证据表明分块质量拖累了召回，才升级到更复杂的方案**。

## 五类常用策略

| 策略 | 做法 | 优点 | 缺点 | 适用 |
| --- | --- | --- | --- | --- |
| 固定长度 | 每 N 个 token/字符切一块 | 简单、可预测、快 | 无视语义边界，常把句子切两半 | 原型验证、日志/字幕等均匀文本 |
| 递归切分 | 按 `\n\n` → `\n` → 句号 → 空格 的优先级递归切，尽量在自然边界断开 | 兼顾大小与边界，工程默认 | 仍是长度驱动，不是真正语义 | 大多数通用文本 |
| 结构感知 | 按 Markdown 标题、HTML 标签、代码 AST 切，保留层级信息 | 尊重文档结构，块自带标题上下文 | 需要结构化输入，块大小很不均匀 | 文档站、代码库、合同条款 |
| 语义切分 | 计算相邻句子 embedding 的相似度，在语义断点处切 | 主题聚合更好 | 需要额外算 embedding，慢且块大小不可控 | 多话题混排的长文、问答语料 |
| 父子块 / 层级块 | 小块建索引，命中后返回父块或邻居块 | 检索精度与上下文完整兼得 | 需要维护块之间的关系 | 结构化长文档的生产默认 |

## 两个近年出现的补充手段

- **Contextual Retrieval（Anthropic）**：给每个块前置一段由 LLM 生成的上下文说明（属于哪份文档、讲什么），再做 embedding 与 BM25，能显著降低检索失败率，代价是索引阶段多一次 LLM 调用。
- **Late Chunking（Jina）**：先用长上下文 embedding 模型编码整篇文档，再在 token 级向量上切块池化，让每个块的向量天然带全文语境；依赖支持长输入的 embedding 模型。

## 中文场景的一个细节

递归切分的分隔符要换成中文标点（`。！？；，`），否则英文默认的 `". "` 对中文文本基本不起作用。

## 可能的追问

- 你在项目里最终用的是哪种？我一般是“结构感知 + 递归兜底 + 父子块返回”的组合。
- 语义切分为什么生产中用得少？成本高、块大小不可控、收益不稳定；只在多话题混排且召回明显受损时才考虑。
