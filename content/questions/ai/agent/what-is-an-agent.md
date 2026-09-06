---
title: "什么是 Agent？它和 Chatbot、Workflow、RAG 链怎么划界？"
category: ai
topic: agent
section: 基础概念
difficulty: easy
order: 1
tags: [Agent, Workflow, 工具调用]
sources:
  - title: "ReAct: Synergizing Reasoning and Acting in Language Models"
    url: "https://arxiv.org/abs/2210.03629"
    lang: en
  - title: "How to think about agent frameworks"
    url: "https://blog.langchain.dev/how-to-think-about-agent-frameworks/"
    lang: en
createdAt: "2026-09-06"
---

一句话：**Agent 是模型在循环里自己选下一步行动，并根据环境反馈再决定。** Chatbot 是单轮或带历史的生成；Workflow 是人写死的步骤图；RAG 链通常是「检索 → 生成」一次做完。中间态很常见：确定步骤里嵌一小段 Agent。

## 最小定义

三个零件：模型（决策）、工具/环境（副作用与观察）、循环（停下来的条件）。没有循环、下一步全是 if-else，那是工作流。没有工具、只是多轮聊天，那是对话。ReAct 把推理和行动写进同一轨迹，是这个定义的经典形态。

划界问题我用「谁拥有控制权」：控制权在代码，叫 Workflow；控制权在模型，叫 Agent；检索只是某一步的工具或固定前置，不自动升级成 Agent。

## 为什么面试爱问

因为很多人把任何 LLM 调用都叫 Agent，导致评测、权限、超时都按错套装来。真正的 Agent 要回答：最多几步、哪些工具、失败怎么停、写操作谁批。答不出这四项，就还没到能上线的 Agent。

## 可能的追问

- Agentic RAG 算不算 Agent？算弱 Agent：循环主要服务检索，仍要步数和停用条件。
- 模型变强是否还要工作流？要。权限、计费、合规步骤不该交给一次 function calling。
