---
title: "上下文窗口是什么限制的？RoPE 和「外推到更长」靠谱吗？"
category: ai
topic: llm-basics
section: 上下文与长文本
difficulty: medium
order: 5
tags: [上下文窗口, RoPE, 长文本, 外推]
sources:
  - title: "RoFormer: Enhanced Transformer with Rotary Position Embedding"
    url: "https://arxiv.org/abs/2104.09864"
    lang: en
  - title: "YaRN: Efficient Context Window Extension of Large Language Models"
    url: "https://arxiv.org/abs/2309.00071"
    lang: en
createdAt: "2026-09-06"
---

一句话：**窗口首先是位置编码和 KV Cache 的设计值，不是「模型读过的书有多厚」。** 标称 128K 只保证能塞进去并完成注意力；不保证第 1 段和第 100 段都被用上。RoPE 让相对距离进注意力，外推方案（YaRN、NTK、继续预训练）是在改位置频率，不是变出无限记忆。

## 窗口卡在哪

- **位置编码**：训练时见过的最大位置。超出后相对距离的旋转角度是没见过的，质量会掉。
- **显存**：Decode 时 KV 随长度线性涨，先碰到卡。
- **注意力质量**：中间段落容易被忽略（lost-in-the-middle），这是使用问题，不是窗口数字问题。

RoPE 把位置做成 Query/Key 上的旋转，相对偏移自然进入点积。它比绝对位置好外推一些，但直接拉到 8 倍训练长度通常仍要插值或短续训。YaRN 一类方法改高频/低频的缩放，用很少 token 把窗口打开。打开之后仍要用长文检索、针测试、真实文档题验收。

## 实践取舍

产品上我会把「能输入 128K」和「应该输入 128K」分开。默认仍检索 + 截断到模型最稳的一段，超长合同再开长窗或分层摘要。费用按输入 token 线性涨，全塞原文往往比 RAG 更贵、更慢。长窗是能力，不是默认策略。

## 可能的追问

- 和滑动窗口注意力什么关系？那是只看局部邻域，复杂度降下来，远距离要靠层叠或额外检索。
- 无限上下文广告怎么拆？看是压缩记忆、外部存储，还是真的全量注意力；前两者都不是「每字必看」。
