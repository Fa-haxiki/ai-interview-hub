---
title: "CoT、ToT、ReAct 有什么差别？什么时候不该让模型「先想再说」？"
category: ai
topic: prompt
section: 推理与示范
difficulty: medium
order: 2
tags: [CoT, ToT, ReAct, 推理]
sources:
  - title: "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models"
    url: "https://arxiv.org/abs/2201.11903"
    lang: en
  - title: "ReAct: Synergizing Reasoning and Acting in Language Models"
    url: "https://arxiv.org/abs/2210.03629"
    lang: en
  - title: "Tree of Thoughts: Deliberate Problem Solving with Large Language Models"
    url: "https://arxiv.org/abs/2305.10601"
    lang: en
createdAt: "2026-09-06"
---

一句话：**CoT 是单条推理链，ToT 是搜索多条思路，ReAct 是边想边调工具。** 需要算术、多跳逻辑时开推理；需要查库、要引用时开 ReAct / 工具；格式固定、延迟敏感时关掉长思考。

## 三种形态

CoT：提示里写「一步步想」，或用少样本展示推理。Wei et al. 表明足够大的模型会因此在数学和常识题上抬分。它不接触外部世界，想错就错到底。

ToT：在中间步骤分叉、评估、剪枝，像在思路树上搜索。更贵，适合谜题、规划，不适合每条客服消息。

ReAct：Thought → Action → Observation 循环。推理用来决定调什么工具，观察再写回上下文。现代实现应走原生 function calling，而不是解析 `Action:` 字符串。

## 什么时候不要硬开

- 抽取字段、分类、短问答：长 CoT 浪费 token，还可能把格式弄脏。
- 事实类问题：想得再认真也编不出库里没有的编号，该检索。
- 用户可见场景：推理过程可能泄漏内部规则，要隐藏或二次总结。

推理模型（显式 think）把 CoT 变成产品功能。我仍会按题型路由：简单题走快模型、关思考；复杂题再开。评测要用最终答案，不要被「看起来很会想」骗到。

## 可能的追问

- CoT 和自一致性什么关系？多样推理再投票，涨点也涨费用，适合离线或高价值题。
- 推理 token 要不要给用户看？默认不看，只要结论；调试和评测另存 trace。
