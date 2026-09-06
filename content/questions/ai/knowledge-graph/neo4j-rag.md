---
title: "怎么用 Neo4j 做 RAG？图检索和向量检索如何配合？"
category: ai
topic: knowledge-graph
section: GraphRAG 工程
difficulty: hard
order: 1
tags: [Neo4j, GraphRAG, 图检索, 向量索引, 实体链接]
sources:
  - title: "Indexes - Neo4j Cypher Manual"
    url: "https://neo4j.com/docs/cypher-manual/current/indexes/"
    lang: en
  - title: "User Guide: Knowledge Graph Builder - Neo4j GraphRAG Python"
    url: "https://neo4j.com/docs/neo4j-graphrag-python/current/user_guide_kg_builder.html"
    lang: en
  - title: "Welcome - Microsoft GraphRAG"
    url: "https://microsoft.github.io/graphrag/"
    lang: en
  - title: "From Local to Global: A Graph RAG Approach to Query-Focused Summarization (Edge et al., 2024) - arXiv"
    url: "https://arxiv.org/abs/2404.16130"
    lang: en
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
createdAt: "2026-09-06"
---

用 Neo4j 做 RAG，本质是：**先落到图上的几个种子节点，再沿边把「关系上下文」和原文片段一起交给 LLM。** 它和微软 GraphRAG 不是同一条路——那边离线做社区检测和社区摘要，用 local / global search 回答归纳题；这边是属性图数据库上的在线遍历，回答「谁和谁有什么关系」。两者互补，不是替换。向量 GraphRAG（抽完图再主要靠 embedding 搜节点）解决「语义入口」；属性图数据库解决「入口之后怎么受约束地走边」。面试里把这两套说成同一个产品，是常见扣分点。

## 一条可落地的链路

```text
用户问题
    ├─ 实体链接：NER / 全文索引 → 精确命中 Person、Company、Ticket
    └─ 向量索引：问题 embedding → 语义相近的 Chunk / Entity（种子）
         ↓
    MATCH 种子的邻居或有限 hop 路径（通常 1～3 跳）
         ↓
    把路径三元组 + 节点挂着的文档片段拼进 Prompt
         ↓
    LLM 生成（路径可作为引用，说明「为什么」）
```

向量负责「问题措辞对不上标准实体名」时仍能找到入口；图负责「第二跳实体根本没出现在问题里」时把桥接上。只做向量，多跳会断；只做精确实体匹配，用户一换说法就落空。Neo4j 5 把向量索引直接建在节点或关系属性上，种子检索和 `MATCH` 扩展可以在一次查询里完成，不必先打一趟外部向量库再回表。

## 和「社区摘要 GraphRAG」怎么分工

微软方案（Edge et al., 2024）强在全局归纳：「这批文档整体在讲什么」。Neo4j 属性图强在结构化关系：「A 的子公司给哪条产品线供货」，路径可解释、可加权限谓词。生产里可以路由：找片段走向量；问关系走 Cypher；问全库主题再考虑社区摘要那条更贵的索引。不要把「向量库里存了实体 embedding」误叫成已经上了图——没有边，就还是向量 RAG。

## 工程上会踩的坑

- **权限**：遍历必须把 ACL 写进 `MATCH`/`WHERE`，不能先查出路径再在应用层丢弃，否则高权限邻居会漏出来。
- **更新**：图要随文档增删改；边过期了，答案会一本正经地错。
- **幻觉来源变了**：模型没编，是图抽错或没消歧——「图错了，答案就错」，而且比向量召回失败更难发现。
- **跳数**：默认 2 hop，开放遍历会把半张图塞进上下文。

## 可能的追问

- 种子必须是实体节点吗？也可以是 `Chunk`：向量命中片段，再沿 `MENTIONS` / `FROM_CHUNK` 爬到实体和兄弟文档。
- 为什么不把所有边都展开给模型？上下文会被热门节点的邻居淹没；要按关系类型、时间、权限先裁，再送 LLM。
