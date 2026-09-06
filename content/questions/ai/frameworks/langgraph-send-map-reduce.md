---
title: "LangGraph 里并行节点和 Send API 怎么做扇出扇入？和普通条件边有什么差别？"
category: ai
topic: frameworks
section: LangGraph
difficulty: hard
order: 4
tags: [Send, map-reduce, 并行, fan-out]
sources:
  - title: "Use the Graph API - LangGraph docs"
    url: "https://docs.langchain.com/oss/javascript/langgraph/use-graph-api"
    lang: en
  - title: "Graph API overview"
    url: "https://docs.langchain.com/oss/javascript/langgraph/graph-api"
    lang: en
  - title: "LangGraph overview"
    url: "https://docs.langchain.com/oss/javascript/langgraph/overview"
    lang: en
createdAt: "2026-09-06"
---

一句话：**条数编译期就确定，用多条边扇出；条数运行时才知道，用 `Send`。** 前者是固定并行（检索 + 上网同时跑），后者是 map-reduce（先拆 N 个子问题，再对每个子问题跑同一节点）。汇合处必须给累积字段配 Reducer，否则并行写入会互相覆盖。

## 固定并行

两个节点都从同一个上游引出边，LangGraph 在同一个 super-step 里一起跑，写回共享 State。适合「互相独立、个数写死」的步骤：一路向量检索、一路关键词检索，再进入 Rerank。面试时我会画：

```text
          ┌→ vector_search ─┐
START → fanout              merge → rerank
          └→ keyword_search ┘
```

`messages` / `docs` 这类列表字段用数组 reducer（或自定义去重），`query` 这种单值用覆盖。漏配 Reducer 是并行场景第一坑：后写的检索结果把先写的吃掉，看起来像「有时少一路召回」。

## Send：运行时才知道扇出多少

条件边返回 `[new Send("worker", { item: x })]` 的列表，每个 Send 带**自己的一份输入**，而不是整份共享 State。这就是 map-reduce：规划节点吐出 5 个主题，就起 5 个 `research` 节点，各写各的，reduce 节点再读累积字段做综述。

和普通条件边的本质差别：条件边是「下一跳是哪个**已声明**的节点，大家仍读同一份 State」；Send 是「下一跳可以是同一节点的 N 个隔离实例，输入可以各不相同」。个数事先不知道时，不要去动态 `addNode`，那不是这套 API 的用法。

## 实践取舍

扇出要有上限：模型一次拆出 30 路调研，费用和限流会先炸。worker 必须幂等，因为时间旅行或失败重试会再跑一遍。reduce 节点不要假设「一定等到全部 worker」之外还有隐式屏障——图的汇合就是「这些 Send 都执行完再沿出边走」。子任务互不依赖才并行；有先后约束就老老实实串起来，假装并行只会让 State 更难推理。

## 可能的追问

- Send 的 worker 能再 Send 吗？能，但嵌套扇出更难观测，预算和深度要一起限。
- 和线程池自己 map 有什么差别？Send 走图运行时，能进 checkpoint、stream 和 Studio，失败可以按节点重放。
