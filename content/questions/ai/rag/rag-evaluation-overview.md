---
title: "怎么评估一个 RAG 系统的效果？应该分哪几层来看？"
category: ai
topic: rag
section: 评估
difficulty: medium
order: 1
tags: [评估, 检索评估, 生成评估, 端到端]
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

评估 RAG 最重要的一点是**分层**：检索、生成、端到端各评各的。只看最终答案对不对，你永远不知道该修哪一段。

## 三层评估

### 1. 检索层：找得对不对

给一组问题和标注好的“相关文档”，衡量检索器能不能把它们排到前面：

- **Recall@K**：Top-K 里包含了多少比例的相关文档。RAG 最核心的检索指标，K 取实际送给 LLM 的数量（比如 5）。
- **Precision@K**：Top-K 里有多少是相关的，衡量噪音。
- **MRR**：第一条相关结果的排名倒数的平均，关注“最相关的排多前”。
- **NDCG@K**：考虑相关性等级和位置折损，适合有分级标注的场景。

这一层评估不需要 LLM，快、便宜、确定性强，应该作为每次改动的回归测试。

### 2. 生成层：答得好不好

给定检索到的上下文，看模型生成的答案质量：

- **Faithfulness（忠实度）**：答案里的每个陈述是否被上下文支撑，衡量幻觉。
- **Answer Relevance（答案相关性）**：答案是否回应了问题本身，不跑题、不废话。
- **Answer Correctness**：和标准答案比对的正确性（需要有标准答案）。
- 格式、长度、引用完整性等产品维度。

这一层大多靠 LLM-as-judge 打分，要注意 judge 的偏差。

### 3. 端到端：用户满意不满意

- 离线：在 golden set 上跑完整流程，看最终正确率。
- 在线：点赞/点踩率、追问率（用户反复重新提问说明没答好）、拒答率、转人工率、任务完成率。
- 延迟和成本也是端到端指标的一部分。

## 评估的基础设施

- **Golden set**：100～300 条覆盖各类问题的样本，标注相关文档和参考答案，是所有离线评估的前提。
- **工具**：RAGAS、DeepEval、TruLens、LangSmith/LangFuse 等，核心都是把上面的指标自动化。
- **CI 化**：改分块、换模型、调 prompt 都要跑一遍评测，指标下降就不能合并。

## 常见误区

- 只测端到端，改了检索却发现不了到底是哪里好了或坏了。
- 用 20 条样本下结论，方差太大。
- 评测集只有“容易的问题”，上线后被真实问题打脸。
- 完全信任 LLM 打分，从不人工抽检。

## 可能的追问

- 没有标注数据怎么评估？先用 LLM 从文档合成问答对起步，再用线上反馈逐步替换为真实样本。
- 检索指标和端到端指标不一致怎么办？常见，比如 Recall 高但答案差，说明问题在生成层，正是分层评估的价值。
