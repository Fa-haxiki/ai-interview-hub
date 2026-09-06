---
title: "Neo4j 查询慢时怎么排查？索引、Cardinality、深度遍历有哪些注意点？"
category: ai
topic: knowledge-graph
section: Neo4j
difficulty: hard
order: 2
tags: [Neo4j, 索引, EXPLAIN, PROFILE, Cardinality]
sources:
  - title: "Indexes - Neo4j Cypher Manual"
    url: "https://neo4j.com/docs/cypher-manual/current/indexes/"
    lang: en
  - title: "Query tuning - Neo4j Cypher Manual"
    url: "https://neo4j.com/docs/cypher-manual/current/query-tuning/"
    lang: en
  - title: "Understanding execution plans - Neo4j Cypher Manual"
    url: "https://neo4j.com/docs/cypher-manual/current/planning-and-tuning/execution-plans/"
    lang: en
  - title: "Graph database concepts - Neo4j Docs"
    url: "https://neo4j.com/docs/getting-started/appendix/graphdb-concepts/"
    lang: en
createdAt: "2026-09-06"
---

慢查询的第一反应不是「再加一台机器」，而是：**有没有先用索引钉住锚点，再沿边走；遍历有没有上限。** Neo4j 的优势是从已知节点出发 traverse，最怕的是 AllNodesScan 之后再过滤。官方 query tuning 的总目标也写得很直白：只从库里取出后面真正用得到的数据。

## 三种索引各管什么

Neo4j 5 起索引分两类。**检索性能索引**（range / text / point / token lookup）做精确匹配；**语义索引**做近似——全文索引和向量索引。索引是主数据的一份拷贝，建好后由数据库自动填充和更新。

- **属性索引（range 等）**：`Person.name`、`Document.id` 这种等值、范围查找。没有它，`WHERE p.name = $name` 往往先扫整个 Label。
- **全文索引**：实体别名、文档标题的分词搜索，实体链接常用。
- **向量索引**：节点或关系上的 embedding，用来「语义上先找到种子节点」，再 Cypher 扩展。维度必须和模型一致。

查询里不用点名用哪条索引，规划器自己选。你要保证锚点属性上有索引，并且 `MATCH` 带 Label、关系带类型，规划器才有统计可用。字面量改成参数，还能让执行计划复用，避免每次解析都重规划。

## Cardinality 和深度

规划器按估算行数选计划。锚点太宽（`:Person` 上千万再 `*..6`）或超高扇出节点（热门实体）会让中间行数爆炸——这就是 cardinality 失控。多数算子是「来一行做一次」，中间 Rows 翻十倍，后面整条流水线都乘上去。可变长度路径必须写死 hop，例如 `*1..3`；官方也要求：尽早过滤，不要返回整节点，给可变长度模式设上限。

## 怎么看计划

- `EXPLAIN`：只规划不执行，看估行、有没有 NodeIndexSeek。出现 AllNodesScan / 大 Label Scan 再 Filter，就是缺索引或谓词太晚。
- `PROFILE`：真跑，看每步 Rows 和 DB hits。Rows 陡增的那一步就是炸点。DB hits 是存储层读写次数，和返回行数不是一回事。它比执行本身更吃资源，只在调优时用。

调优顺序：给锚点建索引 → 缩小 Label/关系类型 → 限制 hop → 再考虑拆查询或 GDS 投影。不要一上来全图最短路。

## 可能的追问

- 为什么「先定位再 traverse」比「先 traverse 再过滤」快一个数量级？因为图遍历的代价和中间行数成正比，锚点从 1 个变成 10 万个，后面每一跳都乘上去。
- 统计信息过期会怎样？规划器按旧 cardinality 选错计划；数据量变化大时要关注 replanning 和采样是否跟上。
