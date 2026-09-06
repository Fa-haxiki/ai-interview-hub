---
title: "什么是 LangChain？它解决什么问题，核心抽象有哪些？"
category: ai
topic: frameworks
section: LangChain 核心
difficulty: easy
order: 1
tags: [LangChain, Runnable, LCEL, 编排]
sources:
  - title: "LangChain overview"
    url: "https://docs.langchain.com/oss/python/langchain/overview"
    lang: en
  - title: "Models - LangChain docs"
    url: "https://docs.langchain.com/oss/python/langchain/models"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

LangChain 是 LLM 应用的**编排层**，不是模型本身。它解决的是：把 Prompt、检索、工具调用、输出解析这些步骤，用统一抽象串成可组合流水线，而不是每次手写一套 glue code。一句话：**模型负责推理，LangChain 负责把推理前后的步骤编排起来。**

## 它解决什么问题

直接调 OpenAI / Anthropic SDK 就能出 demo，但一旦要接检索、调外部工具、换模型、做流式输出，胶水代码会迅速膨胀。LangChain 给了一套统一接口：换模型不用改整条链路，检索器和工具可以当积木插拔。它覆盖的是「怎么把 LLM 调用、Retriever、Tool 串起来」，而不是「怎么训一个更好的模型」。

## 核心抽象

我面试时会按「输入 → 模型 → 输出 → 副作用」来讲：

- **Runnable / LCEL**：一切皆 Runnable，用 `|` 组合成链，统一 `invoke` / `stream` / `batch` / `ainvoke`。
- **Prompt**：把变量填进模板，和具体模型解耦。
- **Tool**：给模型可调用的外部能力（name + description + schema + 执行函数）。
- **Retriever**：按 query 取文档片段，是 RAG 的入口。
- **OutputParser**：把自由文本或结构化输出转成程序能用的类型。
- **Memory**：跨轮对话的状态。现代做法更常把 `messages` 显式放进 State，而不是依赖隐式 Memory 对象。

一条最小 RAG 就是 `retriever` 取出片段，再经 `prompt | model | parser` 生成答案。Agent 场景则再加 Tool，让模型在循环里决定要不要检索、要不要调外部 API。官方现在也把 Agent 收成 `create_agent` 这种薄 harness：模型、工具、系统提示、中间件按需组合，底层仍建在 LangGraph 上。

我会主动强调两件容易被问到的事：第一，LangChain 的模型接口是供应商无关的，换 OpenAI / Anthropic / 本地模型通常只改初始化，不改整条链；第二，它解决的是工程编排，不解决幻觉、检索质量或评测——那些要另做。

## 实践取舍

LangChain 适合**快速原型和统一集成面**：模型、向量库、工具有大量现成 connector。但它不等于生产必需——核心链路稳定后，很多团队会拆掉厚封装，只留编排和 tracing。我会明确说：用它是为了缩短从 0 到 1，不是把它当成不可替换的运行时。如果面试官问「你会不会从头手写」，我的答案是：demo 和集成面用框架，核心 Prompt 与权限过滤尽早抽成自己能读懂的函数。

## 可能的追问

- LangChain 和直接调 SDK 比，多了哪一层？多了可组合的编排和统一接口，模型调用本身没有变。
- Memory 现在还常用吗？多轮对话更常见的是把 `messages` 当作显式状态传入，而不是依赖隐式 Memory 单例。
