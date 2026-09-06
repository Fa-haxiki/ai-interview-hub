---
title: "LangGraph 的时间旅行怎么做？和流式、重放有什么关系？"
category: ai
topic: frameworks
section: LangGraph
difficulty: hard
order: 7
tags: [time travel, updateState, checkpoint, 调试]
sources:
  - title: "Use time-travel - LangGraph docs"
    url: "https://docs.langchain.com/oss/javascript/langgraph/use-time-travel"
    lang: en
  - title: "Streaming - LangGraph docs"
    url: "https://docs.langchain.com/oss/javascript/langgraph/streaming"
    lang: en
  - title: "Persistence - LangGraph docs"
    url: "https://docs.langchain.com/oss/javascript/langgraph/persistence"
    lang: en
createdAt: "2026-09-06"
---

一句话：**时间旅行 = 从某份 checkpoint 接着跑或改 State 再分叉。** 检查点让图可恢复，流式让过程可看，时间旅行让过程可改。没有 Checkpointer 就没有时间旅行；流式只是观察，不会自动长出历史。

## Replay 和 Fork

- **Replay**：指定过去的 `checkpoint_id` 再 invoke。该点之前的节点不重跑（结果已存），之后的节点会重跑，包括 LLM、工具和 interrupt，结果可能和当时不同。
- **Fork**：对历史快照 `updateState`（比如改检索词、改工具参数），再 `invoke(null)` 沿新分支走。Studio 里「回到某步改一改」就是这个 API。

`getState` / `getStateHistory` 用来列快照。子图默认没有自己的逐步 checkpoint，父级只能把整段子图当一步回放；要在子图两步之间分叉，编译子图时打开独立 checkpointer，再用 `getState(config, { subgraphs: true })` 拿到子配置。

## 和流式的关系

流式（`messages` / `updates` / `values`）回答「此刻发生了什么」；时间旅行回答「如果当时那个字段不是这样呢」。排障流程一般是：先看 stream / LangSmith 定位坏步骤 → 取出对应 checkpoint → fork 验证修复。不要在生产请求路径上给终端用户开放任意 `updateState`，那等于允许改历史后重放带副作用的工具。

重放会再次执行节点后的副作用。写库、发邮件、扣费必须幂等或在 fork 时挡住，否则「调试一次」就是「事故一次」。只读检索相对安全，仍然要注意配额。

## 实践取舍

时间旅行是调试和评测利器：同一条失败轨迹改 Prompt 再跑，比重新采集用户输入快。线上恢复优先用「从中断处 resume」，而不是随手 fork。checkpoint 要有保留策略，否则历史无限涨，时间旅行本身也会变慢。面试被问「这是不是撤销」，我会说：它是分叉，原线程历史还在，新 `checkpoint_id` 代表另一条世界线。

## 可能的追问

- `invoke(null)` 为什么传空？表示不注入新用户输入，只从当前（或 fork 后的）State 继续。
- 和 git revert 像吗？更像 checkout 出新分支，不是改写已经发生的用户可见回复。
