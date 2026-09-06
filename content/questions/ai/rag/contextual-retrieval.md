---
title: "什么是 Contextual Retrieval（上下文检索）？它解决了分块的什么问题？"
category: ai
topic: rag
section: 文档处理与分块
difficulty: medium
order: 5
tags: [Contextual Retrieval, Anthropic, Chunking, BM25]
sources:
  - title: "Introducing Contextual Retrieval - Anthropic"
    url: "https://www.anthropic.com/news/contextual-retrieval"
    lang: en
  - title: "RAG Interview Questions: Production Pipeline, Chunking, Reranking & Evaluation - interviewbaba"
    url: "https://interviewbaba.com/rag-interview-questions/"
    lang: en
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
createdAt: "2026-09-06"
---

Contextual Retrieval 是 Anthropic 在 2024 年 9 月提出的做法，核心思路一句话：**在给每个块做 embedding 和 BM25 索引之前，先用 LLM 给它前置一小段“它在整篇文档中处于什么位置、在讲什么”的上下文说明。**

## 它解决的问题

分块最根本的矛盾是：块一旦从文档中切出来就失去了语境。比如一个块写着“该季度营收同比增长 3%”，单看它不知道是哪家公司、哪个季度，无论是向量还是关键词检索都很难把它和“ACME 公司 2023 年 Q2 营收”这样的问题匹配上。传统 overlap 和父子块只能部分缓解，因为它们补的是“邻近文本”，不是“摘要级语境”。

## 具体做法

1. 对每个块，把**整篇文档 + 当前块**交给模型，要求生成 50～100 token 的简短上下文（“本块出自 ACME 公司 2023 年 Q2 财报，描述营收变化……”）。
2. 把这段上下文拼在块前面，得到“上下文化的块”。
3. 用它同时生成 **Contextual Embeddings** 和 **Contextual BM25** 索引。
4. 检索时照常做混合检索 + Rerank。

## 效果与成本

Anthropic 报告的数据是：仅用上下文化 embedding，Top-20 检索失败率下降约 35%（5.7% → 3.7%）；加上上下文化 BM25，下降约 49%（→ 2.9%）；再加 Rerank，下降约 67%（→ 1.9%）。成本方面，借助 Prompt Caching（整篇文档只需缓存一次），处理一百万文档 token 的一次性花费大约 1 美元左右。因为它发生在离线索引阶段，对在线延迟没有影响。

## 我的取舍

- 语料是“块脱离上下文就看不懂”的类型（财报、合同、技术规格）时，收益最大。
- 语料频繁更新、体量巨大时要算一下索引成本；可以只对高价值文档做。
- 它和父子块不冲突，前者补“语义语境”，后者补“邻近文本”，可以叠加。

## 可能的追问

- 和直接把标题路径拼到块前面有什么区别？标题拼接是零成本的简化版，效果次之；Contextual Retrieval 生成的是针对该块的定制说明，信息量更大。
- 为什么 BM25 也要上下文化？很多精确词（公司名、产品名）只出现在文档开头，块里没有；前置上下文把这些关键词补回了块中。
