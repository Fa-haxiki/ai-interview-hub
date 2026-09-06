---
title: "RAG 为什么还会产生幻觉？怎么设计多层防线来降低幻觉？"
category: ai
topic: rag
section: 幻觉与质量
difficulty: hard
order: 1
tags: [幻觉, Faithfulness, Grounding, 质量保障]
sources:
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
  - title: "RAG Interview Questions: Production Pipeline, Chunking, Reranking & Evaluation - interviewbaba"
    url: "https://interviewbaba.com/rag-interview-questions/"
    lang: en
createdAt: "2026-09-06"
---

RAG 能**大幅减少**幻觉，但不能消除。要回答这道题，先要把“幻觉”拆开看是哪一环出的问题，因为不同环节的解法完全不同。

## 幻觉的三个来源

**1. 检索层面：检索到了错的或不够的内容**
- 相关文档根本没被召回（分块切断、embedding 不匹配、术语没对上）；
- 检索到的内容相关但过时、自相矛盾（多个版本的文档同时在库里）；
- 全是噪音，模型只能用参数知识“补”。

这一层的幻觉占了生产问题的大头，很多团队一上来调 prompt、换模型，其实根子在检索。

**2. 生成层面：文档对了，模型没忠实使用**
- 模型用自己的先验覆盖了文档内容（尤其是文档和它的“常识”冲突时）；
- 把多个片段的信息错误拼接；
- 过度概括、把“可能”说成“一定”；
- 文档里没有答案，模型硬答。

**3. 评估层面：没有人知道它在幻觉**
没有监控、没有 faithfulness 评估，幻觉发生了也发现不了，直到用户投诉。

## 多层防线

**检索前**
- 高质量分块 + 混合检索 + Rerank + 阈值截断，保证进上下文的都是相关内容。
- 索引里的版本管理：过期文档下线或打上标记，同一主题只保留权威版本。
- Query 改写解决“问法不匹配”导致的漏召回。

**生成时**
- 系统提示词强约束：只用提供的资料、资料不足就说明、不要推测。
- 要求结构化引用：每个陈述附来源编号，没来源的不写。
- 温度设低（0～0.3），减少“创造性”。
- 关键领域用更强的模型，弱模型更容易忽视上下文。

**生成后**
- 自动 grounding 校验：用 NLI 模型或 LLM 逐句判断“这句话是否被引用的片段支撑”，不支撑的删掉或标注。
- 引用存在性校验：凭空出现的引用编号直接过滑。
- 高风险场景加人工审核或“仅展示原文片段、不生成总结”的保守模式。

**运维层**
- 线上抽样跑 RAGAS faithfulness，设阈值告警。
- 用户反馈闭环（点赞/点踩、举报），把差评样本回流到评测集。

## 面试时的关键表述

“幻觉不是一个 bug，而是一个要持续管理的指标。”我会强调**先定位是哪一层**——把 Top-K 检索结果打出来看一眼，往往就知道该修检索还是修生成。

## 可能的追问

- 检索到的文档本身是错的怎么办？这是数据质量问题，靠版本治理和权威源标记，模型无法分辨真伪。
- 怎么量化幻觉率？faithfulness（回答中被上下文支撑的陈述比例）+ 人工抽检；两者结合才可信。
