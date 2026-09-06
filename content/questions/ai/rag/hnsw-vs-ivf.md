---
title: "HNSW 和 IVF 索引的原理与区别是什么？关键参数怎么调？"
category: ai
topic: rag
section: Embedding 与向量检索
difficulty: hard
order: 5
tags: [HNSW, IVF, PQ, ANN, 索引调优]
sources:
  - title: "Efficient and robust approximate nearest neighbor search using HNSW graphs (Malkov & Yashunin, 2016)"
    url: "https://arxiv.org/abs/1603.09320"
    lang: en
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

两者都是近似最近邻（ANN）索引，区别在于**组织向量的方式**：HNSW 用图，IVF 用聚类。

## HNSW：分层可导航小世界图

- 把所有向量组织成多层图：顶层节点稀疏、边长，底层包含全部节点、边短。查询时从顶层入口贪心地走向更近的邻居，逐层下沉，到底层做精搜。整体复杂度近似 O(log n)。
- **优点**：查询快、召回高、支持增量插入，是几乎所有向量库的默认索引。
- **缺点**：要在内存里保存图结构，内存开销大（原始向量的 1.5～2 倍以上）；建图较慢；删除成本高（通常是标记删除）。
- **关键参数**：
  - `M`：每个节点的最大邻居数。越大图越密、召回越高，内存越大，常见 16～64。
  - `ef_construction`：建图时候选队列大小。越大图质量越好、建图越慢，常见 100～200。
  - `ef_search`（查询时）：查询候选队列大小，必须 ≥ K；调大提高召回、增加延迟，是线上最常动的旋钮。

## IVF：倒排文件索引

- 先用 k-means 把向量聚成 `nlist` 个簇，每个簇维护一个倒排列表。查询时先找最近的 `nprobe` 个簇中心，只在这些簇里精算距离。
- **优点**：内存友好、结构简单、适合超大规模；与 PQ 结合（IVF-PQ）可以把内存再降一个数量级。
- **缺点**：召回受 `nprobe` 影响大，边界附近的向量容易漏；数据分布变化后需要重新训练聚类中心；增量写入会让簇不均衡。
- **关键参数**：`nlist` 经验上取 √N 到 4√N 量级；`nprobe` 越大召回越高、延迟越高，常见 nlist 的 1%～10%。

## 怎么选

| 场景 | 建议 |
| --- | --- |
| 千万级以下、追求低延迟高召回、内存够 | HNSW |
| 亿级、内存受限、可以接受略低召回 | IVF-PQ，或 DiskANN 这类基于 SSD 的索引 |
| 数据量小（十万以内）或要做基准对照 | Flat 暴力检索，召回 100% |

## 调参方法

固定一组带标签的查询，画“召回率 vs 延迟”曲线：HNSW 调 `ef_search`、IVF 调 `nprobe`，选满足延迟预算（比如 P95 < 50 ms）下召回最高的点。参数不是拍脑袋定的，而是在自己的数据上测出来的。

## 可能的追问

- 为什么 HNSW 删除麻烦？删除节点会破坏图的连通性，所以多用墓碑标记 + 定期重建。
- 量化会不会影响 Rerank？可以用量化向量做粗召回，再用原始向量或 Cross-Encoder 精排，弥补精度损失。
