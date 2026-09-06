---
title: "LangGraph 做多 Agent 有哪些套路？Supervisor、Handoff 和子图怎么选？"
category: ai
topic: frameworks
section: LangGraph
difficulty: hard
order: 6
tags: [多 Agent, Supervisor, Handoff, subgraph]
sources:
  - title: "Subgraphs - LangGraph docs"
    url: "https://docs.langchain.com/oss/javascript/langgraph/use-subgraphs"
    lang: en
  - title: "Graph API overview"
    url: "https://docs.langchain.com/oss/javascript/langgraph/graph-api"
    lang: en
  - title: "Use the Graph API"
    url: "https://docs.langchain.com/oss/javascript/langgraph/use-graph-api"
    lang: en
  - title: "How to think about agent frameworks"
    url: "https://blog.langchain.dev/how-to-think-about-agent-frameworks/"
    lang: en
createdAt: "2026-09-06"
---

一句话：**多 Agent 首先是控制流问题，不是再堆几个 Prompt。** 常用三条：Supervisor 中央调度、Handoff 把控制权交出去、子图把专职 Agent 封成节点。选哪条看「谁有权决定下一步」以及 State 要不要共享。

## 三种套路

**Supervisor**：一个路由节点看 State，调用（或边指向）检索 Agent、写代码 Agent、总结 Agent。控制权始终在中央，好审计、好限步数，代价是每一步都要回传。适合客服、内部助手这种「入口统一、专家分治」。

**Handoff**：当前 Agent 用 `new Command({ goto, graph: Command.PARENT })` 跳到兄弟图，自己不再收回。像交接班，适合「这个问题从现在起归法务 Bot」。共享的 `messages` 必须有 Reducer，否则交接时历史会被盖掉。

**子图**：把一个编译好的图 `.addNode()` 进去。父、子 State key 重合就直接共享通道；不重合就包一层映射函数。多 Agent 里最常见的是共享 `messages`。子图默认跟父图同一个 checkpointer，整段子流程在父级只算一个 super-step；若要在子图内部时间旅行或 HITL，给子图 `checkpointer: true`。

大多数「子 Agent 当工具用」应选 **per-invocation** 持久化：每次调用隔离，互不污染会话。只有「这个调研助手要连续聊很多轮」才用 per-thread。并行点同一个子图时要小心检查点冲突，必要时禁并行 tool call，或加调用次数中间件。

## 怎么选

先问两个问题：专家之间要不要共享完整对话？下一步由中央定还是由当前专家定？共享 + 中央定，Supervisor + 共享 messages；不共享、一次任务一次调用，子图当工具；当前专家最清楚该交给谁，Handoff。不要一上来上「五个 Agent 互相开会」——协调本身会吃掉上下文，评测也变难。能用确定路由（意图分类器）就不要用模型开会。

## 实践取舍

每个子 Agent 的工具清单要最小，描述里写清「你不是总控」。总步数、总费用封顶放在父图。交接时带一份短摘要，而不是把对方的全部工具日志继续往后传。面试里我会主动说：多 Agent 的收益来自**职责隔离和工具隔离**，不是来自角色扮演的数量。

## 可能的追问

- 子图失败父图能感知吗？能，当作节点异常；要降级就在父图加条件边，不要指望子图自己悄悄吞掉。
- 和「一个 Agent 很多工具」比呢？工具超过一小组、描述开始打架时，再拆 Agent；三五个边界清晰的工具不必上多 Agent。
