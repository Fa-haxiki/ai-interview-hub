---
title: "GraphRAG 是什么？什么场景下值得引入知识图谱？成本和局限在哪？"
category: ai
topic: rag
section: 高级 RAG
difficulty: hard
order: 3
tags: [GraphRAG, 知识图谱, 社区摘要, 全局问题]
sources:
  - title: "From Local to Global: A Graph RAG Approach to Query-Focused Summarization (Edge et al., 2024) - arXiv"
    url: "https://arxiv.org/abs/2404.16130"
    lang: en
  - title: "Production RAG Architecture in 2026 - prompt20"
    url: "https://blog.prompt20.com/posts/rag-production-architecture/"
    lang: en
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

我的结论是：**向量 RAG 擅长“哪段话提到了 X”这类局部事实，但对“这批文档整体在讲什么”“A 和 C 之间隔着谁”这类全局性、关系性的问题基本失效，GraphRAG 就是为后者设计的。** 它不是向量检索的替代品，而是一种昂贵的补充，只在关系密集、需要全局理解的语料上值得上。

## 向量 RAG 的盲区

向量检索的前提是“答案集中在少数几个片段里”。两类问题打破了这个前提：

- **全局性、总结性问题**：“这 500 份客服记录反映的主要问题是什么”。答案散落在所有文档里，Top-K 取多大都只是抽样，本质上是 query-focused summarization 而不是检索；
- **多跳关系**：“供应商 A 的子公司给我们哪条产品线供货”。中间实体在问题里没出现，向量相似度找不到那座桥。

## 微软 GraphRAG 的流程

Edge et al.（2024）的方案分索引和查询两个阶段：

```text
索引：文本分块 → LLM 抽取实体、关系、claim → 合并成知识图谱
      → Leiden 分层社区检测 → 自底向上为每个社区生成摘要
查询：Local search  — 从问题命中的实体出发，拉邻居、关系、所属社区摘要和原文块
      Global search — 选一层社区摘要，map 阶段各自给出部分答案并打分，reduce 阶段汇总
```

关键在“社区摘要”：它们在索引时就预先生成，相当于给语料做了一份分层目录，全局问题不用扫原文，只在某一层的摘要上做 map-reduce。论文在约百万 token 的播客和新闻语料上与向量 RAG 做两两对比，GraphRAG 在 comprehensiveness 和 diversity 两个维度稳定胜出（胜率大多在六到八成），但在“直接回答具体问题”上没有优势。

## 什么场景值得上

- 实体和关系本身就是知识主体：组织架构、供应链、代码依赖、法律条款之间的相互引用；
- 用户常问归纳性、全局性的问题，而不是查一条规定；
- 需要可解释的推理路径：“为什么得出这个结论”可以沿着图上的边展示出来。

## 成本与局限

- **索引成本巨大**：每个 chunk 都要过一遍 LLM 做抽取，再为每个社区调 LLM 写摘要，比纯 embedding 高一到两个量级；论文里约百万 token 的语料用 gpt-4-turbo 建索引跑了近 5 小时；
- **更新困难**：新增文档会改变社区划分，摘要要重算，远不像向量库那样追加即可；
- **图质量依赖抽取质量**：实体消歧不到位就会出现同一个人两个节点，抽错的关系会被后续摘要放大，而且这种错误比向量检索失败更隐蔽；
- **查询延迟**：Global search 要过很多社区摘要，一次问答可能是几十次 LLM 调用。

## 轻量替代

上图之前我会先试三样便宜的东西：给 chunk 挂实体元数据做过滤和聚合；父子块或文档级摘要解决“需要更大上下文”的问题；混合检索加 Rerank 解决精确实体匹配。如果查询日志里确实有一批多跳、归纳类问题始终答不好，再只对那部分实体密集的语料建图，并用路由把“找片段”类问题继续送向量库。

## 可能的追问

- GraphRAG 和多跳问答是什么关系？图上的关系遍历是多跳的一种实现，代价是离线建图；如果多跳问题占比不高，用迭代检索在线解决更划算。
- 有没有更轻的图方案？LightRAG 之类省掉了社区检测和逐层摘要，只抽实体和关系并结合向量检索，索引成本低一档；再轻就是把实体当元数据挂在 chunk 上，用向量库的过滤能力实现“伪图”。
