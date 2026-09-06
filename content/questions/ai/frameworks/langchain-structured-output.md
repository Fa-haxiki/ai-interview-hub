---
title: "LangChain 怎么做结构化输出？withStructuredOutput 和 OutputParser 怎么选？"
category: ai
topic: frameworks
section: LangChain 核心
difficulty: medium
order: 5
tags: [结构化输出, OutputParser, Zod, responseFormat]
sources:
  - title: "Structured output - LangChain docs"
    url: "https://docs.langchain.com/oss/javascript/langchain/structured-output"
    lang: en
  - title: "Agents - LangChain docs"
    url: "https://docs.langchain.com/oss/javascript/langchain/agents"
    lang: en
  - title: "LangChain v1"
    url: "https://docs.langchain.com/oss/javascript/releases/langchain-v1"
    lang: en
createdAt: "2026-09-06"
---

一句话：**能让模型按 schema 吐字段，就不要先让它写散文再正则抠。** 单次调用用模型原生的 `withStructuredOutput`；Agent 循环里把 Zod schema 交给 `createAgent({ responseFormat })`，结果出现在 `structuredResponse`。旧的 `OutputParser` 更像后处理，只在模型不支持约束时当兜底。

## 三条路

1. **Provider 原生**：OpenAI / Anthropic / 部分 Groq 等支持 JSON Schema 或 `response_format`。LangChain 的 `model.withStructuredOutput(weatherSchema)` 会走这条，校验最严，少一次「再请你改成 JSON」。
2. **Tool 策略**：模型不支持原生结构化时，框架伪造一个「提交结果」的 tool，让模型通过 tool call 交字段。`createAgent` 里的 `toolStrategy(schema)` 就是这种；代价是多一轮工具消息，但兼容面更广。
3. **解析器兜底**：`JsonOutputParser` 吃自由文本。格式一漂就失败，要自己写重试。早期 Chain 大量靠它，现在我只留给小模型或必须兼容 completion 接口的场景。

`createAgent` 的改进是把结构化输出收进主循环，不再额外再调一次 LLM「请把刚才的回答变成 JSON」。你传 Zod（或兼容 Standard Schema 的对象），框架按模型能力自动选 `providerStrategy` 或 `toolStrategy`。失败（缺字段、一次交了两个 schema 工具）可以用 `handleErrors` 让模型改，而不是把脏对象丢给下游。

## 实践取舍

schema 要服务下游，而不是把自然语言问答硬掰成 20 个可选字段。枚举值写进 schema，比在系统提示里喊「必须是 A/B/C」稳。校验失败要记 trace：是模型漏字段，还是你的 schema 本身和问题不匹配。Agent 场景里「边调工具边填表」比「先聊天再解析」更不容易漂移。

面试时我会补一句：结构化输出解决的是**接口契约**，不解决幻觉——字段齐了，值仍可能是编的，该检索还是要检索，该引用还是要引用。

## 可能的追问

- 和 Function Calling 是一回事吗？机制相近，目标不同：tool 是为了副作用，structured output 是为了给程序一个类型安全的返回值。
- schema 很复杂怎么办？拆成两步：先路由到子 schema，再填；一次让模型填嵌套大对象，失败率会上去。
