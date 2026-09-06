---
title: "多头注意力、GQA、MQA 有什么差别？推理时为什么都在砍 KV？"
category: ai
topic: llm-basics
section: 模型结构
difficulty: medium
order: 2
tags: [GQA, MQA, 多头注意力, KV Cache]
sources:
  - title: "GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints"
    url: "https://arxiv.org/abs/2305.13245"
    lang: en
  - title: "Fast Transformer Decoding: One Write-Head is All You Need (Shazeer, 2019)"
    url: "https://arxiv.org/abs/1911.02150"
    lang: en
createdAt: "2026-09-06"
---

一句话：**多头是多组 Q/K/V 各算各的注意力；MQA 让所有头共享一组 K/V；GQA 是折中，若干 Query 头共用一组 K/V。** 推理时 Decode 阶段的瓶颈经常是搬 KV Cache，不是算力，所以要砍 K/V 的头数。

## 三种形态

标准 MHA：每个头一套 Q、K、V，表达力最强，KV Cache 也最大——层数 × 头数 × 序列长度 × 每头维度。

MQA（Shazeer, 2019）：只留一套 K/V，所有 Query 头去盯它。Cache 立刻小一个数量级，Decode 更快，但头之间少了独立的「键空间」，质量可能掉一点。

GQA：把 Query 头分组，每组共享一套 K/V。Llama 2 70B 一类模型用它，是「质量接近 MHA、显存接近 MQA」的工程点。

## 和业务的关系

你不一定自己实现注意力，但要能解释：同样 8K 上下文，换 GQA 模型为什么能多 concurrent。KV Cache 按字节估算是容量规划的基本功。投机解码、量化 KV、滑动窗口，都是在打同一个敌人——Decode 时反复读历史 KV。

面试如果只答「多头能看不同类型的关系」，不够。补一句显存：头数和上下文一乘，显存先于 FLOPs 爆。

## 可能的追问

- GQA 的组数怎么选？组越少越像 MQA，越快越省；组越多越像 MHA。以评测掉点换吞吐。
- 训练必须从零训 GQA 吗？可以把 MHA checkpoint 的 KV 头合并后再训，GQA 论文就是这条路。
