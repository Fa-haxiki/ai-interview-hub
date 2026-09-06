---
title: "什么是 LangGraph？它和 LangChain / 普通 DAG 工作流有什么区别？"
category: ai
topic: frameworks
section: LangGraph
difficulty: medium
order: 1
tags: [LangGraph, DAG, 控制流, Agent]
sources:
  - title: "LangGraph overview"
    url: "https://docs.langchain.com/oss/python/langgraph/overview"
    lang: en
  - title: "LangGraph - The LangChain Blog"
    url: "https://blog.langchain.dev/langgraph/"
    lang: en
  - title: "How to think about agent frameworks"
    url: "https://blog.langchain.dev/how-to-think-about-agent-frameworks/"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

LangGraph 是面向**有状态、可循环 Agent** 的底层编排运行时。它用有向图（可以含环）描述多步流程：节点做计算，边决定下一步，**State 在节点之间传递**。一句话：**LangChain 提供组件，LangGraph 提供控制流。**

## 和 LangChain 的分工

LangChain 擅长 Prompt、模型接口、Tool、Retriever 这些积木，以及用 LCEL 把它们排成一条（基本无环的）链。Agent 一旦需要「检索不够就再检索」「工具失败就换策略」「中途等人审批」，链就不够用了。LangGraph 不抽象 Prompt 长什么样，它管的是：当前 State 是什么、下一个节点是谁、失败了能否从检查点恢复。官方也强调：可以只用 LangGraph、不必绑死 LangChain 组件；反过来，现在的 LangChain Agent 底层已经建在 LangGraph 上。

## 为什么普通 DAG 不够

Airflow、Prefect 这类编排器默认是 **DAG**：编译期就能画出无环依赖，适合 ETL 和定时批处理。它们不擅长两件事：

1. **运行时循环**：根据模型输出回到已经执行过的节点；
2. **按模型决策跳转**：下一步不是配置写死的，而是 LLM 看完 State 才选。

Agent 本质上是「把 LLM 放进循环里当路由器」。LangGraph 把这个状态机显式画成图：固定边处理确定步骤，条件边处理模型驱动的分支，环处理重试和迭代检索。这也是它和「只是一套 Agent 抽象」的差别——它首先是编排框架，Agent 只是建在上面的一种用法。博客原文的动机也很直白：LCEL 很会拼链，但缺一种干净的「把环加进运行时」的方式，而环恰恰是 Agent 和普通 RAG 链的分水岭。

和「完全让模型自己玩」的 AgentExecutor 相比，图的好处是你可以强制某一步必须先检索、某一种工具失败必须走降级节点，而不是把所有控制权交给一次 function calling。确定性步骤和模型步骤可以混在同一张图里，这是生产里更常见的形态。

## 实践取舍

线性 RAG 不必上图。出现循环、分支、HITL、需要断点续跑时，我才用 LangGraph。图要保持小：确定逻辑写成普通函数节点，不要把所有 if-else 都交给模型选边。

## 可能的追问

- LangGraph 能不能当 Airflow 用？能跑批，但定位是低延迟、有状态的 Agent 运行时，不是替换数据仓库调度。
- 图和纯 while 循环比有什么好处？节点边界清晰，配合 Checkpointer 才能做时间旅行和人机恢复。
