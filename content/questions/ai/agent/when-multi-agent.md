---
title: "什么时候该上多 Agent？一个 Agent 加路由为什么往往更够用？"
category: ai
topic: agent
section: 评估与可靠性
difficulty: medium
order: 7
tags: [多 Agent, 路由, 职责隔离]
sources:
  - title: "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation"
    url: "https://arxiv.org/abs/2308.08155"
    lang: en
  - title: "How to think about agent frameworks"
    url: "https://blog.langchain.dev/how-to-think-about-agent-frameworks/"
    lang: en
createdAt: "2026-09-06"
---

一句话：**多 Agent 的收益来自工具隔离和职责隔离，不是来自角色扮演人数。** 工具少于一组、路径清楚，一个 Agent + 意图路由更稳、更便宜、更好评测。只有「专家之间不该看见对方的工具或完整对话」时，拆分才值回协调成本。

## 先问两个问题

专家要不要共享全部 messages？下一步由中央定还是当前专家定？共享 + 中央定，用 Supervisor 或干脆一个 Agent 换系统提示。不共享、一次任务一次调用，把子 Agent 当工具。当前专家最清楚该交给谁，再用 Handoff。实现细节见 LangGraph 多 Agent 题。

AutoGen 展示了对话式多智能体，演示很炫。生产里「开会式」多 Agent 会把上下文和费用烧在互相客套上，错误还难以归因。

## 实践取舍

先做路由表：退款走工单 Agent（只有订单工具），知识问答走 RAG（只有检索）。总步数和总费用封顶放在父层。交接带短摘要，不传对方的工具日志。面试里主动说：三个描述打架的工具，先拆工具，再拆 Agent。

## 可能的追问

- 多 Agent 怎么评测？按任务成功率 + 越权 + 平均交接次数；不要只看对话好不好看。
- 和微服务类比？像是，但多了不确定的模型跳转，服务契约要用 schema 和权限补上。
