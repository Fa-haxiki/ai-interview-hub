---
title: "Agent 上线前你会加哪些可靠性护栏？怎么证明它不会死循环？"
category: ai
topic: agent
section: 评估与可靠性
difficulty: hard
order: 6
tags: [可靠性, 护栏, 死循环, 评测]
sources:
  - title: "How to think about agent frameworks"
    url: "https://blog.langchain.dev/how-to-think-about-agent-frameworks/"
    lang: en
  - title: "OWASP Top 10 for Large Language Model Applications"
    url: "https://genai.owasp.org/llm-top-10/"
    lang: en
createdAt: "2026-09-06"
---

一句话：**默认不信任循环会自己停。** 护栏分三层：预算（步数/时间/钱）、权限（工具白名单和 HITL）、质量（观察校验和熔断）。评测要用轨迹，不只看最终一句答得是否流畅。

## 必加的闸

- **步数与费用**：3～8 步常见；同工具连续失败 2 次熔断；总 token 预算打满就降级。
- **权限**：按用户裁工具，默认只读；删改、转账、对外发送必须 `interrupt` 或人工队列。
- **观察卫生**：工具返回截断、打码、schema 校验，拒绝把堆栈和密钥回灌 messages。
- **确定性前置**：鉴权、频控、幂等键在进模型之前做完。

死循环的典型样子是：检索结果不变还改写、工具 400 还换说法重打、两个 Agent 互相把任务扔回来。检测用「状态指纹」：连续两轮检索 id 集合相同就退出。

## 怎么证明

准备轨迹评测集：该两步结束的题、该拒绝的题、该审批的题。指标包括成功率、平均步数、越权次数、单位任务费用。发布后按 `runId` 抽检。没有轨迹指标，就等于没评测 Agent。

## 可能的追问

- 模型自己说「我停」可信吗？不可信，停靠代码。
- 护栏会不会让 Agent 变笨？会收能力，这是产品选择；先保证不会乱写库。
