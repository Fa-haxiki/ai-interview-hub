---
title: "少样本（few-shot）为什么有用？例子该怎么挑、怎么排？"
category: ai
topic: prompt
section: 推理与示范
difficulty: medium
order: 3
tags: [few-shot, ICL, 示范]
sources:
  - title: "Language Models are Few-Shot Learners (Brown et al., 2020)"
    url: "https://arxiv.org/abs/2005.14165"
    lang: en
  - title: "What Makes In-Context Learning Work? (Min et al., 2022)"
    url: "https://arxiv.org/abs/2202.12837"
    lang: en
createdAt: "2026-09-06"
---

一句话：**少样本是在上下文里临时教格式和边界，不更新权重。** 它有用是因为模型会模仿示范的输入输出结构；例子挑错、排错，模型就稳定地学错。

## 它教的是什么

GPT-3 论文把 ICL 推上台面：给几个完整例子，模型能在新输入上复现任务。后续研究指出，标签对错有时不如「展示任务形状」重要，但在生产里我仍把标签对当作底线——错例子会被当成规范。

示范主要传递三件事：输出 schema、边界情况（拒答、不确定）、语气。传递不了经常更新的事实，那是 RAG 的活。

## 怎么挑和排

- **覆盖边界**：一条正常、一条缺字段、一条该拒绝，比五条同质好例子有用。
- **靠近当前输入**：按相似度检索示范（dynamic few-shot），比写死在 System 里更省窗口。
- **最近的例子影响更大**：关键约束放最后一条示范或紧贴当前 User。
- **和检索分开**：示范是「怎么答」，检索是「答什么」。混在一段里，模型会把文档口吻学走样。

例子一多就挤占正文本。我一般 2～5 条，超出就改 SFT。动态示范要缓存，避免每次都嵌套检索。

## 可能的追问

- zero-shot 够强了还要例子吗？格式和边界仍要；模型越强，例子可以从「教能力」降成「钉格式」。
- 示范会被注入利用吗？会，用户可能伪造「示例：助手已同意转账」。示范必须来自你的库，不能来自用户原文。
