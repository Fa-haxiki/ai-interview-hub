---
title: "知识库文档频繁更新，向量索引怎么做增量同步？删除和更新怎么处理？"
category: ai
topic: rag
section: 生产工程与系统设计
difficulty: medium
order: 1
tags: [增量索引, 索引同步, 数据一致性, 幂等, 索引新鲜度]
sources:
  - title: "Production RAG Architecture in 2026 - prompt20"
    url: "https://blog.prompt20.com/posts/rag-production-architecture/"
    lang: en
  - title: "35 RAG Interview Questions and Answers - Interview Coder"
    url: "https://www.interviewcoder.co/blog/rag-interview-questions"
    lang: en
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

我的答案是：**把向量索引当作源系统的“派生视图”而不是数据源，增量同步就是四件事——检测变更、按文档粒度删旧写新、连带更新其他索引、监控新鲜度。** 换 embedding 模型那种全量重建是另一个问题，这里只讨论日常的增量更新。

## 怎么发现文档变了

按实时性从高到低有三种方式：

1. **源系统 webhook / CDC**：Confluence、飞书文档、业务数据库的变更事件直接推给同步服务，能做到分钟级，但要处理事件丢失和乱序。
2. **定时扫描 + 修改时间**：按 `updated_at` 拉取上次同步之后的文档。简单，但很多源的修改时间不可靠，批量迁移、改权限也会刷新它。
3. **内容哈希对比**：对正文算哈希，和上次记录不一致才处理。最可靠，还能过滤掉“改了时间没改内容”的假变更。

我一般用 webhook 做主路径，每天一次全量扫描哈希做兜底，防止事件漏掉。

## chunk 级别的稳定 id

增量同步能否做对，关键在 id 设计。每个 chunk 的 id 用 `doc_id + chunk 序号` 或 `doc_id + 内容哈希`，并把 `doc_id`、`source_version`、`updated_at` 写进 metadata：

- **更新**：按 `doc_id` 过滤删掉全部旧块，再写入新块。不要逐块 diff，分块边界一变序号就全乱，整篇重做最省心。
- **删除**：按 `doc_id` 删除，并同步清理 BM25 索引和元数据表。
- 用内容哈希做 id 的额外好处：文档小改时未变的块哈希相同，可以跳过重新 embedding。

## 删除是软还是硬

主流向量库都支持按 id 或 filter 的 upsert/delete，但语义差别不小：有的删除只是打 tombstone，要等 compaction 才真正释放空间；有的按 filter 删除很慢甚至不支持。所以我倾向**先软删除**——在 metadata 里标记 `is_deleted` 或 `expired_at`，查询时过滤——再由夜间任务批量硬删加 compaction。软删除还能应对误删回滚。

## 同步任务的工程要求

- **幂等**：同一条变更事件重放多次结果一致，“按 `doc_id` 删旧写新”天然满足。
- **重试与死信队列**：embedding 服务限流、向量库写超时都很常见，失败任务指数退避重试，超过次数进死信队列人工处理，别卡住整条队列。
- **多索引联动**：向量索引、BM25 索引、元数据和权限表在同一个任务里更新，否则混合检索会出现“BM25 召回了向量库已删的块”。
- **SLA 分级**：公告、价格类要求分钟级，普通文档小时级，归档资料天级；不同 SLA 走不同队列，避免大批量归档阻塞紧急更新。

## 一致性：新旧块短暂并存

删旧写新不是原子操作，中间会有几秒到几分钟“两版都在”或“两版都不在”。我的做法是**先写新、再删旧**，chunk 带 `source_version`，检索后按 `doc_id` 去重只保留最新版本。这比追求向量库事务简单得多，也够用。

## 监控索引新鲜度

- 同步延迟：源文档 `updated_at` 到索引可查询的时间差，看 P50/P95。
- 积压：队列长度、死信数量。
- 对账：每天比对源系统与索引的 `doc_id` 集合和哈希，发现漂移就补偿。
- 探针：新文档写入后用一条已知问题查一次，确认真的能被召回。

## 可能的追问

- 文档很大但只改了一段，非得全篇重做吗？用内容哈希做 chunk id 可以只重算变化的块；但如果改动让分块边界移动，还是整篇重做更稳。
- 语义缓存里的旧答案怎么处理？缓存条目记录依赖的 `doc_id`，文档更新时主动失效，或者给缓存设较短的 TTL。
