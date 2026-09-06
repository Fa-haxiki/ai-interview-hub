---
title: "代码、法律合同这类特殊领域的文档，分块策略和普通文本有什么不同？"
category: ai
topic: rag
section: 文档处理与分块
difficulty: hard
order: 6
tags: [Chunking, 代码检索, 法律文档, 父子块]
sources:
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "RAG Interview Questions: Production Pipeline, Chunking, Reranking & Evaluation - interviewbaba"
    url: "https://interviewbaba.com/rag-interview-questions/"
    lang: en
createdAt: "2026-09-06"
---

共同点是：**这两类文档都有强结构，固定长度切分会直接破坏结构**。不同点在于结构的形态：代码的结构是语法树，法律文本的结构是条款层级和“定义—引用”关系。

## 代码

- **按语法单元切**：用 tree-sitter 之类的解析器得到 AST，在函数、类、方法边界上切，而不是按行数。LangChain 的 `RecursiveCharacterTextSplitter.from_language` 就是这个思路的简化版。
- **块里必须带签名和上下文**：只有函数体、没有函数名和参数的块几乎无法被检索到；我会把函数签名、docstring、所属类名、文件路径和关键 import 一起放进块（或放进前置上下文）。
- **保留完整代码块**：宁可块大一点，也不要把一个函数切成两半。
- **检索侧配合**：代码里大量标识符（类名、错误码、配置项）是精确匹配问题，混合检索里 BM25 的权重要比普通文本高；有条件时用代码专用的 embedding 模型。

## 法律 / 保险 / 合规文档

- **按条款层级切**：章 → 条 → 款 → 项，块边界落在条款边界上，元数据里记录完整的层级路径（“第三章 第 12 条 第 2 款”）。
- **父子块是刚需**：在“款/项”级别做检索保证精确，命中后把所属“条”的全文和上级标题一起交给模型，否则条款脱离上下文很容易被误读。
- **定义项要单独处理**：合同开头的“定义”章节决定了后文里“甲方”“服务”“保密信息”的含义。我会把定义项作为独立块并打上标签，回答时做一次二次检索把相关定义补进上下文。
- **交叉引用**：“依照第 8.2 条”这类引用要在解析阶段解析成链接，需要时把被引用条款一起召回。
- **Contextual Retrieval 很合适**：给每个条款块前置“本条出自某合同、属于违约责任章节”之类的说明，能明显改善召回。

## 我会怎么收尾

面试官真正想听的是我有没有被固定长度切分“坑过”。我会举一个例子：某次用 512 token 均匀切分保险条款，免责条款的列表被切散，导致模型回答“可以理赔”而漏掉了下一块里的除外责任；换成条款级切分 + 父块返回之后这类错误才消失。

## 可能的追问

- 代码仓库这种“文件之间相互依赖”的检索怎么做？在块级检索之外补一层符号索引（函数 → 调用者/被调用者），做成轻量的图检索。
- 法律问答如何避免引用错条款？回答时强制输出条款编号并在后处理里校验编号存在于召回集合中。
