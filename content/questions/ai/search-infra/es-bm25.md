---
title: "ES 默认的 BM25 怎么打分？TF、IDF、字段长度分别起什么作用？"
category: ai
topic: search-infra
section: Elasticsearch
difficulty: medium
order: 2
tags: [Elasticsearch, BM25, TF-IDF, RRF]
sources:
  - title: "Practical BM25 - Part 2: The BM25 Algorithm and its Variables - Elastic"
    url: "https://www.elastic.co/blog/practical-bm25-part-2-the-bm25-algorithm-and-its-variables"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

ES 默认相似度是 BM25：把查询里每个 term 的贡献加起来。三项直觉分别是——词出现次数有帮助但不线性涨（TF 饱和）、越稀有的词越值钱（IDF）、同样命中时短字段略占优（长度归一）。面试不用默写公式，把这三个旋钮说清楚即可。

## TF、IDF、字段长度

- **TF**：文档里这个词出现越多分越高，但有饱和。第十次出现远不如第一次值钱，避免堆砌关键词碾压短而准的文档。
- **IDF**：词在多少文档里出现过。像「的」「如何」几乎每篇都有，权重被压低；错误码、产品名这种稀有词权重大。
- **字段长度**：按「本字段词数 / 平均字段词数」做归一。短标题命中一次，通常比长说明书里偶然出现一次更相关。

对 RAG 来说，IDF 决定了「用户原样抄了一个编号」时 BM25 能不能压过语义近、字面远的干扰块；长度归一则提醒我们：chunk 切得过长，关键词会被稀释。

## k1 和 b

- `k1`（默认约 1.2）控制 TF 饱和有多快：越大，重复出现还能继续加分；为 0 时 TF 几乎不再区分文档。
- `b`（默认 0.75）控制长度惩罚强弱：`b = 0` 完全忽略长度，`b = 1` 长度影响最大。

两者都应在自己的语料和评测集上调，不要报一组「通用最优参数」。知识库字段长短差很大时（标题 vs 正文），可以先观察短字段是否过度占优，再小幅动 `b`。

## 和 TF-IDF、向量分的差别

经典 TF-IDF 的词频更接近线性累加；BM25 用饱和函数，对长文和关键词堆砌更稳。Lucene 的 IDF 形态也和教科书 TF-IDF 不完全一样，面试说「都惩罚常见词，但 BM25 对 TF 做了饱和」就够。BM25 的 `_score` 和向量余弦数量级完全不同，不能直接加减。RAG 混合检索应用 RRF 按排名融合，而不是把两种分数加权。

工程上还有一个容易漏的点：分词质量决定 BM25 有没有「稀有词」可打。专有名词被切开后，IDF 优势消失，调 `k1` 也救不回来。所以中文知识库应先盯分析器，再谈相似度参数。

## 可能的追问

- 分片间 IDF 不一致怎么办？默认 query then fetch 用分片本地统计，需要更准可用 `dfs_query_then_fetch`。
- BM25 分数有没有绝对含义？没有，只能在同一次查询里比相对高低，不要编造「超过某分数就算相关」。
