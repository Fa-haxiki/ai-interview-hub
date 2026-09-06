---
title: "升级或更换 Embedding 模型时，线上索引怎么平滑迁移？"
category: ai
topic: rag
section: Embedding 与向量检索
difficulty: medium
order: 7
tags: [Embedding, 索引迁移, 灰度, 版本化]
sources:
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

先说一个原则：**不同 embedding 模型（甚至同一模型的不同版本）产生的向量处于不同的向量空间，绝对不能混在一个索引里。** 所以“换模型”等价于“全量重建索引”，问题只是怎样重建得不影响线上。

## 迁移方案

1. **全量重建**：用新模型重新 embedding 全部文档。最简单、最干净，几乎总是正确答案；成本是一次性的 embedding 费用和时间（十万级文档几小时，亿级要按天算并计算预算）。
2. **影子索引（Shadow Index）**：新索引在旧索引旁边并行构建，构建期间双写增量文档；构建完成后先用线上流量做离线对比评估，再切换读流量，旧索引保留一段时间用于回滚。这是我推荐的生产做法。
3. **版本化索引**：索引名带模型版本（`kb_v2_bge_m3`），配置里指定当前版本，切换就是改配置；多版本并存也方便 A/B。
4. **对齐层**：训练一个线性变换把旧向量映射到新空间。研究里有，生产基本不用，因为效果不稳定且省下的钱不值这个风险。

## 切换前要做的验证

- 用固定的评测集比较新旧索引的 Recall@K、MRR，确认新模型确实更好，而不是“榜单说它更好”。
- 检查查询侧和文档侧用的是同一个新模型、同样的指令前缀与归一化设置。
- 灰度：把一部分流量切到新索引，观察线上的相似度分布、拒答率和用户反馈。

## 顺带要考虑的

- 换模型往往是重新审视 chunk 策略的好时机，因为重建成本已经付了。
- 把“重建索引”做成可重复执行的流水线（幂等、可断点续跑），以后换模型、改分块都能复用。

## 可能的追问

- 重建期间新增的文档怎么办？双写：同时写旧索引和新索引，切换时零停机。
- 查询侧和文档侧能用不同模型吗？只有明确设计成配对使用的模型可以，否则不行。
