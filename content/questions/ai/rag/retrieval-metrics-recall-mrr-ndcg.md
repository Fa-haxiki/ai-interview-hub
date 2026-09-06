---
title: "Recall@K、Precision@K、MRR、NDCG 怎么计算？分别适合评估 RAG 检索的什么方面？"
category: ai
topic: rag
section: 评估
difficulty: medium
order: 3
tags: [Recall@K, MRR, NDCG, 检索评估]
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

这四个都是检索侧的**确定性指标**：只要有“问题 + 标注的相关块”就能算，不需要 LLM，几秒钟跑完，适合做每次改动的回归测试。我的结论是：RAG 里最先看 **Recall@K**（K 取实际送给 LLM 的条数），MRR 和 NDCG 回答的是“排得多前”，在调 Rerank 或有分级标注时才更有用。

## 公式与一个小例子

假设某个问题标注了 3 个相关块 {A, B, C}，检索返回 Top-5 依次是 [D, A, E, B, F]：

```text
Recall@5    = 命中的相关块数 / 相关块总数 = 2 / 3 ≈ 0.67
Precision@5 = 命中的相关块数 / K         = 2 / 5 = 0.40
RR          = 1 / 首个相关块的排名        = 1 / 2 = 0.50
              （MRR 是对评测集所有问题的 RR 取平均）

NDCG@5（分级相关性：A=3, B=2, C=1，其余 0；增益取 rel / log2(rank+1)）
DCG@5  = 3/log2(3) + 2/log2(5)            ≈ 1.893 + 0.861 = 2.754
IDCG@5 = 3/log2(2) + 2/log2(3) + 1/log2(4) ≈ 3 + 1.262 + 0.5 = 4.762
NDCG@5 = DCG / IDCG                        ≈ 0.58
```

IDCG 是“理想排序”下的 DCG，所以 NDCG 天然归一到 0～1；把 A 从第 2 位提到第 1 位，NDCG 会涨，但 Recall@5 和 Precision@5 一动不动，这就是两类指标的区别。

## 各自适合看什么

| 指标 | 关注点 | 在 RAG 里的用途 | 局限 |
| --- | --- | --- | --- |
| Recall@K | 该找的找到没 | 决定答案质量上限，检索改动的首要指标 | 不看排序、不看噪音 |
| Precision@K | 上下文里噪音多不多 | 关注 token 成本和“lost in the middle” | 相关块少于 K 时天花板小于 1 |
| MRR | 第一个相关结果排多前 | 单答案型问题、衡量 Rerank 效果 | 只看首个，多块问题信息量少 |
| NDCG@K | 整体排序质量，支持分级 | 有 0/1/2/3 分级标注时最合适 | 需要分级标注，成本高 |

## K 怎么取，为什么 Recall 最重要

K 必须和线上送给 LLM 的条数一致。我通常测两个数：第一阶段的 Recall@50（召回上限）和 Rerank 后的 Recall@5（真正进上下文的）。Recall@50 高而 Recall@5 低，说明问题在排序而不是召回，直接调 Rerank；反过来两者都低就得回头看分块和 embedding。

Recall 之所以是第一优先级，是因为生成阶段的信息来源只有上下文：**没检索到的事实模型不可能答对**，只能编或拒答，这是零容忍的；而多几条噪音 LLM 有一定的容忍度，只是费 token、可能干扰注意力。我的经验是 Recall@5 每提升几个点，端到端正确率大概率跟着涨，而单独抬 Precision 的收益要小得多。

## 常见误用

- **标注只标一个“正确块”**：同一事实往往出现在多个块里，检索命中了同义块却被判为错，Recall 和 Precision 都被低估。标注时要把所有能支撑答案的块都标上，或者在文档/段落粒度标注。
- **分块策略一变，标注全失效**：相关性标在 chunk id 上，重新切块后 id 都没了。我会把标注锚定到源文档的段落或字符区间，评估时再映射到当前 chunk。
- **离线 K 与线上不一致**：离线 Recall@20 很漂亮，线上只送 5 条。
- **用 MRR 评估多跳问题**：多跳需要多个块同时命中，MRR 只看第一个，会给出虚高的信号。
- **在 0/1 标注上算 NDCG**：没有分级信息时它和其他排序指标差别不大，反而让人误以为做了精细评估。

## 可能的追问

- Recall@K 已经很高，端到端答案还是差，怎么查？先看相关块在上下文里的位置（是否被埋在中间），再看生成侧的 Faithfulness；这正是把检索和生成分层评估的意义。
- 一个问题只有 1 个相关块，Precision@5 最高只能 0.2，怎么办？要么按每个问题的实际相关数取 K（R-Precision），要么只报 Recall 加 NDCG，不要拿 Precision@K 的绝对值跨问题比较。
