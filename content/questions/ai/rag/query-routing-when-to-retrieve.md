---
title: "什么是 Query 路由？怎么判断一个问题该不该检索、该去哪个知识源检索？"
category: ai
topic: rag
section: 查询理解与改写
difficulty: medium
order: 3
tags: [Query 路由, 意图识别, 自适应检索, 多知识源]
sources:
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "Production RAG Architecture in 2026 - prompt20"
    url: "https://blog.prompt20.com/posts/rag-production-architecture/"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

Query 路由回答两个问题：**要不要检索？去哪检索？** 没有路由的 RAG 会对“你好”也去查一遍向量库，对 SQL 数据能回答的问题去翻 PDF，既浪费延迟又引入噪音。

## 第一层：要不要检索

三类不该检索的问题：

- 闲聊、问候、确认（“谢谢”“好的”）；
- 模型自身知识就能稳定回答的通用问题（“Python 列表怎么去重”）；
- 上一轮已经检索过、当前只是追问细节，已有上下文足够。

判断方式从简到繁：规则/关键词 → 轻量分类器（把历史问题打标训练一个小模型，几毫秒） → 让 LLM 自己输出“需要检索/不需要”（Self-RAG 的思路，把这个判断当成生成的一个 token）。生产里我倾向“分类器为主、LLM 判断兜底”。

## 第二层：去哪检索

企业知识往往分散在多个源：产品文档向量库、工单系统、结构化数据库、代码仓库、外部搜索。路由器根据问题的意图选择一个或多个源：

- **语义路由**：给每个知识源写一段描述并 embedding，问题和描述算相似度，选最相近的源。零训练、可解释、增删源方便。
- **LLM 路由**：让 LLM 用 function calling 选工具，能处理组合意图（“对比文档里的方案和数据库里的实际指标”），但延迟和成本更高。
- **元数据路由**：从问题里抽取产品线、时间、地区等实体，转成向量库的过滤条件，缩小检索范围。

## 第三层：用什么策略检索

同一个源也可以按问题类型选策略：事实类问题直接检索；比较类问题走分解；概念类问题走 Step-back。路由器输出的是一整套“检索计划”，而不只是一个开关。

## 工程建议

- 路由错误的代价是“检索不到”，所以要留兜底：置信度低时多路并发检索再融合。
- 把路由决策记进日志，是后续排查“为什么答不上来”的关键线索。
- 路由器本身也要有评测集，路由准确率是独立的指标。

## 可能的追问

- 路由和 Agentic RAG 的关系？路由是 Agentic RAG 的最简形式：一次决策；Agentic RAG 是多轮决策，可以根据检索结果再决定下一步。
- 用大模型做路由会不会太慢？可以用小模型或缓存高频意图，路由通常控制在 100 ms 内。
