---
title: "System、User、Assistant、Developer 角色各写什么？为什么不要把一切塞进一轮 User？"
category: ai
topic: prompt
section: 基础技巧
difficulty: easy
order: 1
tags: [System Prompt, 消息角色, 上下文工程]
sources:
  - title: "Messages - LangChain docs"
    url: "https://docs.langchain.com/oss/javascript/langchain/messages"
    lang: en
  - title: "Prompt engineering - OpenAI"
    url: "https://developers.openai.com/api/docs/guides/prompt-engineering"
    lang: en
createdAt: "2026-09-06"
---

一句话：**角色是给模型的权限和稳定性分层，不是装饰。** System（有的 API 叫 Developer）放稳定约束；User 放本轮任务和可变材料；Assistant 是模型自己说过的话；Tool 是外部结果。全塞进一条 User，约束会被长文档淹没，也没法做缓存和审计。

## 怎么拆

- **System / Developer**：身份、拒答边界、输出格式、可用工具的原则。尽量短、少改，才能命中 Prompt Cache。
- **User**：当前问题、上传的摘要、检索到的片段。片段要标明来源，避免模型当成系统指令执行（这是注入面）。
- **Assistant**：历史回复。多轮里它是状态，不是你重新编的旁白。
- **Tool**：函数返回。保持短、结构化，10KB 日志不要原样回灌。

有的供应商把「开发者消息」权重大于用户消息，用来防「忽略以上指令」。即便如此，也别假设模型会永远听话——检索文本里的指令仍可能抢权，见安全主题。

## 实践取舍

我会把公司政策放 System，把「本周制度摘录」放 User 并包在明确的数据围栏里（例如 `<<doc>>`）。NestJS 里 messages 就是数组，不要拼接成一个超长 string 再 `invoke`。角色错了，后面所有 Prompt 技巧都像在漏水的桶里调味。

## 可能的追问

- 没有 System 字段的模型怎么办？把约束放第一条 User，并在每轮重复短约束，接受更差的稳定性。
- 历史要原样留吗？留最近 K 轮 + 摘要，工具结果只留本轮需要的字段。
