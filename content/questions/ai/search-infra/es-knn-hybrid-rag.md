---
title: "Elasticsearch 怎么做 kNN 向量检索？在 RAG 里如何和 BM25 做混合检索？"
category: ai
topic: search-infra
section: Elasticsearch
difficulty: hard
order: 4
tags: [Elasticsearch, kNN, HNSW, 混合检索, RRF]
sources:
  - title: "kNN search in Elasticsearch"
    url: "https://www.elastic.co/docs/solutions/search/vector/knn"
    lang: en
  - title: "kNN search - Elasticsearch Reference"
    url: "https://www.elastic.co/guide/en/elasticsearch/reference/current/knn-search.html"
    lang: en
  - title: "Reciprocal rank fusion - Elasticsearch"
    url: "https://www.elastic.co/guide/en/elasticsearch/reference/current/rrf.html"
    lang: en
  - title: "Production RAG Architecture in 2026 - prompt20"
    url: "https://blog.prompt20.com/posts/rag-production-architecture/"
    lang: en
createdAt: "2026-09-06"
---

ES 8 之后用 `dense_vector` 存向量，近似 kNN 默认按 Lucene 段建 HNSW 图。适合「知识库已经在 ES、不想再引一套向量库」的团队。M、`ef` 这类算法旋钮和独立向量库那道题一样，这里只谈产品怎么接。

## 怎么建、怎么查

映射里声明维度和 `similarity`（`cosine` / `l2_norm` 等），写入时带上和查询同一套模型打出来的 embedding。查询用顶层 `knn`、可放进 `bool` 的 `knn` query，或 retriever 管线。`k` 是最终邻居数，`num_candidates` 是每分片近似候选数，调大召回升、延迟升。量很小或过滤后候选极少，才考虑 `script_score` 做精确 kNN。

建 HNSW / 量化索引比写普通倒排更吃 CPU，bulk 超时要单独留预算。近似 kNN 为了跨分片拿到全局 Top-K，会走类似 dfs 的收集方式，和普通全文的 query then fetch 不完全一样。

## 过滤：pre-filter 还是 post-filter

`knn` 里的 `filter` 是近似检索过程中的预过滤，目标是凑齐 k 条仍满足条件的邻居。后过滤是先 ANN 再筛，可能少于 k 条，条件很严时会空。过滤变严时 HNSW 往往要多走图，甚至对过滤结果退化为暴力算——和「过滤越严越快」的倒排直觉相反。租户、权限这类高选择条件，更适合预过滤；只是「再补一个时间窗」可以用后过滤，但要接受结果变少。

## 和 BM25 怎么融

两路 `_score` 不能直接比。用 `rrf` retriever：一路 `standard`（match / BM25），一路 `knn`，按排名融合。这就是混合检索在 ES 里的落地。文档量中等、团队熟 ELK，一家搞定即可；向量到亿级、索引种类要很多，再评估专用向量库。权重融合要先归一化，生产里我更愿意先上 RRF 做基线。

落地时还要保证「同一套 embedding、同一套权限过滤」：查询向量和文档向量必须同源模型；租户 / ACL 过滤两路都要带上，不能只滤倒排不滤 kNN。否则混合检索会从无权限库里捞到语义近的块，这是安全问题，不是召回问题。融合之后仍然建议接 Rerank：RRF 只负责合并候选，真正的精排还是 Cross-Encoder 更稳。`rank_window_size` 要大于最终返回条数，窗口太小会把某一路的中后段好结果直接截掉。

## 可能的追问

- HNSW 在 ES 里存在哪？按段构建，和倒排一样随 segment merge；图要吃内存/页缓存。
- `knn` 一定会返回 k 条吗？会尽量凑满 k 条，过滤把相关文档都剔掉时，仍可能返回「很远但不违规」的邻居。
