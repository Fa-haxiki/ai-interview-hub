---
title: "Rerank 模型怎么选？延迟预算有限时怎么权衡候选数量、模型大小和效果？"
category: ai
topic: rag
section: 混合检索与重排
difficulty: hard
order: 4
tags: [Rerank, 选型, 延迟, bge-reranker, Cohere]
sources:
  - title: "Production RAG Architecture in 2026 - prompt20"
    url: "https://blog.prompt20.com/posts/rag-production-architecture/"
    lang: en
  - title: "RAG Interview Questions: Production Pipeline, Chunking, Reranking & Evaluation - interviewbaba"
    url: "https://interviewbaba.com/rag-interview-questions/"
    lang: en
  - title: "生产级RAG系统构建实践：多路召回、融合重排与自我修正架构详解 - 腾讯云开发者社区"
    url: "https://cloud.tencent.com/developer/article/2733962"
    lang: zh
createdAt: "2026-09-06"
---

Rerank 是整条链路里“质量密度”最高的一环，也是延迟预算里最容易超支的一环。我会从三个可调的旋钮来讲：**候选数量、模型大小、部署方式**。

## 选型维度

1. **语言**：中文场景优先多语言模型（`bge-reranker-v2-m3`、Cohere Rerank 多语言版本），英文专用模型在中文上会明显掉点。
2. **部署**：API（Cohere、Voyage 等）省运维、按调用计费、数据出域；自托管（BGE、Jina）需要 GPU 或接受 CPU 延迟，但数据不出域、成本随量摊薄。
3. **规模与延迟**：约 0.3B 以下的轻量模型可以在 CPU 上跑几十条候选；0.6B 级别（bge-reranker-v2-m3）在单 GPU 上重排 100 条约几十到一百毫秒；2B 以上（bge-reranker-v2-gemma）质量更好但延迟成倍增加。
4. **领域**：代码、金融等有专门优化的模型，有条件就在自己的评测集上比一下。

## 延迟预算怎么分配

一次 Rerank 的耗时约等于“一批候选的一次前向”，主要由候选数 × 每条长度决定：

- **控制候选数**：从 100 降到 20，成本和延迟大约降 5 倍，而第一阶段召回的上限通常在 Top-50 以内就到了，超过 100 条几乎没有收益。
- **控制输入长度**：对每条候选截断到 512 token 左右，长块先用父子结构拿摘要块参与重排。
- **批处理与并行**：候选拼成一个 batch 一次前向；多路召回并行执行后再统一 Rerank。
- **缓存**：相同 (query, doc) 对的分数可以缓存，高频问题命中率不低。
- **分级路由**：简单问题（意图明确、Top-1 分数远高于 Top-2）跳过 Rerank；复杂问题才走完整流程。

## 一组参考数字

有生产系统把各检索器的超时设成 dense 100 ms / bm25 150 ms，Rerank 用 Cross-Encoder 批处理，整体端到端平均 400 多毫秒、P95 不到 900 毫秒。这个量级说明 Rerank 完全可以放进交互式产品的延迟预算，前提是候选数要收住。

## 我怎么做决策

先用 `bge-reranker-v2-m3` 自托管作为基线（开源、多语言、性价比高），在评测集上测“加 Rerank 前后的 Recall@5 提升”和 P95 延迟。如果提升不到 10 个点，先怀疑阈值和候选数设置，而不是结论“Rerank 没用”。

## 可能的追问

- Rerank 分数能直接当置信度用吗？可以做相对比较和阈值截断，但跨 query 的绝对值意义有限，需要在评测集上标定。
- ColBERT 这类晚交互模型算 Rerank 吗？它介于双塔和交叉编码之间，可以做低延迟的精排替代方案，代价是索引体积大。
