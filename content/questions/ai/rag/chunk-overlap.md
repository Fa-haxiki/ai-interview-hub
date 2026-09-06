---
title: "Chunk overlap 是什么？为什么需要它，一般设多少？"
category: ai
topic: rag
section: 文档处理与分块
difficulty: easy
order: 3
tags: [Chunking, Overlap]
sources:
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

Overlap 指相邻两个块在边界处共享一段文本。比如块 1 是第 0～500 个 token，块 2 从第 450 个 token 开始，那么就有 50 个 token 的重叠。

## 为什么需要

分块本质上是在连续文本上“一刀切”，无论切在哪，总有信息刚好横跨切口——一个结论的前半句在上一块、后半句在下一块。有了 overlap，至少有一个块能完整包含边界附近的内容，检索时不至于只拿到半句话。

## 经验值与代价

- 常见取值是 **chunk size 的 10%～20%**：512 token 的块配 50～100 token 的重叠。
- 代价：块总数增加，embedding 与存储成本上升；相邻块内容相似，容易在 Top-K 里出现“同一段话被召回两次”，需要在返回前去重或按父块合并。
- overlap 设得再大也治不了“切得太小”的病，它只是缓解边界损失，不能替代合理的块大小和结构感知切分。

## 什么时候可以不用

按结构切分（Markdown 标题、代码函数、FAQ 问答对）时，块边界本身就是语义边界，overlap 意义不大；父子块方案里也常常用“返回父块”代替 overlap 来补上下文。

## 可能的追问

- 重叠导致重复召回怎么处理？按文档 ID + 位置合并相邻块，或者干脆用父子块返回父块。
- overlap 会不会影响评估？会让 Recall@K 虚高一点（重复块占坑），评估时按父块去重更公平。
