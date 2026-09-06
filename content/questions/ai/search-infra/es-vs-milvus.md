---
title: "RAG 里 Elasticsearch 和 Milvus 怎么选？要不要两个都上？"
category: ai
topic: search-infra
section: 选型对比
difficulty: medium
order: 1
tags: [Elasticsearch, Milvus, 混合检索, 选型, pgvector]
sources:
  - title: "What is Milvus? - Overview"
    url: "https://milvus.io/docs/overview.md"
    lang: en
  - title: "kNN search in Elasticsearch"
    url: "https://www.elastic.co/docs/solutions/search/vector/knn"
    lang: en
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

先问约束再选产品：已有什么、数据量、要不要强全文、运维几个人。不是「做向量就必须上 Milvus」，也不是「有 ES 就永远不加向量库」。

## 各自强在哪

- **Elasticsearch**：倒排、BM25、聚合、中文分析器生态，以及日志 / 文档已经在 ES 的运维惯性。`dense_vector` + `knn` + RRF 能一家做混合检索。
- **Milvus**：面向大规模向量，索引种类多（HNSW / IVF / DiskANN），吞吐和存算分离是长项；全文、聚合、可视化不是它的主场。

一句话：ES 先解决「人怎么搜字」，Milvus 先解决「机器怎么扫向量」。RAG 两种都需要，但不等于两个系统都要上。

## 三种常见落法

1. **只用 ES**：知识库已在 ES、千万级以内、团队熟 ELK。BM25 + 向量 + RRF 一条链路。
2. **只用 Milvus**（或再加库内稀疏）：向量是绝对主体，关键词需求弱，或规模明显偏大。
3. **ES 做 BM25 + Milvus 做向量 + 应用层 RRF**：两路都要很强、两边规模都大。代价是双写、版本对齐和两套运维。

## 要不要两个都上

默认不要。双写必须保证同一 chunk id、同一版本，删除和权限过滤也得同步。已有 PostgreSQL、量级千万以下，pgvector 往往更简单——向量库选型总览已经展开，这里只强调「少引入一个组件」。

我会说：「文档检索已经在 ES，先在 ES 做混合；向量到亿级或 ES kNN 延迟不够，再拆 Milvus，而不是简历驱动上两套。」决策依据是评测集上的召回 / 延迟 / 运维成本，不是产品官网的功能清单。

如果面试官追问「以后会不会后悔没上 Milvus」，我的标准是看三个信号：向量量级是否逼近单集群舒适区、过滤后的 kNN 是否开始退化成近乎暴力扫、以及团队是否已经有人专职看 ES 堆内存。三个都不成立，就继续单栈。反过来，已经为日志堆了一套 ES 的团队，也不该为了「更像向量库」再迁一次知识库。先单栈跑通评测，再决定要不要拆，比一开始就双写更不容易翻车。

## 可能的追问

- 双写一致性怎么做？同一文档流水线同时写，用文档版本号对账，失败重试，避免两边各写各的。
- Milvus 也有稀疏 / 全文了还能替代 ES 吗？可以评估收敛到一套，但仍要看中文分词和聚合需求，不要假设它能覆盖全部 ES 场景。
