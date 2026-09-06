---
title: "LangChain、LlamaIndex、LangGraph 怎么选？"
category: ai
topic: frameworks
section: 生产实践
difficulty: medium
order: 2
tags: [LangChain, LlamaIndex, LangGraph, 选型]
sources:
  - title: "LlamaIndex Documentation"
    url: "https://docs.llamaindex.ai/en/stable/"
    lang: en
  - title: "LangChain overview"
    url: "https://docs.langchain.com/oss/javascript/langchain/overview"
    lang: en
  - title: "LangGraph overview"
    url: "https://docs.langchain.com/oss/javascript/langgraph/overview"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

选型先看瓶颈在哪，而不是先站队。**LlamaIndex 偏索引 / 检索 / 文档，LangChain 偏通用编排与工具，LangGraph 偏有状态的多步 Agent。** 三者可以组合：用 LlamaIndex 建索引和 Retriever，用 LangChain 接模型和 Tool，用 LangGraph 跑循环和检查点。

## 各自擅长什么

LlamaIndex 的起点是「让 LLM 用上你的数据」：connector、解析、index、query / chat engine，RAG 从文档到提问的路径最短。文档形态复杂、要快速验证检索质量时，我优先看它。

LangChain 的起点是「把模型和外部世界接起来」：统一模型接口、Tool、Agent harness、大量集成。链路里检索只是一环，还要调 API、做结构化输出、换供应商，用它更顺。

LangGraph 不管文档怎么切，它管控制流：环、条件边、持久化、HITL。瓶颈是「模型要反复决策、流程会暂停恢复」时才需要它。官方也把 LangChain 定位成 Agent 组件层、LangGraph 定位成编排运行时。

## 一个判断问题

我会问自己：**现在最痛的是「找不到对的文档」，还是「找到了也不知道下一步该干什么」？** 前者先把分块、混合检索、Rerank 做扎实，框架选 LlamaIndex 或自研检索层都合理。后者是多跳、跨工具、要审批，上 LangGraph（组件仍可用另外两家）。两端都痛时可以组合，但不要三套默认行为叠在一起——检索策略必须有一个明确的主人。

一个常见误区是「Agent 框架能检索，所以检索框架可以不学」。复杂 PDF、表格、增量索引、权限过滤，这些 LlamaIndex 和自研检索栈更熟；反过来，「有 index 就能当客服 Agent」也会在循环和审批上翻车。选型表里我还会看团队存量：已经在 LangSmith 里盯 trace，就别为了 RAG 再换一套完全不同的约定，除非文档解析才是当前最大短板。

## 实践取舍

原型期用哪家能当天跑通就用哪家。进入生产后，我把「文档解析和检索」与「多步决策」拆开选，避免用通用 Agent 框架硬扛复杂 PDF，也避免用索引框架硬扛状态机。框架是加速器，评测集才是裁判：换框架前后要用同一份问题集看召回、忠实度和平均步数，而不是看哪份 quickstart 更好看。

## 可能的追问

- 能不能只用 LlamaIndex 做 Agent？可以，它也有 Agent 和 Workflow；若循环、检查点、HITL 是一等公民需求，我仍更倾向 LangGraph。
- 三套都引入会怎样？依赖和默认 Prompt 互相打架，排障成本通常高于省下的开发时间。
