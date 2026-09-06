---
title: "Milvus 的 Collection、Partition、Segment 是什么？如何设计多租户和过滤？"
category: ai
topic: search-infra
section: Milvus
difficulty: medium
order: 2
tags: [Milvus, Collection, Partition, Segment, 多租户]
sources:
  - title: "Manage Collections - Milvus"
    url: "https://milvus.io/docs/manage-collections.md"
    lang: en
  - title: "What is Milvus? - Overview"
    url: "https://milvus.io/docs/overview.md"
    lang: en
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
createdAt: "2026-09-06"
---

我把三者对成数据库直觉：Collection 像表，Partition 像按某列预划分的分区，Segment 才是真正建索引、做 compaction 的物理单元。RAG 的多租户和元数据过滤，就是在这三层里选隔离粒度。

## 三层分别是什么

- **Collection**：一组实体加 schema。向量字段有维度和度量，还可以挂租户、部门、时间等标量字段。可开动态 schema，未声明字段进动态列，方便知识库元数据演进。
- **Partition**：按字段把数据切开。过滤刚好命中分区条件时，查询不用扫全表。
- **Segment**：写入先落 growing 段，到阈值 flush 成不可变的 sealed 段。索引按段建，compaction 合并小段。一次检索是「各段搜完再合并」。

Collection 决定「能存什么、怎么度量」；Partition 决定「先扫哪一块」；Segment 决定「索引和 compaction 的粒度」。三者不要混：过滤慢不一定是索引选错，也可能是该走分区却做成了全表标量扫。

## 多租户怎么切

- 租户少、隔离极严：独立 Collection，权限和生命周期最好管。
- 租户多、schema 相同：用 Partition Key（例如 `tenant_id`）哈希进固定数量分区，查询带 `tenant_id == "..."`，避免扫无关分区。
- 不要「一租户手建一个 Partition」——分区数量有上限，超多租户会撞墙。Partition Key 由系统管理分区，一般不能再手动切。

## 和 RAG 元数据过滤的关系

权限、产品线、时效是标量过滤。高选择字段（租户）用 partition key 或独立 collection；中等选择（语言、文档类型）用标量字段加过滤表达式。过滤键要在入库时规范化成枚举或时间戳，别拿自由文本当过滤条件。同一套 schema 还能挂多个向量字段（比如原文和问题改写），但过滤字段要提前想好，上线后再补往往意味着回填。

我的经验是：先把「每次查询一定带的条件」设成分区或 partition key，其余条件当标量过滤。千万级知识库里，租户过滤走错层，比索引选错更容易把延迟打爆。Segment 对业务几乎不可见，但导入后小段过多会拖查询，需要依赖 compaction，而不是手工按文档建「一个文件一段」。

## 可能的追问

- 动态字段能建标量索引吗？能，但高频过滤字段最好一开始就写进 schema。
- 按租户过滤还要不要在应用层校验？要。向量库做粗隔离，应用层再按 ACL 二次校验。
