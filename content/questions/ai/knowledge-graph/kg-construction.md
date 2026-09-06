---
title: "知识图谱怎么从非结构化文档构建？实体抽取和关系抽取的坑有哪些？"
category: ai
topic: knowledge-graph
section: GraphRAG 工程
difficulty: hard
order: 2
tags: [知识图谱构建, NER, 关系抽取, 实体对齐, Schema]
sources:
  - title: "Neo4j JavaScript Driver Manual"
    url: "https://neo4j.com/docs/javascript-manual/current/"
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

从文档建图，不是「丢给 LLM 让它吐 JSON」就完事。**抽取质量等于图质量，图质量等于以后所有 GraphRAG 答案的上限。** 正确顺序是：先定小范围 schema，再抽，再对齐，最后才全量。微软 GraphRAG 论文里的索引同样从文本块抽实体和关系，但它接下来走社区检测和摘要；这里只谈「如何得到一张能被 Cypher 查的属性图」，不把那套离线社区流程再讲一遍。

## 一条典型流水线

Neo4j 官方把建图拆成可单独替换的步骤，Node 里用 `neo4j-driver` 写回；面试按这条流水线说就够清楚：

```text
文档加载 → 切块 →（可选）算 embedding
    → Schema（节点类型 / 关系类型 / 允许的连接模式）
    → 词法图：Document -[:FROM_DOCUMENT]-> Chunk
    → NER + 关系抽取（LLM 或专用模型）
    → 按 schema 剪枝、写入
    → 实体对齐：合并「同一个现实对象」的重复节点
```

实体和关系可以靠专用 NER/RE 模型，也可以用 LLM 按 schema 出结构化结果。没有 schema 时，模型会发明一堆近义关系（`works_at` / `employed_by` / `任职于`），图随后没法遍历。Schema 里除了类型名，最好写清允许的连接模式，例如只能 `Person-[:WORKS_AT]->Company`，抽出来的反向或跨类边直接剪掉。

## 坑比抽取本身多

- **实体对齐 / 消歧**：「Neo4j」和「Neo4j Graph Database」是不是同一个节点？只按 `name` 精确合并会漏，模糊合并又可能把两个公司焊死。对齐错了，多跳路径全是假桥。
- **先设计 schema 再抽**：类型、必填属性、允许的三元组模式要先写死，抽完再用图剪枝丢掉越权边。先抽后规整，成本更高。
- **增量更新**：新文档进来要挂到旧节点上，不能每次重建；删除/更正文档时，只被它支撑的边要掉，被多篇支撑的边要降权或保留。微软 GraphRAG 的社区摘要更怕全量重算，属性图至少可以按文档粒度补边。
- **成本**：每块文本至少一次 LLM 抽取，再加消歧、校验，比纯 embedding 贵一到两个数量级。所以必须先用几十篇文档验证本体和准确率，再铺开。
- **幻觉边**：模型会把并列、比喻抽成事实。没有出处 chunk 的边不要进生产图。

原则就一句：小范围本体跑通评测，再全量；全量之后仍要把「抽错一条边」当成事故，而不是检索没召回。

## 可能的追问

- 词法图为什么还要留着？因为生成阶段最终要引用原文；实体节点负责跳关系，`Chunk` 负责把话还原给 LLM。
- 能不能完全不用 LLM 抽？结构化源（员工表、依赖 lockfile）应直接导入；非结构化部分才上 NER/RE，混在一起抽又贵又脏。
