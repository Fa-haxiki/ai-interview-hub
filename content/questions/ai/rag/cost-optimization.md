---
title: "RAG 系统的成本主要花在哪？怎么在不明显牺牲质量的前提下降本？"
category: ai
topic: rag
section: 生产工程与系统设计
difficulty: medium
order: 3
tags: [成本优化, Token, 语义缓存, 模型分级, 量化]
sources:
  - title: "Production RAG Architecture in 2026 - prompt20"
    url: "https://blog.prompt20.com/posts/rag-production-architecture/"
    lang: en
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

我的答案是：**RAG 的钱绝大部分花在 LLM 的输入输出 token 上，检索基础设施通常只占一两成。所以降本先盯生成侧的 token 数和模型选择，而不是先争论向量库选哪家。**

## 成本构成

| 项目 | 性质 | 占比（参考值） |
| --- | --- | --- |
| LLM 生成（输入 + 输出 token） | 每次请求 | 通常 70%–90%，输入里大半是检索上下文 |
| Embedding | 一次性全量 + 增量 | 小，百万级 chunk 只是几十美元量级 |
| 向量库存储与计算 | 固定 + 随规模 | HNSW 常驻内存，RAM 是主要开销 |
| Rerank 推理 | 每次请求 | 每次几毫厘，比 LLM 便宜一两个量级 |
| 评测与监控的 LLM 调用 | 抽样 | 若 100% 在线 judge 会很贵 |

一个参考量级：5k token 上下文加 500 token 输出，用中等模型一次请求约几美分，检索加 Rerank 合计不到其十分之一。

## 降本手段

**生成侧，最有效：**

1. **控制上下文长度**：Rerank 后只送 3–5 条，每条截断到几百 token，去掉重复块。输入 token 减半成本基本减半，而且噪音更少，质量往往还更好。
2. **语义缓存**：相似问题直接返回缓存答案，命中一次就省下一次完整调用。
3. **模型分级**：分类器把简单事实问答路由到小模型或便宜模型，只把复杂推理交给强模型，很多系统能降 30%–60%。
4. **Prompt 缓存 / 前缀缓存**：系统提示、few-shot、固定知识片段放在 prompt 前缀，主流 API 对命中缓存的输入 token 有大幅折扣。
5. **限制输出长度**：prompt 里要求简洁，并设置 max_tokens。

**检索侧：**

6. **Embedding 选小维度或量化**：1024 维足够，Matryoshka 模型可截断到 512；int8 量化省 4 倍内存，binary 量化省十几倍，再用原始向量对 Top-100 重打分基本不掉点。
7. **复用现有基础设施**：千万级以下用 pgvector 或 Elasticsearch 的向量能力，省掉一套独立集群的费用和运维。
8. **批处理离线任务**：文档 embedding、contextual retrieval 的摘要生成走批量接口（通常有折扣），夜间跑。
9. **按需 Rerank**：Top-1 分数远高于 Top-2 的简单问题可以跳过。

## 成本监控

每次请求打点：输入/输出 token 数、模型、是否命中缓存、Rerank 候选数，折算成费用写进日志，按租户、功能、问题类型归因。要看“每次有效回答的成本”而不是总账单，才知道是哪个功能在烧钱。

## 不该省的地方

- **评测**：砍掉评测就失去了判断“降本有没有伤质量”的能力，等于盲飞。
- **Rerank**：几毫厘一次，却让送进 LLM 的内容更精准，反过来省输入 token，性价比极高。
- **文档解析**：解析质量差产生的垃圾块会持续污染检索，返工成本远高于用好一点的解析器。

## 可能的追问

- 长上下文模型便宜了，直接把整份文档塞进去是不是更省事？每次请求都要为全文付费，RAG 只为相关的几千 token 付费；文档超过几十页时 RAG 仍便宜一个量级以上，除非同一份文档被反复问且用了 prompt cache。
- 语义缓存会不会把错误答案也缓存下来？会，所以只缓存被点赞或通过质检的答案，命中时打标记，点踩时清掉对应条目。
