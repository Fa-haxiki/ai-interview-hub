---
title: "LoRA / QLoRA 在改模型的哪一部分？为什么比全量微调更常见？"
category: ai
topic: finetune
section: 参数高效微调
difficulty: medium
order: 2
tags: [LoRA, QLoRA, PEFT]
sources:
  - title: "LoRA: Low-Rank Adaptation of Large Language Models"
    url: "https://arxiv.org/abs/2106.09685"
    lang: en
  - title: "QLoRA: Efficient Finetuning of Quantized LLMs"
    url: "https://arxiv.org/abs/2305.14314"
    lang: en
createdAt: "2026-09-06"
---

一句话：**LoRA 冻结原权重，在注意力等线性层旁路加一对低秩矩阵 A/B，只训这两个小矩阵。** 可训练参数降到千分之一量级，一份基座可以挂多套适配器。QLoRA 再把基座量化到 4bit，让单卡也能做 7B～70B 级微调。

## 它改的不是「又一个模型文件」那么简单

推理时 `W' = W + BA`（有缩放系数）。W 共享，BA 按业务切换。这就是为什么客服、写作、分类可以共用一个基座。秩 r 太小学不够，太大约等于更贵的微调；先从 8/16 做起，看评测。

常见插在 Q/K/V/O 和 FFN。不是魔法：数据脏，LoRA 也会稳定学脏。灾难遗忘仍在，只是改动面比全量小。

## 实践取舍

应用团队用 LoRA 的理由是工程：可回滚、可 A/B、可按租户加载。不是因为论文分数永远高于全量。合并适配器能降推理延迟，但会失去热切换。服务侧要能讲清：加载两个 LoRA 不是免费，显存和切换策略要设计。

## 可能的追问

- LoRA 和 Adapter / Prefix-tuning 怎么选？现在默认 LoRA 生态最好；要极小推理开销可以合并进 W。
- 必须训 Embedding 层吗？词表外领域词有时要，但会放大遗忘，先试不训。
