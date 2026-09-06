---
title: "推理量化（INT8 / INT4 / KV 量化）怎么选？质量和吞吐你怎么权衡？"
category: ai
topic: serving
section: 成本与性能
difficulty: medium
order: 3
tags: [量化, INT4, KV Cache]
sources:
  - title: "GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers"
    url: "https://arxiv.org/abs/2210.17323"
    lang: en
  - title: "AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration"
    url: "https://arxiv.org/abs/2306.00978"
    lang: en
createdAt: "2026-09-06"
---

一句话：**权重量化主要省模型体积和访存，KV 量化主要省并发时的 Cache。** 选位宽要对着你的任务集，而不是对着博客里的「几乎无损」。生成式任务对量化比分类更敏感，长上下文再叠加 KV 量化，尾部质量先掉。

## 几条线

- **权重量化**（GPTQ / AWQ / FP8）：模型驻留变小，同卡能上更大模型或更大 batch。Decode 吃带宽，权重量化往往直接涨 TPS。
- **激活 / KV 量化**：Cache 减半或更多，并发上去；针测试和长文档问答要回归。
- **训练后 vs 量化感知训练**：服务侧以前者为主，没有精力重训。

我会先冻一份评测：短问答、长文档、工具 JSON、安全拒答。量化后这四类都过，再谈省了多少卡。只看困惑度不够。

## 实践取舍

在线客服优先 FP8 / INT8；离线摘要可以 INT4。不要在同一 SLA 里混用未回归的量化模型。业务代码用 JS 调用推理服务时，模型名要带量化版本，避免 A/B 被静默换档。

## 可能的追问

- 量化能替代小模型吗？有时 70B-INT4 仍比 8B 强，但延迟和调度更复杂，要一起测。
- 为什么有的层不量化？注意力输出或 lm_head 对误差敏感，实现里常留更高精度。
