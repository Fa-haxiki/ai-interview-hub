---
title: "RRF（倒数排名融合）是怎么合并多路检索结果的？和加权分数融合比有什么优劣？"
category: ai
topic: rag
section: 混合检索与重排
difficulty: medium
order: 2
tags: [RRF, 融合, 混合检索, 多路召回]
sources:
  - title: "Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods (Cormack et al., 2009)"
    url: "https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
  - title: "生产级RAG系统构建实践：多路召回、融合重排与自我修正架构详解 - 腾讯云开发者社区"
    url: "https://cloud.tencent.com/developer/article/2733962"
    lang: zh
createdAt: "2026-09-06"
---

RRF（Reciprocal Rank Fusion）的思路很朴素：**不看各路检索的原始分数，只看排名。一个文档在每一路里排得越靠前，贡献的分数越高，最后按总分重排。**

## 公式与实现

```text
RRF(d) = Σ_i 1 / (k + rank_i(d))
```

`rank_i(d)` 是文档 d 在第 i 路结果中的名次（从 1 开始），`k` 是平滑常数，论文里取 60。没在某一路出现的文档，那一路贡献为 0。

```ts
function rrfMerge(resultLists, k = 60) {
  const scores = new Map();
  for (const results of resultLists) {
    results.forEach((doc, index) => {
      const rank = index + 1;
      scores.set(doc.id, (scores.get(doc.id) ?? 0) + 1 / (k + rank));
    });
  }
  return [...scores.entries()].sort((a, b) => b[1] - a[1]);
}
```

`k` 的作用是压平头部差距：k 越大，第 1 名和第 10 名的贡献越接近，越强调“多路共同出现”；k 越小越偏向各路的第一名。

## 为什么生产里喜欢 RRF

- **免归一化**：向量余弦分数和 BM25 分数量纲完全不同，直接加权需要先归一化，而 BM25 分数的范围随查询变化，很难归一得稳定。RRF 只用排名，天然回避了这个问题。
- **稳健**：不同 query 的最佳权重差异很大，固定权重经常在一类问题上好、另一类上差；RRF 不设权重，表现更平均。
- **易扩展**：三路、四路（稠密 + BM25 + 图检索 + 改写后的多查询）直接往公式里加就行。

## 加权分数融合的位置

`score = α · dense + (1 − α) · sparse`（Weaviate、Pinecone 的 `alpha` 参数就是这个），需要先把分数归一化。优点是能表达“我更信任向量”这种先验，粒度比排名细；缺点是归一化敏感、权重难调。有的团队会用可学习的加权 RRF：每一路一个权重 `w_i / (k + rank_i)`，用点赞/点踩反馈定期优化。

## 我的建议

先用标准 RRF（k = 60）做基线，确认有稳定的评测集和反馈数据后再考虑调权重或学习式融合。融合之后一定接 Rerank，因为 RRF 只是“合并候选”，真正的精排靠 Cross-Encoder。

## 可能的追问

- RRF 会不会让两路都排 20 名左右的“平庸文档”压过某一路的第 1 名？会，这正是 k 的取舍；如果某一路明显更可信，可以给它加权重。
- 去重怎么做？按 chunk id（或父块 id）合并，同一父块的多个子块只保留最高分。
