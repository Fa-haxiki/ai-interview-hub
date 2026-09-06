---
title: "LangGraph 怎么实现循环、条件分支和人机协同（Human-in-the-loop）？"
category: ai
topic: frameworks
section: LangGraph
difficulty: hard
order: 3
tags: [LangGraph, HITL, interrupt, 条件边]
sources:
  - title: "Interrupts - LangGraph docs"
    url: "https://docs.langchain.com/oss/python/langgraph/interrupts"
    lang: en
  - title: "Persistence - LangGraph docs"
    url: "https://docs.langchain.com/oss/python/langgraph/persistence"
    lang: en
  - title: "LangGraph - The LangChain Blog"
    url: "https://blog.langchain.dev/langgraph/"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

LangGraph 把控制流画成图：**条件边按 State 路由，循环就是边指回已经走过的节点，人机协同靠中断把图停住、等人改 State 或批准工具后再用同一 `thread_id` 恢复。** 环能让 Agent 处理模糊任务，但必须同时加步数 / 预算护栏，否则会空转烧钱。

## 条件分支与循环

固定边是「A 之后一定 B」。条件边传入一个路由函数，读当前 State（检索是否够、是否还要调工具），返回下一个节点名。循环没有特殊原语，就是路由结果再次指向 `retrieve` 这类上游节点。

```text
START → retrieve → evaluate
                      ├─ 够了 ─────────────→ generate → END
                      ├─ 不够且未超预算 → rewrite_query → retrieve
                      └─ 已超预算 / 超时 ──→ generate（降级）→ END
```

防死循环我至少加三道闸：`step_count` 上限、token / 费用预算、连续两轮检索结果不变就强制退出。只靠模型自己说「我再试一次」不可信。条件边的路由函数尽量写成确定性代码：用 Rerank 分数、命中条数、已用步数做判断，而不是再调一次 LLM 问「你觉得够不够」——后者自己也可能抖动，把环变成随机游走。

## 人机协同

编译时可以用 `interrupt_before` / `interrupt_after` 在指定节点前后暂停，典型场景是工具节点执行前让人看一眼参数：删数据、转账、对外发邮件。动态场景则在节点里调用 `interrupt()`，按业务条件才暂停。中断会依赖 Checkpointer 把 State 冻住；人审批或直接改字段后，用**同一个 `thread_id`** 再 invoke 即可从断点继续。换 ID 等于另开一条空线程，审批结果对不上。没有 Checkpointer 的中断只是同步卡住当前进程，发布或超时后状态就没了，谈不上真正的人机协同。

HITL 不是把每一步都交给人，只挡高风险副作用。低风险检索循环用预算闸门自动走完即可。审批界面要展示将要调用的工具名、参数和当前 State 摘要，让人能改参数再放行，而不是只给一个「同意 / 拒绝」按钮。拒绝时路由到解释节点或结束，不要默默重试同一个危险调用。

## 可能的追问

- 恢复时节点会不会重跑？静态断点从节点边界继续；节点内的 `interrupt()` 恢复时该节点会从头执行到中断点，中断前的副作用要做成幂等。
- 和「人在回路训练」是一回事吗？不是。这里是运行时审批与改 State，不涉及更新模型权重。
