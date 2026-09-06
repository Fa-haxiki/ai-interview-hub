---
title: "视觉语言模型（VLM）怎么把图像和文本放进同一套生成？和 CLIP 差在哪？"
category: ai
topic: multimodal
section: 视觉语言模型
difficulty: medium
order: 1
tags: [VLM, CLIP, 多模态]
sources:
  - title: "Learning Transferable Visual Models From Natural Language Supervision (CLIP)"
    url: "https://arxiv.org/abs/2103.00020"
    lang: en
  - title: "Flamingo: a Visual Language Model for Few-Shot Learning"
    url: "https://arxiv.org/abs/2204.14198"
    lang: en
createdAt: "2026-09-06"
---

一句话：**CLIP 一类是对齐图文向量，擅长检索和分类；VLM 是在语言模型前面接视觉编码器，让模型用 token 描述或回答图像。** 能搜「类似这张图的文档」不等于能「根据截图填工单」。

## 两条技术线

CLIP：图编码器 + 文编码器，对比学习拉近配对。输出是向量，下游是相似度。没有自回归说话能力。

VLM（Flamingo、LLaVA、GPT-4o 一类）：视觉编码器抽出 patch / token，经投影层映射到 LLM 的 embedding 空间，再和文本 token 一起做注意力。生成路径与纯文本 LLM 相同，所以能接工具、能出 JSON。

代价是：分辨率、切块、表图里的数字识别，都会成为新的失败模式。长文档扫描件往往要先页级切分，而不是丢一张 80 页 PDF 缩略图。

## 实践取舍

产品问题先分类：要检索用多模态 Embedding；要理解+行动用 VLM；只要印刷体文字，专用 OCR 往往更稳、更便宜。别默认「多模态大模型能替代解析流水线」。

## 可能的追问

- 图像 token 怎么计价？按块/按分辨率，常常比纯文本贵一个数量级，要做路由。
- 能直接 function calling 吗？能，但工具参数仍要文本化；图上的坐标点选要另做 grounding。
