---
title: "怎么让模型稳定吐 JSON？Prompt 约束和 API 级 schema 怎么配合？"
category: ai
topic: prompt
section: 结构化输出
difficulty: medium
order: 4
tags: [结构化输出, JSON, Zod]
sources:
  - title: "Structured model outputs - OpenAI"
    url: "https://developers.openai.com/api/docs/guides/structured-outputs"
    lang: en
  - title: "Structured output - LangChain docs"
    url: "https://docs.langchain.com/oss/javascript/langchain/structured-output"
    lang: en
createdAt: "2026-09-06"
---

一句话：**能走模型原生的 JSON Schema / `withStructuredOutput`，就不要靠「请只输出 JSON」加正则。** Prompt 负责语义（字段含义、何时留空），schema 负责契约（类型、必填、枚举）。两边一起用，缺一就会在边界上炸。

## 三层，从硬到软

1. **API 约束**：`response_format` / `withStructuredOutput(zodSchema)`，供应商侧拒收不合法 token。最稳。
2. **业务校验**：用同一份 Zod 在 NestJS 里再 parse 一次，失败则带错误重试或降级人工。
3. **Prompt**：解释字段，给一个对、一个错的短例子。不要在 Prompt 里用散文重复整份 schema。

```ts
import { z } from "zod";

const Ticket = z.object({
  intent: z.enum(["refund", "invoice", "other"]),
  orderId: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});

const structured = model.withStructuredOutput(Ticket);
const ticket = await structured.invoke(messages);
```

枚举比「可以是退款或发票」可靠。可选字段用 `nullable`，别让模型发明 `"N/A"` 字符串。嵌套过深就拆两步：先路由再填表。

## 实践取舍

结构化输出解决的是接口，不解决幻觉：`orderId` 类型对了，值仍可能是编的。要引用库表就先工具查询再填。框架侧细节见 LangChain 题；这里要能讲清 Prompt 与 schema 的分工。

## 可能的追问

- 模型不支持原生 JSON 怎么办？退回 tool 策略或校验重试，并准备人工队列，不要在前端 `JSON.parse` 碰运气。
- schema 改了旧 Prompt 怎么办？schema 进版本库，和 Prompt、评测集一起发。
