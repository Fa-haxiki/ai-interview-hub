---
title: "什么时候该微调，什么时候该继续堆 Prompt / RAG？"
category: ai
topic: finetune
section: 方法选型
difficulty: medium
order: 1
tags: [SFT, RAG, 选型]
sources:
  - title: "Fine-Tuning or Retrieval? Comparing Knowledge Injection in LLMs (Ovadia et al.)"
    url: "https://arxiv.org/abs/2312.05934"
    lang: en
  - title: "RAG vs Fine-tuning: Pipelines, Tradeoffs, and a Case Study"
    url: "https://arxiv.org/abs/2401.08406"
    lang: en
createdAt: "2026-09-06"
---

一句话：**知识会变、要引用、要按权限裁剪，用 RAG；格式、口吻、稳定技能要写进权重，才微调。** 两者常叠加：RAG 管事实，LoRA 管「怎么说、怎么填表」。先把 Prompt 和评测集做扎实，再决定要不要动权重。

## 微调擅长

工单 JSON、客服话术、内部术语的分词习惯、在小模型上复现大模型的格式纪律。这些用系统提示也能做，但一长就丢、一换模型就漂。

## RAG 擅长

制度、价格、工单状态、代码库。写进权重的知识难更新、难引用、难按租户隔离。把上周公告 SFT 进去，下周过期你还得再训。

## 实践取舍

没有 200 条以上高质量轨迹，我不上 SFT。有轨迹也先看：改 Prompt 是否已经到 90 分。微调的隐藏成本是评测、灾难遗忘、版本管理。和 RAG 主题里的对比题一致，这里强调决策顺序：Prompt → RAG → 小 LoRA → 全量，而不是反过来。

## 可能的追问

- 微调能减少幻觉吗？对格式幻觉有帮助，对事实幻觉有限，甚至可能背诵训练集里的错事实。
- 领域术语召不回是不是该微调 Embedding？先查分块和指令前缀，再考虑领域 Embedding 或生成侧 LoRA。
