---
title: "上下文工程和 Prompt 工程有什么差别？messages 里到底该放什么？"
category: ai
topic: prompt
section: 基础技巧
difficulty: medium
order: 6
tags: [上下文工程, Prompt, messages]
sources:
  - title: "How to think about agent frameworks"
    url: "https://blog.langchain.dev/how-to-think-about-agent-frameworks/"
    lang: en
  - title: "Messages - LangChain docs"
    url: "https://docs.langchain.com/oss/javascript/langchain/messages"
    lang: en
createdAt: "2026-09-06"
---

一句话：**Prompt 工程管「怎么说」，上下文工程管「这一刻模型眼前有什么」。** 后者包括检索片段、工具观察、记忆、压缩后的历史。Agent 翻车经常不是系统提示写得不够文学，而是某一步 messages 里混进了不该看见的东西。

## 两层

Prompt：模板、角色、示范、输出协议。相对稳定，可以版本化。

上下文：每个请求现场组装。Harrison 的观点是 Agent 难在每一步喂给模型的上下文是否正确。检索 Top-K、上一步工具的 20KB HTML、三天前的闲聊，都会变成「提示词」的一部分，即使你没把它们写进 System。

所以预算要按块切：系统约束 N token、示范 M、检索 K、历史 H、本轮用户。超了先砍历史和工具原文，最后才砍系统约束。组装代码应是显式函数，而不是隐式 Memory 对象。

## 实践取舍

NestJS 里我会让 `buildMessages(state)` 单测：给定假检索和假工具结果，快照发出去的数组。这样改检索或改 Prompt 都看得到 diff。把「提示词」理解成单文件 `.txt` 的人，上了 Agent 会找不到 bug。

## 可能的追问

- 和 RAG 拼上下文是一回事吗？RAG 是上下文工程的一种来源；工具、记忆、多 Agent 交接也是。
- 上下文越长越好吗？不是。噪声和中间丢失会同时上升，见长文本与 lost-in-the-middle。
