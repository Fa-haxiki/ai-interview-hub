---
title: "原生 Function Calling 和解析 ReAct 文本有什么差别？生产该用哪个？"
category: ai
topic: agent
section: 规划与工具调用
difficulty: medium
order: 2
tags: [Function Calling, ReAct, tool_calls]
sources:
  - title: "Function calling - OpenAI"
    url: "https://developers.openai.com/api/docs/guides/function-calling"
    lang: en
  - title: "ReAct: Synergizing Reasoning and Acting in Language Models"
    url: "https://arxiv.org/abs/2210.03629"
    lang: en
createdAt: "2026-09-06"
---

一句话：**生产默认走模型原生的 `tool_calls`，不要解析 `Action: search[...]` 字符串。** Function Calling 把「调用意图」变成结构化字段；ReAct 文本方案把解析失败也变成一种幻觉。没有原生工具接口的小模型，才退回严格约束的文本协议 + 校验重试。

## 失败面不同

文本 ReAct：格式漂移、括号转义、中英混排、模型把观察写进 Action。你的正则一松，就可能执行错函数。

原生调用：模型输出工具名 + 参数 JSON，运行时校验后再执行。失败从「解析」变成「选错工具 / 传错参」，后者能打点、能重问、能熔断。并行 tool calls 也有明确数组，不必自己拆。

```ts
const tools = [
  {
    type: "function",
    function: {
      name: "lookupOrder",
      description: "按订单号查询状态。仅当用户给出明确订单号时使用。",
      parameters: {
        type: "object",
        properties: { orderId: { type: "string" } },
        required: ["orderId"],
      },
    },
  },
];
```

description 决定会不会选它，比代码本身更致命。写清「何时不要用」。

## 实践取舍

循环外层仍是你的：最大步数、超时、工具白名单按用户 ACL 裁。框架可以用 `createAgent`，但协议层要能讲清 tool_call_id 必须回传对应 Tool 消息，否则下一轮会对不齐。

## 可能的追问

- 并行调用要注意什么？互相依赖的两个工具不要并行；写操作并行要幂等。
- 和结构化输出冲突吗？有的模型不能同时强制 schema 又调多个业务工具，要看供应商能力或拆成两步。
