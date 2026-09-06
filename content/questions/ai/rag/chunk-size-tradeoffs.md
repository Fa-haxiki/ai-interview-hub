---
title: "Chunk 切大了、切小了各有什么问题？chunk size 到底怎么定？"
category: ai
topic: rag
section: 文档处理与分块
difficulty: medium
order: 1
tags: [Chunking, 分块, 调参]
sources:
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "RAG Interview Questions: Production Pipeline, Chunking, Reranking & Evaluation - interviewbaba"
    url: "https://interviewbaba.com/rag-interview-questions/"
    lang: en
createdAt: "2026-09-06"
---

这道题是面试官判断我“跑过 Demo 还是真做过”的分水岭，所以我会先讲权衡，再讲调参方法，最后给一个实际数字。

## 两头的问题

- **切太大 → 信息稀释**：一个块里塞了多个话题，embedding 只能表示一个“平均含义”，真正相关的那句话被无关内容淹没，相似度掉下去、排名靠后；同时还浪费上下文窗口。
- **切太小 → 上下文丢失**：一句话单独拿出来可能没有意义（“它的默认值是 30 天”——“它”是谁？），模型拿到的是断章取义的碎片；还会导致一个答案横跨多个块，只召回一半。
- **切在错误的边界上**：句子中间、表格中间、代码函数中间断开，块本身就难以被有效编码。

## 我的选择框架

1. **看 embedding 模型的甜区**：多数模型在 256～512 token 表现最好，能处理更长输入的大模型可以放宽到 1024。
2. **看内容类型**：FAQ 之类的短事实 100～300 token；技术文档 300～500；长篇叙述 500～1000；代码按函数或类切。
3. **看问题类型**：精确事实类问题偏小块，需要综合分析的问题偏大块。
4. **实测**：这才是真正的答案——准备一组带标准答案的问题，对 256/512/1024 各跑一遍，比较 Recall@K，选最好的那个。

## 一个化解矛盾的思路

“检索用小块、生成用大块”，也就是父子块（Parent-Child）或 Small-to-Big：用小块建索引保证匹配精度，命中后返回它所属的父块或前后邻居块，保证上下文完整。这是我在结构化文档上最常用的默认方案。

## 实际经验

我会带一个量化例子，比如“chunk_size 从 1000 降到 500 并加上 20% overlap 之后，Top-5 召回率提升了十几个百分点”。哪怕数字是项目里的粗测，也比只背概念有说服力。

## 可能的追问

- 不同文档类型要不要用不同的 chunk 参数？要，Markdown 按标题层级、PDF 先抽表格再切段、代码按 AST、FAQ 一问一答不拆开。
- 长上下文模型出现后 chunk 精度还重要吗？重要性下降但没消失，因为召回排序和成本仍然依赖块的质量。
