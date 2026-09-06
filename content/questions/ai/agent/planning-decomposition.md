---
title: "Agent 的规划有哪些做法？为什么很多系统最后不用「先写完整计划」？"
category: ai
topic: agent
section: 规划与工具调用
difficulty: medium
order: 3
tags: [规划, 任务分解, ReAct]
sources:
  - title: "ReAct: Synergizing Reasoning and Acting in Language Models"
    url: "https://arxiv.org/abs/2210.03629"
    lang: en
  - title: "HuggingGPT: Solving AI Tasks with ChatGPT and its Friends in Hugging Face"
    url: "https://arxiv.org/abs/2303.17580"
    lang: en
createdAt: "2026-09-06"
---

一句话：**规划是为了减少盲目试工具，但完整计划在执行到第二步就过时。** 生产里更常见的是「短规划 + 每步再决策」，或根本用确定路由，只把局部交给 Agent。

## 常见做法

1. **隐式规划（ReAct）**：不单独写计划，每步 Thought 里带目标。实现简单，容易在局部打转。
2. **先分解再执行**：先输出子任务列表，再逐个调工具（HuggingGPT 一类）。适合子任务独立、工具清单长。
3. **Planner-Executor**：一个模型写计划，另一个只许执行白名单步骤。计划可被人审。
4. **代码/DSL 规划**：让模型写一段受限脚本再解释执行，表达力强，沙箱成本高。

完整计划的脆弱点：第一跳检索发现实体不是假设的那个，后面五步全废。所以我会要求计划可重写：执行器回报「前提不成立」时，planner 只能改后续，不能偷偷加新的写工具。

## 实践取舍

工具少于 5 个、路径短，隐式规划够。工具一多，先做意图路由把工具集切小，比让一个 Agent 面对 40 个 API 更稳。多跳且贵的调研，才上显式计划。面试强调：规划解决的是搜索空间，不解决工具本身不可靠。

## 可能的追问

- 计划和记忆放哪？当前计划进短状态；跨会话的目标放长期记忆，且要用户确认。
- 要不要用更强模型当 Planner？可以，但 Executor 用快模型；总费用仍可能低于一个大模型盲目试 15 步。
