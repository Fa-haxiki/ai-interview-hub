---
title: "检索不到相关内容时系统应该怎么做？如何设计拒答和兜底策略？"
category: ai
topic: rag
section: 生成与上下文组织
difficulty: medium
order: 3
tags: [拒答, 兜底, 相似度阈值, 降级]
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

先亮观点：**“我在知识库里没找到相关信息”是一个正确答案，不是失败。** 最糟糕的情况是检索到一堆不相关的片段、模型硬着头皮编一个看起来合理的回答——这比拒答的伤害大得多。

## 第一步：识别“没检索到”

“检索不到”不是返回空列表，向量检索永远会返回 Top-K，只是相关性很低。所以要靠分数判断：

- **Rerank 分数阈值**：Cross-Encoder 的分数比原始相似度可信得多，低于阈值（不同模型不同，需要在评测集上标定）的候选全部丢弃。
- **相对差距**：Top-1 和 Top-K 的分数几乎一样，往往说明全是噪音。
- **LLM 相关性判断**：CRAG 的思路，用一个轻量评估器给每条候选打“相关/模糊/不相关”。

标定阈值的方法：在评测集上画出“分数 vs 是否真正相关”的分布，选一个 precision 和 recall 平衡的点，再上线看拒答率是否合理。

## 第二步：分级兜底

1. **明确拒答**：告诉用户知识库里没有相关信息，并说明覆盖范围（“我可以回答产品文档相关问题”），避免用户以为系统坏了。
2. **给出相关线索**：虽然没有直接答案，但把最接近的几个文档标题列出来，让用户自己判断。
3. **澄清追问**：问题过于模糊时反问用户（“你是指 v2 还是 v3 的配置？”），有时比硬答更好。
4. **有条件地用模型自身知识**：对通用知识问题（“什么是 HNSW”）可以用参数知识回答，但必须明确标注“以下内容并非来自知识库”，高风险领域（医疗、金融、法律）直接禁止这条路。
5. **转人工 / 提工单**：客服场景下最实用的兜底。

## 第三步：让 prompt 支持拒答

系统提示词里要写清楚：“只根据提供的资料回答；资料不足时明确说明，不要推测。”同时给几条 few-shot 的拒答示范。没有这条指令，模型的默认倾向是“尽量回答”。

## 第四步：把拒答当数据用

拒答的问题是知识库缺口的直接信号。定期聚类分析拒答日志，能发现哪些主题文档缺失、哪些是问法问题（改写能解决）。

## 可能的追问

- 阈值设高了拒答率飙升怎么办？拒答率是要监控的核心指标，同时看被拒问题的抽样，判断是阈值问题还是知识缺口。
- 用户对拒答不满意怎么办？拒答的措辞和“下一步能做什么”很重要，一个只有“无法回答”四个字的回复体验极差。
