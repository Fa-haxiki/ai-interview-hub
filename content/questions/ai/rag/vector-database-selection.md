---
title: "向量数据库怎么选？Milvus、FAISS、Qdrant、pgvector、Chroma 各适合什么场景？"
category: ai
topic: rag
section: Embedding 与向量检索
difficulty: medium
order: 4
tags: [向量数据库, Milvus, FAISS, Qdrant, pgvector]
sources:
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "RAG Interview Questions: Production Pipeline, Chunking, Reranking & Evaluation - interviewbaba"
    url: "https://interviewbaba.com/rag-interview-questions/"
    lang: en
createdAt: "2026-09-06"
---

我的回答套路是：**先说约束，再选工具。** 面试官想听的不是产品名列表，而是“在我的规模、运维能力和功能需求下为什么选它”。

## 先分清“库”和“数据库”

- **FAISS** 是一个嵌入进程的相似度检索**库**：极快、纯内存，但没有持久化、没有元数据过滤、不支持分布式。适合原型验证和百万级以下、嵌入在自己服务里的场景。
- 其余几个是独立部署的**数据库**，自带持久化、过滤、副本、增删改。

## 常见选项对比

| 选项 | 形态 | 亮点 | 适合 |
| --- | --- | --- | --- |
| Milvus | 分布式、云原生 | 面向亿级规模，组件多、运维重 | 大规模自托管生产 |
| Qdrant | Rust 实现，单节点起步 | 过滤能力强，原生混合检索与多向量 | 中小规模生产，想省运维 |
| pgvector | PostgreSQL 扩展 | 不引入新组件，事务、权限、关联查询都复用 PG | 已在用 PG、千万级以下 |
| Weaviate | 独立服务 | 原生混合检索、模块生态 | 复杂过滤 + 混合检索 |
| Chroma | 内嵌式、SQLite 底座 | 上手最快 | 本地开发、小项目 |
| Pinecone 等托管服务 | 全托管 | 零运维、弹性 | 不想管基础设施且预算允许 |

## 几个实用的量级

1M 条 1536 维 float32 向量原始数据约 6 GB，HNSW 索引再加 1.5～2 倍；pgvector 单机在千万级以内比较舒服；再往上才需要 Milvus 这类分布式方案。多数团队的真实规模远没到需要分布式的程度。

## 我会怎么说选型理由

举例：“我们选 pgvector，因为知识库只有几百万块、团队已经维护 PostgreSQL，权限过滤直接用 SQL 的 WHERE 做，少一套组件。如果将来到亿级再迁 Milvus。做 Demo 时我会用 FAISS 或 Chroma，快。”反过来说“我们先上了 Milvus 集群”而规模只有几十万条，面试官会怀疑是简历驱动的架构。

## 可能的追问

- 向量库和 Elasticsearch 双写还是用一套？如果向量库原生支持 BM25/稀疏向量（Qdrant、Milvus 2.4+、Weaviate）可以用一套；否则向量库 + ES 双写，注意一致性。
- 什么时候考虑把向量放回主数据库？需要事务一致性、行级权限、与业务表 join 的时候。
