---
title: "长上下文模型已经能吃下百万 token，RAG 是不是过时了？"
category: ai
topic: rag
section: 基础概念
difficulty: medium
order: 4
tags: [长上下文, 成本, Lost in the Middle]
sources:
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "Production RAG Architecture in 2026 - prompt20"
    url: "https://blog.prompt20.com/posts/rag-production-architecture/"
    lang: en
  - title: "Lost in the Middle: How Language Models Use Long Contexts (Liu et al., 2023)"
    url: "https://arxiv.org/abs/2307.03172"
    lang: en
createdAt: "2026-09-06"
---

我的结论是：**长上下文和 RAG 是互补的，不是替代关系。** 这个问题本质上是一道成本与质量的估算题，我会用数字来回答。

## 为什么“全塞进上下文”替代不了检索

1. **成本随输入 token 线性增长**。每次提问都把上百万 token 发给模型，比只检索几千 token 的相关片段贵一到两个数量级，而且多轮对话里每一轮都要再付一次。有资料估算过，同样的问题走 RAG 大约几美分，走 20 万 token 的长上下文要贵十倍左右。
2. **延迟也随之增长**。超长 prefill 会带来数秒的首 token 延迟，用户体感明显。
3. **注意力质量会下降**。「Lost in the Middle」的实验表明，即便是长上下文模型，相关信息放在中间时性能也会明显下滑；窗口越长，噪音越多。
4. **语料通常比窗口大**。企业知识库动辄几十 GB，无论如何都得先“选”出一部分，而“选”就是检索。

## 长上下文真正改变了什么

我会承认它带来的变化，而不是全盘否定：

- **对分块精度的要求变宽松了**：可以召回得更“慷慨”，让模型自己在几万 token 里筛。
- **整篇文档级检索变得可行**：检索单位从块变成整份文档或大章节。
- **Prompt Caching 改变了算账方式**：稳定的中等长度上下文（比如产品手册）可以缓存前缀，“中等上下文 + 检索”成了性价比很高的中间路线。

## 我会怎么收尾

检索决定“什么相关”，窗口决定“能放多少相关内容”。窗口变大只是放宽了检索的精度要求，并没有消除选择问题，也没有消除账单。

## 可能的追问

- 什么情况下我会直接用长上下文不做检索？语料总量小于窗口、访问频率低、对延迟不敏感的一次性分析任务。
