---
title: "LangChain 1.x 的 createAgent 中间件是干什么的？和自己包一层有什么差别？"
category: ai
topic: frameworks
section: LangChain 核心
difficulty: medium
order: 8
tags: [createAgent, middleware, HITL, Agent]
sources:
  - title: "Middleware - LangChain docs"
    url: "https://docs.langchain.com/oss/javascript/langchain/middleware/overview"
    lang: en
  - title: "Agents - LangChain docs"
    url: "https://docs.langchain.com/oss/javascript/langchain/agents"
    lang: en
  - title: "LangChain v1"
    url: "https://docs.langchain.com/oss/javascript/releases/langchain-v1"
    lang: en
createdAt: "2026-09-06"
---

一句话：**中间件是插在 Agent 循环内部的钩子，用来改 Prompt、裁工具、重试、打码、做人审，而不用重写整张图。** `createAgent` 本身只是薄 harness（模型 + 工具 + 系统提示 + 中间件），编译结果仍是 LangGraph；中间件不是另一套运行时。

## 它插在哪

标准循环是「模型 → 可能调工具 → observation → 再模型」。中间件能在调用模型前改 messages、按用户身份裁工具清单、在工具执行前 `interrupt`、在失败时重试或提前结束、把 PII 打码后再送进模型。官方现成的有 HITL、摘要压缩、工具调用次数上限等。自定义钩子则处理租户配额、审计日志、把内部错误转成模型能读的短消息。

和「在图外面再包一层 NestJS / Express 中间件」不是一回事：HTTP 中间件看不到即将发给模型的那一包 messages；Agent 中间件正好卡在这个位置。这也是 1.x 替换旧 `createReactAgent` 的原因——定制点从「复制一份预置图」变成「往标准循环上插钩子」。

## 和手写节点比

只做「循环 + 几条横切策略」，中间件更短、升级也更跟得上官方 harness。一旦控制流不再是「转到没工具可调为止」——要先分类再路由到不同 Agent、要扇出并行调研、要和确定的 ETL 步骤交错——我就把 `createAgent` **整段当一个节点**丢进更大的 `StateGraph`。官方也这么推荐：中间件跟着这个节点走，HITL 和打码不会丢。

不要用中间件实现业务状态机。配额、打码、限步数是横切；「先检索再评估再生成」是领域流程，写成显式节点更可读，也更好单测。

## 可能的追问

- 中间件顺序重要吗？重要，打码必须在送模型之前，HITL 必须在写工具之前，摘要要在超窗之前。
- 能不能不用 createAgent 只用中间件？中间件是给这套 harness 的；纯 StateGraph 要把同样逻辑写成节点或包装函数。
