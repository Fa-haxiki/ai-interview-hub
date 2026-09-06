---
title: "LangChain、LangGraph、LangSmith、LangServe 各自负责什么？现在还怎么部署？"
category: ai
topic: frameworks
section: 生产实践
difficulty: easy
order: 3
tags: [LangSmith, LangServe, 生态, 部署]
sources:
  - title: "LangChain overview"
    url: "https://docs.langchain.com/oss/javascript/langchain/overview"
    lang: en
  - title: "LangGraph overview"
    url: "https://docs.langchain.com/oss/javascript/langgraph/overview"
    lang: en
  - title: "LangSmith"
    url: "https://docs.smith.langchain.com/"
    lang: en
createdAt: "2026-09-06"
---

一句话：**Chain 管组件，Graph 管控制流，Smith 管看见和评测，Serve / Agent Server 管把图变成服务。** 四个名字经常被混成「不就是 LangChain 吗」，面试里分开讲能显得你用过而不是只看过首页。

## 四层

- **LangChain**：模型、消息、Tool、Retriever、LCEL、`createAgent`。解决「积木和默认 Agent 循环」。
- **LangGraph**：State、边、检查点、中断、Send。解决「有状态的控制流」。现在官方 Agent 也建在它上面。
- **LangSmith**：trace、数据集、线上评测、Prompt 版本。解决「每一步喂给模型的东西到底是什么」。可以接 LangChain，也可以只当观测后端。
- **LangServe**：早期把 LCEL 链一键挂成 HTTP 服务。线性链的 demo 还够用；**有状态 Agent、HITL、按 thread 恢复，当前主线是 LangGraph Platform / Agent Server**，检查点和 Store 由服务端托管，不必自己先搭一套恢复语义。Node 侧更常见的是 NestJS Controller 里直接 `graph.invoke`。

包结构也常被问：`@langchain/core` 是稳定协议（Runnable、消息、回调），`langchain` 是产品层 Agent / 中间件，`@langchain/openai` 这类是各家模型，`@langchain/community` 是长尾集成。生产依赖尽量钉 core + 明确的 provider 包，少一次「community 里某个 loader 改了默认值」。

## 实践取舍

观测可以先于框架：哪怕自研编排，也建议把 messages 和工具入出参打进 Smith 或 Langfuse。部署不要为了「官方味道」强行上 Platform——QPS 稳定的同步 RAG，一个普通 HTTP 服务 + 自管检索就够。一旦有线程级状态、审批、多实例抢同一 `thread_id`，再上托管运行时才划算，否则你得自己保证检查点的一致性和租约。

## 可能的追问

- LangSmith 必须付费吗？开发期本地 / 免费额度通常够看 trace；评测集和在线监控再按量算。
- 还要不要学 LangServe？知道它是链的 HTTP 封装即可；新项目优先问「有没有线程状态」，有就按 Graph 运行时部署。
