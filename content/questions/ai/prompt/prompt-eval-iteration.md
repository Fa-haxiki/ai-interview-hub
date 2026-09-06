---
title: "Prompt 怎么迭代才算工程而不是玄学？你用什么评测集？"
category: ai
topic: prompt
section: 评估与迭代
difficulty: medium
order: 5
tags: [Prompt 评测, 回归集, 迭代]
sources:
  - title: "Prompt engineering - OpenAI"
    url: "https://developers.openai.com/api/docs/guides/prompt-engineering"
    lang: en
  - title: "Evaluating language models - Anthropic"
    url: "https://docs.anthropic.com/en/docs/test-and-evaluate/eval-tool"
    lang: en
createdAt: "2026-09-06"
---

一句话：**没有冻结的输入集，就没有 Prompt 优化，只有聊天碰运气。** 工程做法是：先修 30～100 条真实题（含该拒的、该引用的、该走工具的），每次只改一处，看回归而不是看感觉。

## 最小评测集

覆盖四类：主路径成功、边界（空检索、缺字段）、安全（注入、越权）、格式（schema 校验失败率）。每条题有期望：字段值、是否调用某工具、是否拒绝、引用是否来自给定片段。自动分用程序校验 + 抽检 LLM-as-judge；法官模型不要和被测模型同一家还用同一套 Prompt。

改系统提示、改例子、改模型、改温度，四者不要同一天全动。温度对分类/JSON 尽量 0；对文案可以略高，但回归集要分开。

## 迭代节奏

线上 badcase 每周回流，标注「Prompt 问题 / 检索问题 / 模型能力问题」。只有第一类才改提示。改完必须跑全量回归，防止「这句更友好」弄坏拒答。Prompt 进 git，带作者和关联评测分数，禁止只活在聊天窗口里。

面试时我会说：Prompt 工程的产出是「可回归的文本配置」，不是一段灵感。

## 可能的追问

- 样本太少会过拟合吗？会，所以要留一截没看过的题；线上再看偏移。
- 和微调比谁先做？先 Prompt + 评测集，稳不住再 LoRA。没有集就微调，只是换一种过拟合。
