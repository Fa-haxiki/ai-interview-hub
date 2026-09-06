---
title: "LangChain 里 Agent 和 Tool 是怎么配合的？和 Function Calling 是什么关系？"
category: ai
topic: frameworks
section: LangChain 核心
difficulty: medium
order: 3
tags: [Agent, Tool, Function Calling]
sources:
  - title: "Agents - LangChain docs"
    url: "https://docs.langchain.com/oss/javascript/langchain/agents"
    lang: en
  - title: "LangChain overview"
    url: "https://docs.langchain.com/oss/javascript/langchain/overview"
    lang: en
  - title: "How to think about agent frameworks"
    url: "https://blog.langchain.dev/how-to-think-about-agent-frameworks/"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**Tool 是模型可以调用的外部能力，Agent 是「选工具 → 执行 → 观察 → 再决策」的循环。** 现代 LangChain Agent 不再靠解析 ReAct 文本里的 `Action:` 字符串，而是绑定模型原生的 tool / function calling：模型输出结构化的工具名和参数，运行时负责执行并把 observation 塞回消息列表。

## Tool 长什么样

一个 Tool 至少四件事：

- **name**：模型用来点名的标识；
- **description**：决定模型何时会选它，写差了比代码 bug 更致命；
- **schema**：参数的 Zod / JSON Schema，约束调用参数；
- **执行函数**：真正发请求、查库、检索文档。

LangChain 把函数包装成 Tool（`tool` from `langchain`），再 `bindTools` 到 Chat Model 上。模型侧看到的是一份工具清单，不是一段自由文本说明书。工具数量要克制：十几个描述含糊的 Tool 比三五个边界清晰的更容易选错，必要时先用路由把工具集缩小再交给 Agent。

## Agent 循环

```text
用户输入 → 模型（带 tools）→ 要调工具？
    ├─ 是：执行 Tool → observation 写回 messages → 再问模型
    └─ 否：输出最终回答
```

这和「LLM + 工具 + 环境反馈」的标准 Agent 定义一致。Function Calling 是这个循环里**决策通道**的实现：用 API 的 `tool_calls` 字段传意图，而不是让模型在自然语言里夹带伪代码再正则解析。ReAct 字符串方案在格式漂移、参数转义、中英混排时很容易解析失败；原生 tool calling 把失败面从「解析」挪到「选错工具 / 传错参」，后者更好观测。没有原生 tool calling 的小模型，我才会退回严格约束的 ReAct，并加格式校验和重试，而不是一上来就解析自由文本。

## 必须加的护栏

循环默认不会自己停。生产里我必加：**最大步数**（常见 3～8）、**整体超时**、**工具白名单**（按用户权限裁剪，而不是把全部内部 API 暴露给模型）。写操作还要再加确认，不能让模型直接删数据。工具返回要短而结构化，把 10KB 日志塞回 messages 会迅速挤掉真正有用的上下文，下一步决策只会更差。同一工具连续失败要熔断，避免 Agent 换个说法再打一遍已经挂掉的 API。

## 可能的追问

- `createAgent` 和自己写循环有什么差别？前者是现成 harness，底层已经接到 LangGraph；自己写则完全控制每一步塞给模型的 messages。
- Tool description 怎么写才不容易选错？写清「何时用 / 何时不要用」、参数含义和副作用，比堆砌形容词有用。
