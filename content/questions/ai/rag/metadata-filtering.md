---
title: "向量数据库里的元数据过滤是怎么工作的？前过滤和后过滤有什么区别？"
category: ai
topic: rag
section: Embedding 与向量检索
difficulty: medium
order: 6
tags: [元数据过滤, 前过滤, 后过滤, 多租户]
sources:
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "RAG Interview Questions: Production Pipeline, Chunking, Reranking & Evaluation - interviewbaba"
    url: "https://interviewbaba.com/rag-interview-questions/"
    lang: en
createdAt: "2026-09-06"
---

元数据过滤就是在“找最相似的 K 个向量”之外再加结构化条件：**“找部门 = 工程、更新时间 > 2025-01-01、且当前用户有权限查看的最相似 5 条”。** 我认为没有可靠元数据过滤的向量库在生产里基本不可用，因为多租户隔离、权限控制、时效性过滤全靠它。

## 两种实现方式

- **前过滤（pre-filtering）**：先按条件筛出候选集合，再在候选里做相似度检索。结果保证满足条件，但如果过滤条件很苛刻，候选集合可能太小，HNSW 图在被“挖空”后连通性变差，召回和性能都会受影响。
- **后过滤（post-filtering）**：先做 ANN 取 Top-N，再按条件过滤。实现简单，但过滤掉的比例高时会出现“取了 100 条只剩 5 条甚至 0 条”，需要不断放大 N 重试，既浪费又不稳定。

现代向量库大多做的是**过滤感知的检索**：在图遍历过程中直接跳过不满足条件的节点（Qdrant、Milvus、Weaviate 都有类似实现），并允许对高选择性的字段单独建索引（payload index）。选择性极高的条件（比如按 `tenant_id` 分租户）更常见的做法是干脆按租户分 collection / namespace / partition。

## 元数据该放什么

- **权限与租户**：`tenant_id`、`acl` / 可见角色列表，检索前必须过滤，不能靠 Prompt 让模型“别说”。
- **时效**：`updated_at`、`source_version`，用于新鲜度过滤和排除过期块。
- **结构**：`doc_id`、`section_path`、`page`、`chunk_index`，用于父子块回溯和引用溯源。
- **业务维度**：产品线、语言、文档类型，用于路由和过滤。

## 一个常见的坑

元数据字段设计成自由文本很难过滤，应该在入库时规范化成枚举或时间戳；否则上线后想加过滤条件就得全量重建。

## 可能的追问

- 权限过滤放在向量库还是应用层？向量库层做粗过滤（租户、公开/私有），应用层再按细粒度 ACL 二次校验，两层都要有。
- 过滤后结果太少怎么办？先扩大 `ef_search` / 候选数，仍不够则明确告诉用户“在你的权限范围内没有找到”，而不是悄悄放宽条件。
