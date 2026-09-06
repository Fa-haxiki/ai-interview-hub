---
title: "RAGAS 的四个核心指标（Faithfulness、Answer Relevancy、Context Precision、Context Recall）分别衡量什么？大致怎么计算？"
category: ai
topic: rag
section: 评估
difficulty: medium
order: 2
tags: [RAGAS, Faithfulness, Context Recall, 评估指标]
sources:
  - title: "RAGAS 官方文档（Metrics）"
    url: "https://docs.ragas.io/en/stable/concepts/metrics/"
    lang: en
  - title: "RAG Interview Questions: Production Pipeline, Chunking, Reranking & Evaluation - interviewbaba"
    url: "https://interviewbaba.com/rag-interview-questions/"
    lang: en
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

我的答案是：这四个指标两两一组，**Context Precision 和 Context Recall 看检索侧，Faithfulness 和 Answer Relevancy 看生成侧**，取值都在 0～1。它们单看绝对值意义不大，价值在于组合起来告诉你链路的哪一环出了问题。

## 一张表看全

| 指标 | 衡量哪一环 | 一句话含义 | 需要 ground truth |
| --- | --- | --- | --- |
| Faithfulness | 生成 | 答案里的话是不是都有上下文撑着（幻觉） | 不需要 |
| Answer Relevancy | 生成 | 答案是不是在回答这个问题（跑题、敷衍） | 不需要 |
| Context Precision | 检索（排序） | 相关的块是不是排在前面 | 有参考版需要，无参考版用答案代替 |
| Context Recall | 检索（召回） | 该找到的信息有多少被找到了 | 需要 |

## 各自怎么算

**Faithfulness**：先让 LLM 把答案拆成一条条原子陈述，再逐条判断能否从检索到的上下文推出来，得分 = 被支撑的陈述数 / 总陈述数。比如答案说“爱因斯坦 1879 年 3 月 20 日出生于德国”，拆成“出生于德国”和“出生于 3 月 20 日”两条，上下文只支撑前一条，Faithfulness 就是 0.5。

**Answer Relevancy**：思路很巧，不直接给答案打分，而是让 LLM 根据答案**反向生成**几个问题（默认 3 个），算它们与原问题 embedding 的余弦相似度取平均。答案跑题或含糊敷衍时，反推出来的问题会偏离原问题，分数自然低。注意它不检查正确性，只看“对不对题”。

**Context Precision**：对 Top-K 里每个位置的块判断是否相关（对照参考答案，或没有参考时对照最终答案），再按位置加权：在每个相关块出现的位置算一次 precision@k，最后对相关块求平均。相关块排前面得分高，排后面得分低，所以它本质是**排序质量**，不是普通精确率。

**Context Recall**：把参考答案拆成陈述，看每条能否在检索到的上下文中找到依据，比例就是得分。这是四个里唯一必须有标注答案的，因为“该找到什么”只能由 ground truth 定义。

## 实践中怎么读这四个数

我会按“先检索后生成”的顺序看：

- **Context Recall 低**：该找的没找到，问题在分块、embedding、混合检索或 K 太小，此时改 prompt 是白费。
- **Recall 高但 Context Precision 低**：找到了但排在后面、噪音多，加 Rerank 或做阈值截断。
- **检索两项都高但 Faithfulness 低**：上下文对，模型却在编，收紧 prompt 约束、降温度、换模型。
- **Faithfulness 高但 Answer Relevancy 低**：模型忠实地复述了上下文却没回答问题，常见于检索到的块相关但不含答案，或 prompt 让模型过于保守。

一个容易踩的坑：Faithfulness 高不等于答案正确，上下文本身过期或错误时答案再忠实也是错的，需要配合 Answer Correctness 或人工抽检。另外这几个指标底层都是 LLM 打分，换一个 judge 模型分数就不可比，我会先固定 judge 版本再谈趋势。

## 可能的追问

- 四个指标都不错，用户还是不满意怎么办？说明问题在指标覆盖不到的地方：上下文本身的正确性与时效、答案格式和长度、延迟，或者评测集不代表真实问题分布。
- Answer Relevancy 为什么绕一圈反向生成问题，而不直接让 LLM 打分？把主观的“相关度打分”换成更稳定、可复现的 embedding 相似度计算，减少 judge 评分的波动；代价是它对答案正确性完全不敏感。
