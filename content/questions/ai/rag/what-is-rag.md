---
title: "什么是 RAG？为什么需要 RAG？"
category: ai
topic: rag
section: 基础概念
difficulty: easy
order: 1
tags: [RAG, 基础概念, 知识库]
sources:
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
createdAt: "2026-09-06"
---

RAG（Retrieval-Augmented Generation，检索增强生成）是一种让大模型在回答前先从外部知识源检索相关资料、再基于检索结果生成答案的技术范式。一句话概括：**模型负责“理解和表达”，外部知识库负责“记住事实”。**

## 为什么需要 RAG

我会从大模型自身的三个局限来解释：

1. **知识有截止日期**：模型训练完成后知识就冻结了，新发布的产品文档、昨天的会议纪要它都不知道。
2. **不了解私有数据**：企业内部的规章、代码库、客服记录不在训练语料里，模型无法凭空回答。
3. **容易产生幻觉**：没有依据时模型倾向于“编”一个看似合理的答案，而且无法给出来源。

RAG 正好对应这三点：知识可以随时更新（重新索引即可）、私有数据无需训练就能接入、答案有引用来源可追溯。

## 一个最小的 RAG 流程

```text
用户问题 → 向量化 → 在知识库中检索 Top-K 片段 → 拼进 Prompt → LLM 生成带引用的答案
```

## 和微调的关系

如果面试官追问“为什么不直接微调”，我会强调：微调更适合改变模型的**能力和风格**（比如学会某种输出格式、领域术语），而 RAG 更适合注入**事实性知识**。事实会变化、量大、需要溯源，用微调既贵又难更新；两者不是互斥的，很多生产系统是“微调过的模型 + RAG”。

## 可能的追问

- RAG 的完整链路有哪些环节，每个环节容易出什么问题？
- 长上下文模型（百万 token）出现后，RAG 是否还有必要？
