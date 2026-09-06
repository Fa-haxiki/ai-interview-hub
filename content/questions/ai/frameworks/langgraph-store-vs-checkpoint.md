---
title: "LangGraph 的 Store 和 Checkpointer 有什么区别？长期记忆应该放哪？"
category: ai
topic: frameworks
section: LangGraph
difficulty: medium
order: 5
tags: [Store, Checkpointer, 长期记忆, Persistence]
sources:
  - title: "Persistence - LangGraph docs"
    url: "https://docs.langchain.com/oss/javascript/langgraph/persistence"
    lang: en
  - title: "Stores - LangGraph docs"
    url: "https://docs.langchain.com/oss/javascript/langgraph/stores"
    lang: en
  - title: "Checkpointers - LangGraph docs"
    url: "https://docs.langchain.com/oss/javascript/langgraph/checkpointers"
    lang: en
createdAt: "2026-09-06"
---

一句话：**Checkpointer 是一条线程的短记忆，Store 是跨线程的长期记忆。** 对话怎么往下接、HITL 怎么恢复，靠 checkpoint；用户偏好、已确认事实、组织级知识，靠 Store。两者经常一起 `compile({ checkpointer, store })`，不要用一份越积越大的 State 假装「用户永远记得」。

## 对照

| | Checkpointer | Store |
| --- | --- | --- |
| 存什么 | 图 State 的逐步快照 | 你定义的 namespace + key + JSON |
| 范围 | 单个 `thread_id` | 跨 thread，通常按 `user_id` / 租户切 |
| 典型用途 | 续聊、审批、时间旅行、故障恢复 | 偏好、档案、共享知识 |
| 访问方式 | invoke 时带 `thread_id` | 节点里 `get` / `put` / `search` |

换一个新的 `thread_id`，checkpoint 眼里是空 State，但 Store 里按用户取出的「口语用中文、不要打电话」还在。这就是长期记忆该有的边界。Store 还可以带语义 `search`，把记忆当小检索，而不是每次把全部档案塞进 messages。

## 为什么不能全塞进 State

State 每步都进 checkpoint，消息列表会线性涨。把「用户祖籍、常用项目、三年前的一次投诉」当作 messages 永久追加，窗口和存储都会先坏。正确拆法：本轮对话细节留在 State；跨会话仍成立的事实写入 Store，下一轮按需取几条拼进系统提示或工具结果。官方也把前者叫 short-term、后者叫 long-term。

内存版 `MemorySaver` / `InMemoryStore` 重启即丢。生产换 Postgres / Redis 等实现，并设 TTL 和加密（例如检查点 blob 的密钥）。不要把密码、身份证原文当记忆写入 Store。

## 实践取舍

记忆写入要有门槛：模型随口猜的「用户喜欢芒果」不能直接 `put`，至少用户确认或规则抽取后再落。读的时候限条数、带时间，避免把过期事实当真理。面试若问「记忆是不是就是 Memory 对象」，我会说：那是旧抽象；现在短记忆是 checkpoint 里的 messages，长记忆是 Store。

## 可能的追问

- 子图之间怎么共享记忆？共享 State key，或走 Store；默认子图 checkpoint 粒度不够时，跨图数据不要只靠父图快照碰运气。
- Store 能替代向量库吗？不能。它是小规模、带 namespace 的记忆层，文档检索仍要走专业索引。
