---
title: "请完整讲一下 RAG 从用户提问到最终回答的链路，每一步的关键决策是什么？"
category: ai
topic: rag
section: 基础概念
difficulty: easy
order: 2
tags: [RAG, 链路, Chunking, Embedding, Rerank]
sources:
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
createdAt: "2026-09-06"
---

我习惯把 RAG 拆成**离线索引**和**在线查询**两条线来讲，这样面试官能看出我不是只背了七个名词。

## 离线索引（Indexing）

1. **文档加载与解析**：PDF、Word、Markdown、网页、数据库。关键决策：表格怎么抽、扫描件要不要 OCR、页眉页脚怎么去噪。
2. **分块（Chunking）**：把长文档切成可检索的片段。关键决策：块多大、overlap 多少、按固定长度还是按结构/语义切。
3. **向量化（Embedding）**：每个块编码为向量。关键决策：选哪个模型（中文还是多语言）、维度多少、是否要同时建 BM25 稀疏索引。
4. **入库**：向量 + 原文 + 元数据（来源、时间、权限、租户）写入向量库；元数据将来是过滤和权限控制的基础。

## 在线查询（Query）

1. **查询理解**：可选的改写、多轮指代消解、意图路由（该不该检索、去哪个库检索）。
2. **检索**：查询向量化后做 ANN 检索，通常和 BM25 组成混合检索，取 Top-20～50 候选。
3. **重排（Rerank）**：Cross-Encoder 对候选精排，截取 Top-5 左右，并按阈值过滤噪音。
4. **上下文组织与生成**：拼 Prompt（含引用编号、拒答约束），把最相关的片段放在开头或结尾，LLM 生成带引用的答案。
5. **后处理与评估**：校验引用是否存在、必要时做忠实度检查；线上采样做自动评估并记录日志。

## 面试官真正想听的

不是“我用了 Milvus 和 LangChain”，而是每一步的**为什么**：为什么 chunk 从 1000 降到 500、为什么 Top-K 先取 20 再精排到 5、为什么中文场景选 bge 而不是 OpenAI embedding。我一般会顺手带出一两个量化结果，比如“加 Rerank 之后 Top-5 命中率从 7 成提到接近 9 成”。

## 可能的追问

- 这条链路里哪一步最容易出问题？（我的答案通常是解析和分块，因为它们的错误会沿着链路放大。）
- 如果只能加一个组件，加什么？（混合检索或者 Rerank，看具体失败模式。）
