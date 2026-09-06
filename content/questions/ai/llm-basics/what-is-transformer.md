---
title: "Transformer 在做什么？为什么它能替代 RNN 成为大模型标配？"
category: ai
topic: llm-basics
section: 模型结构
difficulty: easy
order: 1
tags: [Transformer, 注意力, RNN]
sources:
  - title: "Attention Is All You Need (Vaswani et al., 2017)"
    url: "https://arxiv.org/abs/1706.03762"
    lang: en
  - title: "The Illustrated Transformer - Jay Alammar"
    url: "https://jalammar.github.io/illustrated-transformer/"
    lang: en
createdAt: "2026-09-06"
---

一句话：**Transformer 用自注意力让序列里每个位置直接看其他位置，训练可以按 token 并行，不再被 RNN 的逐步隐藏状态卡住。** 大模型标配它，不是因为它「更懂语言」，而是因为它在规模上算得动、堆得深、并行得好。

## 它替换了什么

RNN / LSTM 要把第 t 个词的状态建立在 t−1 上，长句梯度难传，训练也难并行。Transformer 把「谁和谁有关」交给注意力权重：Query 问、Key 被问、Value 被加权汇总。论文标题就是这个主张——注意力本身够用，循环和卷积不是必须的。

解码器侧再加一层因果掩码，保证生成第 i 个 token 时看不见后面的词。现代 GPT 类模型基本是解码器堆叠；BERT 类编码器双向看全句，更适合分类和 Embedding，不适合自回归生成。

## 为什么能堆到千亿

- **训练并行**：一层里所有位置同时算注意力，GPU 吃得饱。
- **路径短**：任意两个 token 一层就能交互，长距离依赖不必穿过几十步 RNN。
- **残差 + 归一化**：块可以叠很深，而不那么快崩。

代价是标准注意力对序列长度平方。所以后面才有 GQA、滑动窗口、线性注意力这些补丁。面试里我会主动说：业务上你调的是「这个结构之上的推理和工程」，不是重新发明注意力。

## 可能的追问

- Encoder-only 和 Decoder-only 怎么选？要生成、要对齐对话，用 Decoder-only；要句向量或分类，Encoder / Encoder-Decoder 仍常见。
- 位置信息哪来的？注意力本身无序，必须加位置编码（绝对、相对或 RoPE）。
