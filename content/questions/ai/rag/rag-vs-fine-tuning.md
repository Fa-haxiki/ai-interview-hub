---
title: "RAG 和微调（Fine-tuning）分别适合什么场景？什么时候两者一起用？"
category: ai
topic: rag
section: 基础概念
difficulty: medium
order: 3
tags: [RAG, 微调, 选型]
sources:
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "RAG Interview Questions: Production Pipeline, Chunking, Reranking & Evaluation - interviewbaba"
    url: "https://interviewbaba.com/rag-interview-questions/"
    lang: en
createdAt: "2026-09-06"
---

我的一句话判断标准：**要改变模型“知道什么”，用 RAG；要改变模型“怎么表现”，用微调。** 两者是正交的，不是二选一。

## 决策维度

| 维度 | RAG | 微调 |
| --- | --- | --- |
| 知识更新频率高 | 重建索引即可 | 每次都要重训 |
| 需要引用来源 / 可追溯 | 天然支持 | 几乎做不到 |
| 语料很少（几十篇文档） | 够用 | 数据量不足 |
| 需要特定语气、格式、领域术语 | 只能靠 Prompt | 更擅长 |
| 推理延迟 | 多一次检索 | 无额外开销 |
| 幻觉控制 | 有依据可约束 | 依然会编 |

## 我怎么向面试官解释

一个直观的启发式：**如果答案明天会因为某份文档改了而变错，那是 RAG 的活；如果答案今天就错是因为模型不会某种格式或术语，那是微调的活。** 事实性知识量大、会变化、需要溯源，塞进权重里既贵又难更新，而且模型记不牢。

## 一起用的典型方式

生产系统很常见的组合是“微调过的模型 + RAG”：

- 用 LoRA 等轻量方式微调，让模型学会领域术语、输出格式、拒答风格，甚至学会“更听话地只用给定上下文回答”。
- 事实与最新数据全部走检索，保证可更新、可引用。
- 还有一种容易被忽略的微调：**微调 Embedding 模型**。当领域语料（法律、金融、医疗）和通用网页文本差异很大时，微调 embedding 对召回的提升往往比换更大的 LLM 更划算。

## 可能的追问

- 长上下文模型出来后是否还需要 RAG？（不是替代关系，见「长上下文是否让 RAG 过时」一题。）
- 如果预算只够做一件事，先做哪个？我会先做 RAG，因为它可解释、可回滚、见效快，微调是在 RAG 已经稳定后针对“表现问题”的追加投入。
