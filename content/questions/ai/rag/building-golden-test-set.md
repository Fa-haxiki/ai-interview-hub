---
title: "怎么构建 RAG 的评测集（golden set）？没有标注数据时怎么起步？"
category: ai
topic: rag
section: 评估
difficulty: medium
order: 4
tags: [golden set, 评测集, 合成数据, 数据标注]
sources:
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "Production RAG Architecture in 2026 - prompt20"
    url: "https://blog.prompt20.com/posts/rag-production-architecture/"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
  - title: "RAG Interview Questions: Production Pipeline, Chunking, Reranking & Evaluation - interviewbaba"
    url: "https://interviewbaba.com/rag-interview-questions/"
    lang: en
createdAt: "2026-09-06"
---

我的做法可以概括成一句话：**先用 LLM 从文档合成一两百条冷启动，上线后用真实问题和点踩样本持续替换，并把评测集当代码一样做版本管理。** 评测集不是一次性交付物，而是跟着产品一起长的活资产。

## 一条样本长什么样

```text
question:          "报销单超过 30 天还能提交吗？"
relevant_docs:     ["finance-policy.md#reimbursement-deadline"]   # 段落级锚点，不是 chunk id
reference_answer:  "不能。财务制度规定报销须在费用发生后 30 天内提交，超期需部门负责人特批。"
type:              factual        # factual / comparison / multi-hop / out-of-scope / multi-turn
difficulty:        easy
origin:            synthetic      # synthetic / production / thumbs-down
```

相关文档 id 用来算 Recall@K，参考答案用来算 Context Recall 和 Answer Correctness，缺一个就有一层评不了。

## 规模与覆盖

规模上 **100～300 条起步**：20 条的方差大到什么结论都下不了，但覆盖比数量更重要，先把覆盖面做全再谈规模。我会按问题类型分层，下面是一个参考分配：

| 类型 | 例子 | 检验什么 | 大致占比 |
| --- | --- | --- | --- |
| 事实型（单跳） | “年假有几天” | 基础召回与忠实度 | 40% |
| 比较/汇总 | “A 方案和 B 方案的区别” | 多块召回、信息整合 | 15% |
| 多跳 | 答案需要串两处文档 | 检索深度、推理 | 15% |
| 超出范围应拒答 | 知识库里根本没有 | 幻觉、拒答能力 | 15% |
| 多轮/指代 | “那它的上限呢” | query 改写 | 15% |

另外要保证 **难例占两到三成**：术语缩写、口语化表述、有近义干扰段落的问题。评测集全是容易题，指标会漂亮到骗过自己，上线才被真实问题打脸。

## 没有标注数据怎么起步

冷启动用 LLM 合成：对每个文档或块，让模型生成若干“问题 + 答案 + 支撑句”，源块 id 天然就是标注。这一步快且便宜，但有三个系统性偏差：

1. **问法太像原文**：模型是“看着原文出题”，用词和文档高度重合，检索太容易，Recall 会虚高。缓解：再让 LLM 用用户口吻改写、换同义词、故意省略关键词。
2. **分布不代表用户**：真实用户问的是他们的困惑，不是文档的结构。合成集几乎不会自然产生拒答题和多跳题，这两类要手工补。
3. **答案质量参差**：合成的参考答案也可能有错，必须人工过一遍。审核比从零写快得多，这才是合成的价值。

## 用线上数据持续补充

上线后从日志抽样真实问题，**点踩、反复追问、转人工的样本优先进评测集**，它们是最有价值的难例。标注只需要补“相关文档 + 参考答案”，业务专家每条几分钟。我的目标是一两个季度后合成样本降到少数，评测集主体来自真实流量；每个线上事故也应该变成一条新样本，否则评测集会慢慢和真实负载脱节。

## 版本管理与防止泄漏

评测集入 git 或做数据版本化，每次增删记录说明，评估结果必须绑定评测集版本，否则前后分数不可比。更隐蔽的风险是**泄漏**：拿评测集里的问题去调 prompt、写 few-shot 示例，等于让系统“背题”，指标持续上涨而线上毫无变化。我会拆成 dev set（可用来调参、看 case）和 held-out test set（只跑最终回归、不看具体样本），两边定期轮换。

## 可能的追问

- 文档更新了，评测集怎么维护？把标注锚定到源文档段落而非 chunk id，文档变更时触发相关样本复核，过期样本先打标记而不是静默删除。
- 评测集多大才能看出一两个点的提升？在 300 条上通常淹没在噪音里，我会用成对比较（同一问题新旧版本各答一次）加 bootstrap 置信区间，而不是只看均值差；看不出差异时先在难例子集上放大差异，不急着下结论。
