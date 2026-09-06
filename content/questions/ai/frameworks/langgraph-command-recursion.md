---
title: "LangGraph 的 Command、recursionLimit 和节点失败重试怎么用？"
category: ai
topic: frameworks
section: LangGraph
difficulty: medium
order: 8
tags: [Command, recursionLimit, 重试, 控制流]
sources:
  - title: "Graph API overview"
    url: "https://docs.langchain.com/oss/javascript/langgraph/graph-api"
    lang: en
  - title: "Use the Graph API"
    url: "https://docs.langchain.com/oss/javascript/langgraph/use-graph-api"
    lang: en
  - title: "LangGraph overview"
    url: "https://docs.langchain.com/oss/javascript/langgraph/overview"
    lang: en
createdAt: "2026-09-06"
---

一句话：**`Command` 把「改 State」和「下一跳」写在同一个返回值里；`recursionLimit` 是环的硬顶；节点重试管瞬时失败，不管逻辑死循环。** 三者一起，才构成能上生产的控制面。

## Command

普通节点返回一个 State 补丁，下一跳由边决定。`Command` 可以同时 `{ update, goto }`，还可以 `resume` 给 `interrupt()` 送回人的输入，或 `graph: Command.PARENT` 从子图跳回父图。Handoff、工具里「执行完直接去审批节点」都靠它，避免「先写 State，再靠另一个路由函数猜下一步」。

代价是控制流散落在节点内部，图可视化会少一条显式条件边。我的习惯：稳定的主干仍用 `addEdge` / `addConditionalEdges` 画出来；只有「更新和跳转必须原子发生」时才用 Command，例如交接时一边追加交接消息一边 goto。

## recursionLimit 和重试

图按 Pregel super-step 往前走，环会让步数涨。`recursionLimit`（invoke 的 config 里传入）超了就抛错停掉，防止模型一直说「我再试一次」。这是最后闸门，前面还应该有自己的 `stepCount`、费用预算、相同检索结果熔断——那些能走降级节点，limit 触发则是整图失败。

节点重试适合网络超时、429、短暂 5xx，要设次数和抖动，且节点必须幂等。选错工具、检索为空、schema 校验失败，重试同一节点没有意义，应该条件边走到改写 / 降级 / 结束。Checkpointer 的 pending writes 会保留同一步里已经成功的并行节点，恢复时不必把成功的那一路再跑一遍——这也是「为什么失败重试要配检查点」的工程理由。

## 实践取舍

默认 limit 不要太大，调试时宁早失败。给每个可能失败的外部调用分类：可重试 vs 可降级 vs 必须中断给人。面试时我会说：Command 是局部的、精确的控制；limit 是全局的、粗鲁的保险；业务可读的退出条件要写在图里，不能只靠 limit。

## 可能的追问

- limit 按节点数还是 super-step？按图的递归 / super-step 计数，并行扇出在同一步，不要按「节点函数调用次数」去心算。
- 工具里能不能返回 Command？能，这是动态路由的常见写法，但更难静态看清图，要配日志。
