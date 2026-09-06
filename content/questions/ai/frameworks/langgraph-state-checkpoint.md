---
title: "LangGraph 的 State、Reducer 和 Checkpointer 分别做什么？为什么生产里几乎必开检查点？"
category: ai
topic: frameworks
section: LangGraph
difficulty: hard
order: 2
tags: [State, Reducer, Checkpointer, Persistence]
sources:
  - title: "Persistence - LangGraph docs"
    url: "https://docs.langchain.com/oss/javascript/langgraph/persistence"
    lang: en
  - title: "LangGraph overview"
    url: "https://docs.langchain.com/oss/javascript/langgraph/overview"
    lang: en
  - title: "LangGraph - The LangChain Blog"
    url: "https://blog.langchain.dev/langgraph/"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

三者分层很清楚：**State 是图上共享的那份数据，Reducer 规定并发写入时怎么合并，Checkpointer 把每一步的 State 快照按 `thread_id` 持久化。** 生产里几乎必开检查点，因为 Agent 会跑很多步、可能暂停等人、进程随时会挂；没有快照，对话和任务进度会整段丢失。

## State

State 通常用 `Annotation.Root` 或 Zod `StateSchema` 声明，例如 `messages`、`query`、`docs`、`retryCount`。每个节点读整份（或需要的字段），返回一个「要更新的字段」补丁，而不是重写整个对象。消息列表这类字段几乎总会随步骤增长，所以默认覆盖语义不够用。

## Reducer

当多个节点同时写同一个 key，或同一字段被连续更新时，Reducer 决定合并规则：

- **overwrite**：后写覆盖前写，适合当前 query、最终答案；
- **append**（如 `(left, right) => left.concat(right)`，或现成的 `messagesStateReducer`）：把新元素追加到列表，适合 `messages`、工具调用记录。

漏配 Reducer 是常见坑：两个并行节点都返回 `messages`，后到的会把先到的盖掉，对话历史就缺了一截。设计 State 时我会先标清每个字段是「单值」还是「累积」。

## Checkpointer

`compile({ checkpointer })` 之后，每执行完一个节点就落一份 checkpoint。用同一个 `configurable.thread_id` 再 `invoke`，从图停下的地方继续。这直接支撑三件事：断点续跑、时间旅行（回到某步重放或改 State）、HITL 恢复。Checkpointer 管的是**线程内短记忆**；跨会话的用户偏好要用 Store，两者不要混为一谈。内存版 `MemorySaver`（`@langchain/langgraph`）重启即丢，生产要换成 Postgres / SQLite 等持久实现。`thread_id` 本身也有约束，例如 Postgres 实现里过长会写库失败，生产上我用 UUID 或短哈希，而不是把整段用户问题当 ID。

## 为什么生产必开

无检查点时，一次超时、一次 OOM、一次发布重启，进行中的多步任务就没了；人机审批也无法「挂起后再唤醒」。长时间跑的调研 Agent、要等人点头的写操作，本质上都依赖「停得住、唤得醒」。代价是存储增长，需要保留策略，但这个代价远小于线上任务不可恢复。面试里如果被问「检查点是不是过重」，我会反问：你的图会不会跨请求存活？只要会，检查点就不是优化项，而是正确性的一部分。

## 可能的追问

- `thread_id` 怎么设计？一次用户任务一个稳定 ID，恢复必须复用；换新 ID 等于空 State 重开。
- checkpoint 会不会无限涨？会，要按天数或步数裁剪，长对话还要另外做消息窗口压缩。
