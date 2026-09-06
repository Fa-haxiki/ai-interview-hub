---
title: "纯向量检索有什么问题？为什么生产环境默认用混合检索？"
category: ai
topic: rag
section: 混合检索与重排
difficulty: medium
order: 1
tags: [混合检索, BM25, 稀疏检索, 稠密检索]
sources:
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "Production RAG Architecture in 2026 - prompt20"
    url: "https://blog.prompt20.com/posts/rag-production-architecture/"
    lang: en
createdAt: "2026-09-06"
---

这是 RAG 面试的高频题。我的答案：**向量检索擅长“意思相近”，关键词检索擅长“字面精确”，用户的问题两种都有，所以两路都要跑。** 只谈向量相似度会被面试官视为红旗。

## 纯向量检索的三类失败

1. **精确匹配不行**：用户搜 “RFC 7231” 或某个错误码，向量检索可能返回“HTTP 协议规范”这类语义相关、却没提到这个编号的文档。
2. **专业术语与缩写召回差**：“K8s 的 HPA 怎么配”可能被匹配到“Kubernetes 自动扩缩容”的泛泛介绍，真正写着 HPA 配置细节的文档排不上去。术语的向量表示和口语描述往往差得很远。
3. **近似标识符混淆**：GPT-4o 和 GPT-4、HIPAA 和 HITECH、相邻的 SKU 编号，在向量空间里挤在一起，模型分不清。产品名、人名、型号这类专有名词都容易丢。

## 混合检索 = 稠密 + 稀疏

- **稠密（Dense）**：embedding 向量 + ANN，抓语义相关。
- **稀疏（Sparse）**：BM25 / TF-IDF 倒排索引（Elasticsearch、Lucene，或向量库内置的稀疏向量），抓精确词；也可以用 SPLADE 这类学习型稀疏表示。
- 两路并行执行，再用 RRF 或加权分数融合，取长补短。

## 效果

有生产案例显示，在金融研报问答里单路 BGE 稠密检索的 Hit@10 只有六成多，三路召回融合后到了九成以上；Anthropic 的实验里在上下文化 embedding 之上再加 BM25，检索失败率进一步下降约两成。我自己的经验是专业术语密集的场景提升最明显。

## 融合权重怎么定

两种做法：一是手调权重（比如向量 0.7 + BM25 0.3）在验证集上试；二是 RRF 按排名融合、不设权重。生产我更推荐 RRF 做基线，因为不同 query 的最佳权重差异很大，固定权重不稳健；有反馈数据后再考虑学习式融合。

## 可能的追问

- 中文 BM25 要注意什么？分词质量决定一切，要用合适的中文分析器并维护领域词典，否则专有名词被切碎就失去了精确匹配的意义。
- 混合检索会不会拖慢延迟？两路并行跑，BM25 通常几十毫秒，总延迟取两者最大值而不是求和。
