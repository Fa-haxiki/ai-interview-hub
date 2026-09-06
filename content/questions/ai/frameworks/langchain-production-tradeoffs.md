---
title: "生产环境要不要用 LangChain / LangGraph？常见坑和你的取舍是什么？"
category: ai
topic: frameworks
section: 生产实践
difficulty: hard
order: 1
tags: [生产实践, LangChain, LangGraph, 取舍]
sources:
  - title: "How to think about agent frameworks"
    url: "https://blog.langchain.dev/how-to-think-about-agent-frameworks/"
    lang: en
  - title: "LangGraph overview"
    url: "https://docs.langchain.com/oss/javascript/langgraph/overview"
    lang: en
  - title: "LangChain overview"
    url: "https://docs.langchain.com/oss/javascript/langchain/overview"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

我的取舍是：**原型期大胆用，生产期只保留真正赚到的那一层。** LangChain 适合快速拼模型和工具，LangGraph 适合管有状态的控制流；两者都不是默认必装。很多团队最后变成「LangGraph 管循环 / 检查点 / HITL，检索和 Prompt 用自研薄层」。

## 为什么有人愿意用

- **原型快**：connector 多，从「能调通模型」到「能检索 + 能调工具」按天计。
- **生态全**：换模型、接向量库、接 LangSmith tracing，不用每家 SDK 重写一遍。
- **可观测**：LangSmith 能把链 / 图的每一步、工具参数和 State 变化摊开，比自己埋点起步快。

Harrison Chase 也强调：做好 Agent 的难点是**每一步喂给模型的上下文是否正确**。框架如果挡住你看清 Prompt 和 messages，它就是在帮倒忙。

## 常见坑

- **抽象泄漏**：出 bug 时要穿过 Runnable、文档加载器、隐式 Memory，才能看到真正发出去的 token。
- **版本变动**：大版本重构频繁，升级成本经常高于业务代码本身。
- **过度封装**：一条 RAG 被包成「万能 Chain」，分块、检索、拼上下文都藏在默认值里，线上召回差却无从改。
- **调试难**：失败发生在解析、重试还是工具副作用，stack 往往对不齐你的业务日志。

## 我怎么选

线性、稳定、要极致可控的核心链路（检索、权限过滤、计费），我倾向自研几十到几百行薄封装，接口可替换。出现循环、分支、断点续跑、人机审批，我用 LangGraph，但节点函数尽量是普通 TypeScript，不把业务规则再包一层魔法。完全自研图运行时，只有在控制流本身是竞争力、且团队愿意维护检查点和恢复语义时才值得。

还有一个组织层面的信号：如果团队没人能讲清某条 Chain 实际发出去的 Prompt，框架就已经过重了。这时减脂比继续叠中间件更重要。模型变强不会自动消灭工作流，很多线上系统永远是「一段确定流程 + 局部 Agent」，框架要能同时表达这两端，而不是逼你选一个极端。

## 可能的追问

- 已经用上 LangChain 了怎么「减脂」？先冻结版本，把 Prompt 和检索从 Chain 里抽成显式函数，图只保留跳转。
- 不用框架可观测怎么办？至少记录每次请求的 messages、工具入出参、检索命中和耗时，Langfuse 一类也可以不绑 LangChain。
