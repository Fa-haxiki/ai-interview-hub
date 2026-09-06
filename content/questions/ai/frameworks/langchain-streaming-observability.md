---
title: "LangChain / LangGraph 的流式输出怎么做？Callback 和 LangSmith 分别看什么？"
category: ai
topic: frameworks
section: LangChain 核心
difficulty: medium
order: 6
tags: [stream, Callback, LangSmith, 可观测]
sources:
  - title: "Streaming - LangGraph docs"
    url: "https://docs.langchain.com/oss/javascript/langgraph/streaming"
    lang: en
  - title: "LangChain overview"
    url: "https://docs.langchain.com/oss/javascript/langchain/overview"
    lang: en
  - title: "LangSmith"
    url: "https://docs.smith.langchain.com/"
    lang: en
createdAt: "2026-09-06"
---

一句话：**给用户看的是 token 流，给排障看的是每一步的输入输出。** `stream` 推增量（JS 里本身就是 async iterable）；Callback 和 LangSmith 把链或图展开成 trace。两者都要，但不要混用：前端不能靠翻 LangSmith 页面来打字机效果。

## 流式先分清「流什么」

线性 LCEL 上，`chain.stream(q)` 默认把模型 token 往外透。图上要选 mode：

- **`messages`**：任意节点里的 LLM token + metadata，适合聊天框；
- **`updates`**：每个节点返回的 State 补丁，适合进度条（「正在检索 / 正在写大纲」）；
- **`values`**：每步之后的完整 State，调试方便，给前端太大；
- **`custom`**：节点里 `getWriter()` 主动推业务事件。

新版本更推荐按投影拆开消费（messages / values / subgraphs 各一条迭代器），避免在一个循环里 `if type == ...` 越堆越乱。`invoke` 等整图结束，用户会以为卡住；生产聊天必须 stream。还要注意：有的节点先跑检索再调模型，token 不会立刻出来，要用 `updates` 或 custom 事件先报「已命中 8 段」。

## Callback 和 LangSmith

Callback 是进程内钩子：`handleLLMStart`、`handleToolEnd`、token 回调。适合打日志、计数、把事件转进自己的总线。LangSmith 是把整棵 Runnable / 图序列化成可查的 trace：每步 messages、工具参数、延迟、token。Harrison 的观点我认同——Agent 难在**每一步喂给模型的上下文对不对**，trace 就是为了把这层掀开。

本地没配 API Key 时 Callback 还能干活；线上没有 trace，一次「偶发选错工具」只能靠用户截图。数据集和评测也挂在 Smith（或 Langfuse）上：同一条链换 Prompt，看工具步数和正确率，而不是看感觉。

## 实践取舍

前端只订 `messages` + 少量进度事件，完整 State 不要出网关。敏感字段（用户手机号、检索原文）在进 Smith 前打码。Callback 里做重活会拖住流式，统计和落库走异步。面试被问「为什么线上和本地答案不一样」，我先对同一 `run_id` 把发出去的 messages 和工具 observation 摊开，而不是先猜模型温度。

## 可能的追问

- `stream` 和 `streamEvents` 怎么选？只要 token 用 `stream`；要节点起止、检索器命中这类事件再用 `streamEvents` / 多 mode。
- 不用 LangSmith 怎么办？至少自己记 messages、工具入出参、检索命中和耗时，Langfuse 也能接同一套 Callback。
