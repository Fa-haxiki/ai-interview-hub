---
title: "Query 改写有哪些方法？HyDE、Multi-Query、Step-back、问题分解分别解决什么问题？"
category: ai
topic: rag
section: 查询理解与改写
difficulty: medium
order: 1
tags: [Query 改写, HyDE, Multi-Query, Step-back, 问题分解]
sources:
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "Precise Zero-Shot Dense Retrieval without Relevance Labels (HyDE, Gao et al., 2022)"
    url: "https://arxiv.org/abs/2212.10496"
    lang: en
  - title: "Production RAG Architecture in 2026 - prompt20"
    url: "https://blog.prompt20.com/posts/rag-production-architecture/"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

Query 改写解决的是**用户的问法和文档的写法不一致**这个根本矛盾：用户说得短、口语化、带指代，文档写得长、术语化、结构化。在检索之前用 LLM 把问题“翻译”成更接近文档的形式，通常是性价比很高的一步。

## 四种常用方法

**1. 简单改写（Rewrite）**
把模糊、口语化的问题改写成具体、适合检索的表述。“怎么调优？”→“RAG 系统向量检索准确率低有哪些优化方法？”。多轮对话中还要把“它”“那个”替换成具体对象。成本一次小模型调用，收益在多轮场景最明显。

**2. HyDE（假设文档嵌入）**
先让 LLM 针对问题写一段“假想的答案”，再用这段答案的向量去检索，而不是用问题的向量。原理是答案和文档在向量空间里天然更接近（都是陈述句、术语密度相近），问题和文档之间反而有“问答不对称”。适合问题很短、文档很长、领域外的场景；缺点是多一次生成、延迟 200～500 ms，而且如果模型对领域一无所知，假想答案会把检索带偏。

**3. Multi-Query（多查询扩展）**
让 LLM 生成 3～5 个不同角度的同义问法，各自检索后用 RRF 合并去重。相当于用多个视角“撒网”，提高召回、降低单次 embedding 的偶然性。可以并行，延迟增加不多。

**4. Step-back（后退提问）**
先问一个更抽象的上位问题拿到背景知识，再回答具体问题。“为什么 3 月 3 日 API 延迟飙升？”→ 先检索“API 延迟飙升的常见原因”。适合需要原理支撑的具体问题。

**5. 问题分解（Decomposition）**
把复合问题拆成子问题分别检索再综合。“对比 A 和 B 在 2020～2024 的营收趋势”→ 分别检索 A、B 各年份的数据。这是多跳问答的基础，收益最大（多跳场景可提升数倍），延迟也最高。

## 怎么选

| 症状 | 方法 |
| --- | --- |
| 多轮对话、问题里有指代 | 改写（必做） |
| 问题短、文档长、领域外查询 | HyDE |
| 单次 embedding 不稳定、召回偶然性大 | Multi-Query |
| 需要背景原理的具体问题 | Step-back |
| 比较、汇总、多跳 | 分解 |

不要把所有方法都堆上去，那只会得到一个更慢更贵的系统。我一般是“改写必做 + 按 query 类型路由到一种扩展策略”。

## 可能的追问

- 改写会不会改错意思？会，所以改写后的 query 通常和原 query 一起检索再融合，保底。
- 怎么评估改写有没有用？在评测集上比较改写前后的 Recall@5，多轮对话场景通常能看到 5～15 个点的提升。
