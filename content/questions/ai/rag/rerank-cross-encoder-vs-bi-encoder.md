---
title: "Rerank 是什么？已经做了混合检索为什么还要重排？Cross-Encoder 和 Bi-Encoder 有什么区别？"
category: ai
topic: rag
section: 混合检索与重排
difficulty: medium
order: 3
tags: [Rerank, Cross-Encoder, Bi-Encoder, 精排]
sources:
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "Production RAG Architecture in 2026 - prompt20"
    url: "https://blog.prompt20.com/posts/rag-production-architecture/"
    lang: en
createdAt: "2026-09-06"
---

一句话：**检索是粗筛，Rerank 是精排。** 检索负责从百万文档里快速捞出 Top-20～50，Rerank 负责用更贵但更准的模型对这几十个候选重新打分，把真正相关的排到前面、把噪音踢掉。

## 为什么检索的分数不够准

向量检索用的是 **Bi-Encoder**（双塔）：问题和文档**分别**编码成向量，再算余弦。文档向量是离线预计算的，编码时根本不知道问题是什么，所以只能表达“大概相关”。BM25 同理，是词频统计，不理解语义。

Rerank 用的是 **Cross-Encoder**（交叉编码）：把“问题 + 文档”拼成一个输入送进模型，注意力可以在问题的每个 token 和文档的每个 token 之间充分交互，能判断“这段话是不是真的在回答这个问题”。它严格更强，代价是**不能预计算**——每个 (问题, 文档) 对都要跑一次前向，所以只能对少量候选做。

| | Bi-Encoder | Cross-Encoder |
| --- | --- | --- |
| 输入 | 问题、文档各自独立 | 问题与文档拼接 |
| 文档侧可否预计算 | 可以（离线建索引） | 不可以 |
| 速度 | 毫秒级检索百万文档 | 每对文档一次推理，慢 100～1000 倍 |
| 精度 | 近似相关 | 精细相关性判断 |
| 角色 | 召回 | 精排 |

## 效果与位置

生产里的标准流程：混合检索取 Top-20～50 → Cross-Encoder 精排 → 取 Top-5 左右送给 LLM。多篇资料和我自己的经验都表明，Rerank 通常能把 Recall@5 提升 10～30 个百分点；Anthropic 的实验里加上 Rerank 后检索失败率从 2.9% 进一步降到 1.9%。

一个容易被忽略的动作是**阈值截断**：不要无条件返回 Top-5，如果第 5 名的 Rerank 分数已经很低（模型不同阈值不同，常见 0.3 左右），宁可只给 3 条高相关片段，也不要用噪音填满上下文。三条高质量片段的效果好于一条相关加四条噪音。

## 常见模型

- 开源自托管：`bge-reranker-v2-m3`（多语言、中文效果好，约 0.6B 参数，Apache-2.0）、`bge-reranker-v2-gemma`（更大更准更慢）、Jina reranker（轻量可跑 CPU）。
- API：Cohere Rerank（多语言、生产常用）、Voyage rerank 等。

## 可能的追问

- 为什么不直接用 Cross-Encoder 检索全库？成本不可接受，百万文档每次查询都要跑百万次前向。
- Rerank 太慢怎么办？减少候选数（50 → 20）、批量推理、用更小的模型、GPU 部署，或者在简单问题上跳过 Rerank。
