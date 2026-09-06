---
title: "属性图（LPG）和 RDF 有什么区别？工业界 RAG 为什么更常见属性图？"
category: ai
topic: knowledge-graph
section: 图基础
difficulty: medium
order: 2
tags: [属性图, LPG, RDF, SPARQL, Cypher]
sources:
  - title: "Graph database concepts - Neo4j Docs"
    url: "https://neo4j.com/docs/getting-started/appendix/graphdb-concepts/"
    lang: en
  - title: "Introduction - Neo4j Cypher Manual"
    url: "https://neo4j.com/docs/cypher-manual/current/introduction/"
    lang: en
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
createdAt: "2026-09-06"
---

两者都叫「图」，但建模哲学不一样。**RDF 把世界拆成三元组，属性图把节点和边都当成可以挂键值的对象。** 工业界做 RAG 更常选后者，不是因为 RDF 不行，而是落地速度和业务系统对齐成本差一截。

## 模型差在哪

**RDF（Resource Description Framework）** 的基本单位是 `(主语, 谓语, 宾语)`。资源用 URI 标识，查询用 SPARQL，类型和推理靠 RDFS/OWL 本体。边本身不好直接挂「权重、生效日期」这类属性，传统做法要再引入中间节点（reification）；数据互换、跨机构对齐、需要严格推理时，这套标准很有价值。同一对主语宾语之间，同一种谓语在经典 RDF 里不能长出两条边，属性也要再拆三元组。

**属性图（Labeled Property Graph）** 里，节点有 Label，关系有类型和方向，**节点和关系都可以带属性**。Neo4j 文档里的模型就是 Node / Relationship / Property / Label。查询用 Cypher 或 Gremlin，写法接近「画出你要的那条路径」，开发者从业务对象（人、公司、文档）出发就能建模，不必先设计一套可发布的本体。同两个人之间可以同时有 `KNOWS` 和 `MANAGES`，边上直接写 `since`。

RDF 强在全局标识、本体约束、跨库互换；属性图强在局部属性、遍历性能、和业务表/文档字段一一对应。面试里不要说「属性图没有 schema」——Neo4j 的 schema 是可选的索引和约束，不是 OWL 那种推理规则。

## 为什么 RAG 更常见属性图

RAG 要快：从非结构化文档抽出「谁提到了谁、文档属于哪条产品线」，马上用路径把相关片段送给 LLM。属性图和 CRM、工单、代码仓库里的对象模型同构，Cypher 比 SPARQL 更贴近应用开发。Neo4j 这条线上还有向量索引、全文索引，种子检索和关系扩展可以放在同一个库里。

需要严格本体、跨组织发布、或必须做 OWL 推理时，再上 RDF / 三元组库。多数对内知识库没有这个约束，先上属性图，本体不够再补一层校验，比一上来建完整语义网更现实。选型口诀：要对齐业务对象、尽快上线检索，用属性图；要对齐公开词汇表、做数据互换，用 RDF。

## 可能的追问

- RDF-star 能不能给边加属性？能缓解一部分，但生态、人才和 RAG 工具链仍主要围着属性图转。
- 能不能两者并存？可以：用属性图跑在线检索，需要对外互换时再投影成 RDF；反过来把 RDF 导入 Neo4j 当属性图查，也是常见过渡。
