---
title: "Naive RAG 有哪些局限？RAG 系统常见的失败模式有哪些？"
category: ai
topic: rag
section: 基础概念
difficulty: medium
order: 5
tags: [Naive RAG, 失败模式, 排查]
sources:
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "Production RAG Architecture in 2026 - prompt20"
    url: "https://blog.prompt20.com/posts/rag-production-architecture/"
    lang: en
createdAt: "2026-09-06"
---

Naive RAG 就是教程里最常见的三步：把问题向量化 → 取 Top-K 相似块 → 塞进 Prompt。它能跑通 Demo，但上线后会暴露一批系统性的问题。面试官问这个，是想确认我真的踩过坑。

## Naive RAG 的结构性局限

- **没有查询理解**：不管问题是闲聊、精确查号还是复杂分析，都一视同仁地检索一次。
- **只检索一次**：一次没找到就直接硬答，没有纠错机会。
- **固定 Top-K**：问题复杂度不同，需要的上下文数量却写死了。
- **没有答案校验**：不检查生成内容是否被检索结果支持。
- **缺乏来源多样性**：K 个块可能全来自同一段落，其它角度的信息被挤掉。

## 我在生产中见过的失败模式

1. **检索失败**：答案就在库里，但没被召回。原因通常是解析或分块把内容切坏了、embedding 与领域不匹配、或者用户措辞和文档措辞差异太大。
2. **块边界切断关键信息**：一张表被切成两半、定义和术语分家、函数签名和函数体分开。
3. **上下文过载与 Lost in the Middle**：塞了太多块，模型反而忽略了中间的关键片段。
4. **索引过期**：文档更新了，索引没同步，模型拿着旧版本理直气壮地回答。
5. **抽象层级错位**：用户问的是概览，检索回来的全是实现细节。
6. **检索对了、生成没用**：正确片段就在 Prompt 里，模型却用先验知识作答，这是 Prompt 约束太弱的信号。
7. **精确标识符失败**：型号、错误码、法规编号（比如 GPT-4o 和 GPT-4）在向量空间里过于接近，纯向量检索会串。
8. **引用幻觉**：模型输出了 `[source:7]`，但实际只检索到了 5 条。

## 这些问题分别对应什么解法

查询理解与改写解决第一类；结构感知分块、父子块和 Contextual Retrieval 解决边界问题；混合检索解决精确标识符；Rerank 与阈值解决上下文过载；增量索引与新鲜度过滤解决过期；严格的系统提示与引用校验解决生成侧的问题。这也是“高级 RAG”所有模块存在的理由。

## 可能的追问

- 排查一个答错的 query 时你先看哪一步？我会先看 Top-20 召回里有没有正确块，再看 Rerank 后有没有留下，再看 Prompt 里是否真的包含它，最后才怀疑模型。
