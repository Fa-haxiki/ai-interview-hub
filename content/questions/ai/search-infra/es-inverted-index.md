---
title: "Elasticsearch 的倒排索引是什么？一次全文检索大概怎么执行？"
category: ai
topic: search-infra
section: Elasticsearch
difficulty: easy
order: 1
tags: [Elasticsearch, 倒排索引, 分析器, Lucene]
sources:
  - title: "Index fundamentals - Elasticsearch"
    url: "https://www.elastic.co/guide/en/elasticsearch/reference/current/documents-indices.html"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

倒排索引就是「词 → 文档列表」：每个 term 对应一条 posting list，记下哪些文档出现了这个词，以及词频、位置。它和正向索引正好相反——正向问「这篇文档有哪些词」，倒排问「这个词出现在哪些文档」。ES 的全文检索，本质是在 Lucene 倒排上查词、算分、取 Top-K。

## 写入时怎么建

`text` 字段先过分析器：字符过滤、分词、token 过滤（小写、停用词、同义词等）。落进倒排的是分析后的 term，不是原文。原始 JSON 通常还存在 `_source` 里，检索时用来回传正文，本身不参与匹配。分片内部再按不可变 segment 组织，查询时扫多个段再合并。

可以把它想成两本账：一本是词典（有哪些 term），一本是每条 term 后面挂的 posting list。短语查询还要看位置；过滤和聚合则更多走 `keyword` / doc values，不走这套全文倒排。

## 一次查询大概怎么走

1. Query 用**同一套分析器**切成 term。索引和查询分析不一致，就会「库里明明有词却搜不到」。
2. 查词典，取出各 term 的 posting list，按查询语义求交或求并。
3. 用 BM25 等算分，每个分片先出本地 Top-K。
4. 协调节点合并成全局 Top-K，再回分片取 `_source`（默认 query then fetch）。

一次 match 查询常常对应多个 term，ES 在倒排上做的是「先找候选，再算相关」。Refresh 之后新文档才进入可搜索的段，所以刚写入不一定立刻能搜到，这和 RAG「导入完立刻问答」是同一类时效问题。

## 和文档存储的关系

倒排负责「找」和「排」，`_source` / stored fields 负责「拿回原文」。Mapping 决定字段怎么被索引，Settings 决定分片和 refresh。RAG 里 BM25 召回靠倒排，拼进 Prompt 的 chunk 文本来自 `_source`。关掉 `_source` 能省磁盘，但高亮、reindex、把原文喂给模型都会变麻烦，知识库场景一般保留。

面试时我会补一句工程边界：倒排解决的是「词在不在、排多前」，不理解同义改写；语义近、字面不同的问题要交给向量一路。两者配合才是混合检索，而不是把倒排神话成万能索引。正向索引（文档 → 词）适合看一篇文档里有什么，倒排才适合从词出发扫全库。

## 可能的追问

- `keyword` 和 `text` 有什么区别？`keyword` 不分词、整值精确匹配，适合过滤和聚合；`text` 走分析器，适合全文。
- 为什么改分析器要重建索引？倒排里已经是旧 term，不 reindex 的话新查询对不上旧词典。
