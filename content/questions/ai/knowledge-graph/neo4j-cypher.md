---
title: "Neo4j 的数据模型是什么？Cypher 怎么写常见查询（匹配、最短路径、邻居）？"
category: ai
topic: knowledge-graph
section: Neo4j
difficulty: medium
order: 1
tags: [Neo4j, Cypher, MATCH, shortestPath, 可变长度路径]
sources:
  - title: "Graph database concepts - Neo4j Docs"
    url: "https://neo4j.com/docs/getting-started/appendix/graphdb-concepts/"
    lang: en
  - title: "MATCH - Neo4j Cypher Manual"
    url: "https://neo4j.com/docs/cypher-manual/current/clauses/match/"
    lang: en
  - title: "Shortest paths - Neo4j Cypher Manual"
    url: "https://neo4j.com/docs/cypher-manual/current/patterns/shortest-paths/"
    lang: en
  - title: "Introduction - Neo4j Cypher Manual"
    url: "https://neo4j.com/docs/cypher-manual/current/introduction/"
    lang: en
createdAt: "2026-09-06"
---

Neo4j 用的是属性图。四个零件：**Node**（实体）、**Relationship**（有向、必须有且仅有一个类型）、**Property**（节点和边上的键值）、**Label**（给节点分类，一个节点可以有多个）。关系不能悬空，创建时必须有头尾节点；节点可以自己连自己。Schema 是可选的：可以先灌数据，再按需加索引和约束。Label、关系类型、属性键都区分大小写。

Cypher 是声明式查询语言，核心句式是 `MATCH` 画出模式，`WHERE` 收紧条件，`RETURN` 只要需要的字段——尽量别整节点扔回去。官方 MATCH 文档强调：`WHERE` 是模式的一部分，要跟对应的 `MATCH` 写在一起，不要当成事后过滤随便乱挂。多条 `MATCH` 可以串联：前一条绑住的变量，后一条接着用，中间需要收缩结果时用 `WITH`。

## 匹配：人—公司

```cypher
MATCH (p:Person)-[:WORKS_AT]->(c:Company)
WHERE p.name = $name
RETURN p.name AS person, c.name AS company
```

`MATCH` 先按 Label 和关系类型收窄，`WHERE` 用属性过滤。参数 `$name` 比字面量好，计划可以复用。箭头表示方向：上面是「人指向公司」的任职边。若领域上方向不重要，可以写成不带箭头的 `--`，规划器会两边都试。多跳模式也能写在一条 `MATCH` 里，例如人→公司←产品，用来回答「这人任职的公司卖过哪些产品」。

## 邻居：可变长度路径

```cypher
MATCH (p:Person {name: $name})-[:KNOWS*1..3]-(other:Person)
RETURN DISTINCT other.name
```

`*1..3` 是 1 到 3 跳的 `KNOWS`。面试里要强调：**必须写上限**。不设上限会沿着社交图炸开。`DISTINCT` 是因为同一人可能经多条路径到达。文档—实体的两跳共现也是同一套路：从一篇文档走到实体，再回到其他提到它的文档，这就是图上的「共现检索」，比把两篇文档分别做向量检索再手工对齐更稳。

```cypher
MATCH (d:Document {id: $docId})-[:MENTIONS]->(e:Entity)<-[:MENTIONS]-(other:Document)
RETURN other.title, e.name
```

## 最短路径

新语法用 `SHORTEST`（按 hop 数），`shortestPath()` 仍可用但不再符合 GQL：

```cypher
MATCH path = SHORTEST 1
  (a:Person {name: $from})-[:KNOWS|WORKS_AT]-+(b:Person {name: $to})
RETURN [n IN nodes(path) | n.name] AS hops
```

`-+` 表示一条或多条关系。`SHORTEST 1` 在并列最短时只返回一条，哪一条不确定；要全部并列最短用 `ALL SHORTEST`。加权最短路、A* 应走 Graph Data Science，不要硬用 Cypher 穷举。路径长度 0 表示只有一个节点、没有边，面试偶尔会问到这个定义。

## 可能的追问

- Label 和关系类型的命名习惯？节点 PascalCase（`:Person`），关系 SCREAMING_SNAKE（`:WORKS_AT`），属性 camelCase（`firstName`），三者都区分大小写。
- 方向一定要写对吗？关系在存储里总是有向的，查询可以忽略方向；只有领域本身双向时才建反向边，不要为了好写就复制一整份。
