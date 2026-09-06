---
title: "什么是 Lost in the Middle？检索到的文档在 prompt 里应该怎么排？"
category: ai
topic: rag
section: 生成与上下文组织
difficulty: medium
order: 1
tags: [Lost in the Middle, 上下文组织, Prompt, 位置偏差]
sources:
  - title: "Lost in the Middle: How Language Models Use Long Contexts (Liu et al., 2023)"
    url: "https://arxiv.org/abs/2307.03172"
    lang: en
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

**Lost in the Middle** 是斯坦福等机构在 2023 年的论文里揭示的现象：给模型一段长上下文，把关键信息放在开头或结尾，模型答得很好；放在中间，准确率明显下降，形成一个 U 形曲线。这对 RAG 的启示是——**检索到的文档不是丢进 prompt 就完事，顺序本身影响效果。**

## 现象与原因

论文在多文档问答任务上测试：把包含答案的文档放在 20 个文档的不同位置。放第 1 位和第 20 位时准确率最高，放在第 10 位左右时最低，甚至低于不给任何文档的闭卷表现。原因一般归结为训练数据的位置分布（开头有指令、结尾有问题）和注意力机制对首尾位置的偏好。新一代模型有所缓解，但没有消失，尤其是上下文越长越明显。

## 对 RAG 的实践指导

1. **少即是多**：把 Rerank 后的 Top-3～5 放进去就够了，塞 20 条只会让真正相关的那条被埋在中间。
2. **重要的放两端**：最相关的文档放第一位，次相关的放最后，其余放中间。有些框架直接叫这种排序 “long-context reorder”。
3. **问题放最后重复一遍**：指令在开头、检索文档在中间、用户问题在结尾再写一次，让模型在生成前“刚刚看到”问题。
4. **结构化分隔**：每条文档用编号和明确的分隔符（`[文档 1]` … `[文档 2]`）包裹，让模型能区分不同来源，也方便引用。
5. **去冗余**：多个块讲同一件事时合并或只留一条，避免用重复内容稀释注意力。

## 一个典型的 prompt 骨架

```text
你是……助手。只根据下面提供的资料回答，资料中没有的信息请明确说明。

[文档 1] （最相关）
…
[文档 2]
…
[文档 3] （次相关）
…

用户问题：{question}
请在回答中标注引用的文档编号。
```

## 可能的追问

- 长上下文模型（百万 token）还有这个问题吗？有缓解但依旧存在，而且长上下文的成本和延迟决定了 RAG 仍需精挑细选。
- 怎么验证排序有没有用？在评测集上固定检索结果、只改变顺序，比较答案准确率和 faithfulness。
