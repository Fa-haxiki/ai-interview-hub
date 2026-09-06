---
title: "LangChain 的 Retriever 怎么接到链或 Agent 里？和自己写检索函数有什么差别？"
category: ai
topic: frameworks
section: LangChain 核心
difficulty: medium
order: 7
tags: [Retriever, RAG, Runnable, 权限]
sources:
  - title: "LangChain overview"
    url: "https://docs.langchain.com/oss/javascript/langchain/overview"
    lang: en
  - title: "LangChain Expression Language (LCEL)"
    url: "https://js.langchain.com/docs/concepts/lcel/"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**Retriever 只是「query → Document[]」的 Runnable，不是知识库本身。** 接到 LCEL 里用 `RunnableParallel.from` 和问题一起取出；接到 Agent 里通常再包成 Tool，让模型决定何时搜。和自己写检索函数比，差别在接口统一，不在召回质量。

## 三种接法

1. **写死在链里**：每次提问必检索。`RunnableParallel.from({ docs: retriever, question: new RunnablePassthrough() }).pipe(prompt).pipe(model)`。适合标准 RAG，延迟和费用可预期。
2. **当成 Tool**：description 写清「何时搜内部文档」，模型在循环里点名。适合「有的问题根本不用搜」，但多一跳，也多一次选错工具的机会。
3. **图上的 retrieve 节点**：条件边决定搜不搜、搜几次。比 Tool 更可控，因为你能强制「生成前必须检索」或「分数不够就改写再搜」。

LangChain 自带大量向量库 / 搜索引擎 connector，还提供 `EnsembleRetriever`、压缩器这类组合件。它们解决的是**接线**，不解决分块、embedding、权限和评测。`RetrievalQA` 那种万能 Chain 我会避开：默认 Prompt、默认拼接方式藏在框架里，线上召回差时你改不到关键路径。

## 和自研检索的差别

接口层面：框架 Retriever 能直接进 `.pipe()` 管道，自研函数要 `RunnableLambda.from` 包一下，或者在图节点里直接 await 你的 search 服务。质量层面：没有差别，甚至自研更好——权限过滤、租户隔离、混合检索参数，这些本就该在检索服务里，不该泄漏到 Prompt 层。我常见的生产形态是：**检索中台返回 Document 列表，LangChain / LangGraph 只负责编排**；Document 上带 `source`、`score`、`acl`，生成节点只拼允许看到的字段。

千万不要把「未过滤的 retriever」交给 Agent 当工具。模型传什么 query 就搜全库，等于把内部文档检索变成一个无鉴权 API。

## 可能的追问

- Retriever 要不要做成异步？NestJS 里直接 `await retriever.invoke`；批量评测用 `batch`。
- 多路召回怎么接？各路先当独立 Retriever 或独立节点，在 Rerank 处合并，不要幻想一个 `EnsembleRetriever` 默认值能替你调权重。
