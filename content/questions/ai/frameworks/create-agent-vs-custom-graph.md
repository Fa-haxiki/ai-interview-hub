---
title: "什么时候用 createAgent 就够，什么时候必须手画 LangGraph？"
category: ai
topic: frameworks
section: 生产实践
difficulty: medium
order: 4
tags: [createAgent, LangGraph, 选型, 编排]
sources:
  - title: "Agents - LangChain docs"
    url: "https://docs.langchain.com/oss/javascript/langchain/agents"
    lang: en
  - title: "Middleware - LangChain docs"
    url: "https://docs.langchain.com/oss/javascript/langchain/middleware/overview"
    lang: en
  - title: "How to think about agent frameworks"
    url: "https://blog.langchain.dev/how-to-think-about-agent-frameworks/"
    lang: en
createdAt: "2026-09-06"
---

一句话：**控制流仍是「选工具直到结束」，用 `createAgent`；控制流是领域状态机，手画图。** 前者用中间件补横切能力，后者用节点表达业务步骤。两者不是对立：标准 Agent 可以整段当图上的一个节点。

## createAgent 够用的信号

- 入口就是用户一句话，出口就是回答或一次结构化结果；
- 中间的变化主要来自「调不调工具、调哪一个」，没有必须插入的确定步骤；
- 你要的定制是打码、限步、HITL、摘要压缩、模型降级——这些是中间件，不是新拓扑。

这时自己画一张「模型节点 ↔ 工具节点」的环，只是把官方 harness 重写一遍，还更容易漏掉 tool_call_id 对齐、并行工具、结构化输出收口。1.x 的 `createAgent` 已经建在 LangGraph 上，该有的检查点和 stream 它都有。

## 必须手画的信号

- 生成前**必须**检索，或检索不够必须改写再搜，不能把决定权全交给一次 function calling；
- 有分类 / 分流 / 多专家，或要 fan-out 调研再汇总；
- 确定步骤和模型步骤交错：先查权限、再生成、再写库，写库前审批；
- 要在某两个业务节点之间时间旅行、单独重试，而不是只在通用 Agent 环里打转。

这些用中间件硬拧，会变成「钩子里暗藏状态机」，下一任读不懂。画图的成本是多写几个普通函数，收益是边可以单测、路径可以穷举。

## 实践取舍

我的默认路径：先 `createAgent` 验证工具和 Prompt，控制流一出现第二个分叉，就把确定部分提成节点，Agent 缩成其中一块。不要等「框架不够用了」再拆，那时 messages 形状已经和隐含循环绑死。完全自研 while 循环只有在你连 Graph 的检查点语义都要自己定义时才值得。

## 可能的追问

- 手画之后还能用中间件吗？能，把 `createAgent(...)` 的编译结果当作子图 / 节点加进去，钩子跟着走。
- 线性 RAG 要不要 createAgent？不要。必检索的问答用链或两三个节点就够，上 Agent 只会多一次「决定不检索」的失败模式。
