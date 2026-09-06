---
title: "什么是 Agentic RAG？它和传统的“检索一次就生成”有什么区别？什么时候值得用、代价是什么？"
category: ai
topic: rag
section: 高级 RAG
difficulty: hard
order: 1
tags: [Agentic RAG, Agent, 迭代检索, 工程护栏]
sources:
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "Production RAG Architecture in 2026 - prompt20"
    url: "https://blog.prompt20.com/posts/rag-production-architecture/"
    lang: en
  - title: "RAG Interview Questions: Production Pipeline, Chunking, Reranking & Evaluation - interviewbaba"
    url: "https://interviewbaba.com/rag-interview-questions/"
    lang: en
createdAt: "2026-09-06"
---

我的答案是：**Agentic RAG 把检索从流水线里一个固定的环节，变成 Agent 可以反复调用的工具。** 传统 RAG 是“检索一次 → 拼进 Prompt → 生成”，检索结果好坏它不知道也不管；Agentic RAG 是一个循环：先规划要查什么，查完评估结果够不够，不够就改写 query、换知识源或者再查一轮，够了才回答。

## 从流水线到循环

```text
传统 RAG：   问题 → 检索 → 生成
Agentic RAG：问题 → 规划 → 检索 → 评估结果 ─┬─ 不够：改写 / 换源 / 拆子问题 → 再检索
                                          └─ 够了：生成答案（带引用）
```

实现上，检索就是 function calling 里的一个工具（`search_docs`、`query_sql`、`web_search`），模型自己决定调不调、调几次、传什么参数。“评估结果”是这个循环的关键一步：每轮检索后让模型判断“这些片段能不能回答问题、还缺什么”，缺的部分就变成下一轮的 query。

## 和 Query 路由、Self-RAG 的关系

上一题说过路由是 Agentic RAG 的最简形式，只做一次决策。把这个决策放进循环里、允许根据检索结果再决策，就是 Agentic RAG。Self-RAG 走的是另一条路：把“要不要检索、片段是否相关、生成有没有依据”训练成模型自己输出的反思 token，决策发生在模型内部；Agentic RAG 的决策在编排层，用 Prompt 和工具协议实现，不需要训练，换基座模型也不用重来。CRAG 则可以看成一个把纠错策略写死了的“单步 Agent”。

## 什么时候值得用

单次检索明显失败的三类问题：

- **多跳**：第二跳的关键词藏在第一跳的答案里，用原问题检索不到；
- **跨源**：要同时查文档库、数据库和外部搜索，再综合；
- **需要验证**：合规、医疗这类高风险场景，回答前要用检索结果反向核对结论。

简单的事实查询用它纯属浪费。生产里我的做法是两层路由：先用分类器判定问题复杂度，简单问题走单次检索路径，复杂问题才进 Agent 循环。

## 代价

- **延迟成倍**：单次 RAG 是 1 次 LLM 调用加 1 次检索，Agent 循环常见 3～10 次，P99 很难控制；
- **成本**：每一步都要把累积的上下文重新喂一遍，token 消耗远不止线性增长；
- **不可控循环**：模型反复改写却始终查不到，或者两个 query 来回震荡；
- **评估更难**：没有单一的“检索准确率”，要分别评每一步的决策和最终答案，而且同一问题两次运行的路径可能不同。

## 工程护栏

我在项目里必加四样：最大步数（通常 3～5）、token 或费用预算、整体超时（到期就用已收集的上下文尽力回答，而不是报错）、每一步的 trace（query、命中片段、评估结论全部记日志）。另外对 query 做去重，连续两轮检索命中集合没有变化就强制终止，这是防震荡最便宜的办法。

## 可能的追问

- “评估结果”这一步用什么做？可以让同一个 LLM 输出一个够/不够的判定，也可以用 Rerank 分数阈值做便宜的代理指标，两者结合最稳。
- 怎么评估一个 Agentic RAG 系统？分两层：端到端答案正确性（人工标注集或 LLM-as-judge），加上过程指标（平均步数、每步检索的 Context Precision、循环终止原因的分布），后者才是定位问题的关键。
