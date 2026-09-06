---
title: "LangChain 里消息类型和 Prompt 怎么组织？多轮对话为什么容易把上下文塞爆？"
category: ai
topic: frameworks
section: LangChain 核心
difficulty: easy
order: 4
tags: [Messages, Prompt, ChatPromptTemplate, 上下文]
sources:
  - title: "Messages - LangChain docs"
    url: "https://docs.langchain.com/oss/javascript/langchain/messages"
    lang: en
  - title: "LangChain overview"
    url: "https://docs.langchain.com/oss/javascript/langchain/overview"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**模型看到的不是「一段 Prompt 字符串」，而是带角色的消息列表。** `System` / `Human` / `AI` / `Tool` 各管一块职责；模板只负责把变量填进这些角色。多轮对话把工具返回和旧轮次原样堆进去，上下文会先于业务逻辑崩掉。

## 四种消息各干什么

- **SystemMessage**：人格、约束、输出格式，尽量短而稳定。
- **HumanMessage**：当前用户问题，以及你主动塞进去的检索片段、表格。
- **AIMessage**：模型上一轮的回复；带 tool calling 时还会挂 `tool_calls`。
- **ToolMessage**：工具执行结果，必须对上对应的 `tool_call_id`，否则下一轮模型会对不齐。

单轮生成可以 `model.invoke("写一首诗")`，多轮、多模态、带工具就必须走消息列表。字典格式（`role` / `content`）也能用，但对象形式更好带 metadata、token 用量和 tool call。`ChatPromptTemplate` 的价值是把「系统提示 + 历史占位 + 本轮问题」声明成可复用模板，和具体模型解耦；少样本则用 `FewShotChatMessagePromptTemplate` 按例子动态插消息，而不是把十个例子写死在系统提示里。

## 为什么容易塞爆

Agent 每走一步都会追加：模型思考、工具参数、observation。检索再把几千 token 的 chunk 当 Human/Tool 消息塞回去，十轮之后窗口就被工具日志占满，真正的用户问题和系统约束反而被挤到前面被截断。另一个坑是隐式 Memory：早期 `ConversationBufferMemory` 把历史藏在对象里，调试时看不到发出去的完整 messages。现在更稳的做法是 **messages 作为显式 State**，由你决定保留、截断还是摘要。

## 实践取舍

我会按优先级裁：先留系统约束和最近 K 轮，工具返回只留结构化摘要，检索片段按本轮 query 重取而不是无限累积。长对话再加一轮摘要节点，把旧历史压成几条事实，而不是指望模型自己「记住重点」。面试里被问「Prompt 写在哪」，我会说：模板管骨架，运行时 messages 管状态，两者不要混成一个巨型字符串。

## 可能的追问

- ToolMessage 能不能省略？不能，缺了模型不知道工具到底返回了什么，下一步会瞎调或重复调。
- 系统提示要不要每轮都带？要，大多数 Chat API 不会帮你持久化 system；但内容应稳定，变的是后面的 messages。
