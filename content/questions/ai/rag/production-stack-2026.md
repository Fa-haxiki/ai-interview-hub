---
title: "2026 年一个生产级 RAG 系统的“默认技术栈”是什么？每一环你会怎么选、为什么？"
category: ai
topic: rag
section: 生产工程与系统设计
difficulty: medium
order: 7
tags: [技术选型, 技术栈, Embedding, 向量库, Rerank]
sources:
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
  - title: "Production RAG Architecture in 2026 - prompt20"
    url: "https://blog.prompt20.com/posts/rag-production-architecture/"
    lang: en
  - title: "RAG Interview Questions: Production Pipeline, Chunking, Reranking & Evaluation - interviewbaba"
    url: "https://interviewbaba.com/rag-interview-questions/"
    lang: en
createdAt: "2026-09-06"
---

我的答案分两层：**先给出一套“不会出错的默认栈”作为起点，再强调真正的选型必须靠自己的评测集决定。** 默认栈的价值是让团队第一周就跑通端到端，而不是在选型上争论一个月。

## 我的默认栈（2026 年版）

| 环节 | 默认选择 | 备选 | 我的理由 |
|---|---|---|---|
| 文档解析 | Unstructured / Docling，PDF 用 MinerU（含 OCR 与表格） | LlamaParse、云厂商 Document AI、Marker | 解析决定质量上限，开源方案已能覆盖大多数版式；表格多、扫描件多时再上商用 API |
| 分块 | 递归字符分块 + 父子块（小块检索、大块喂模型） | 上下文化分块（Contextual Retrieval）、按标题结构切 | 递归分块简单可控；父子块化解“检索要精、生成要全”的矛盾；上下文化分块用一次 LLM 调用换明显的召回提升，预算允许就加 |
| Embedding | 中文 / 多语言场景用 BGE-M3 或 Qwen3-Embedding 自托管 | 商用 API（OpenAI、Cohere 等） | 开源模型在中文榜单上不输商用，自托管数据不出域；BGE-M3 还能同时输出稀疏向量 |
| 向量库 | pgvector 起步 | Milvus / Qdrant 规模化；托管服务（Zilliz、Pinecone 等） | 已有 Postgres 就别加组件；千万级向量以上或过滤条件复杂时再迁移 |
| 稀疏检索 | BM25，用 Elasticsearch / OpenSearch 或向量库内置 | BGE-M3 的稀疏输出、SPLADE | 术语、编号、产品名靠 BM25 兜底；已有 ES 的团队直接复用 |
| 融合 | RRF（k=60） | 加权分数融合、学习式融合 | RRF 不需要归一化分数、对参数不敏感；评测证明某一路明显更强时才加权 |
| Rerank | bge-reranker-v2-m3 自托管 | Cohere Rerank、更大的开源 reranker | 性价比最高的质量提升；Top-50 精排到 Top-5，GPU 上几十毫秒 |
| 生成模型 | 按成本分级：简单问题小模型，复杂问题旗舰模型 | 全部用单一模型 | 模型路由能把成本压下一个量级；合规场景选可私有化部署的开源模型 |
| 编排 | 自研薄封装 | LangChain / LlamaIndex / LangGraph | 框架适合原型；生产上通常只用到其中一小部分能力，抽象层反而妨碍调试与替换 |
| 评估 | RAGAS 指标 + 自建 golden set | TruLens、DeepEval | RAGAS 给统一指标口径，但 golden set 才是真正反映业务的标尺 |
| 可观测 | Langfuse（自托管友好） | LangSmith、Arize Phoenix | 每次请求的 trace（query、命中 chunk、分数、回答）是排障和评测的基础 |

## 几个选择背后的思考

**为什么很多团队最终自研编排？** 我的经验是框架在 demo 阶段能省两天，在生产阶段会多花两周：版本变动频繁、抽象层隐藏了 Prompt 和检索细节、出问题时 trace 要穿透多层封装。RAG 的核心链路其实就几百行代码，自己写一层薄封装、把每个组件做成可替换接口，反而更好维护。LangGraph 这类图编排在 Agentic 场景还是有价值的。

**为什么 pgvector 是起点而不是 Milvus？** 大多数企业知识库在百万级 chunk 以内，pgvector 的 HNSW 完全够用，还能和业务表做 join、共用一套备份和权限体系。换库的信号很明确：向量数超过千万、过滤条件复杂导致召回下降、或者需要多副本高可用。

**为什么开源 Embedding 和 Reranker 可以当默认？** 中文场景下 BGE 系列和 Qwen 系列的效果已经很接近商用 API，而自托管同时解决了数据出域和成本随调用量线性增长两个问题。当然如果团队没有 GPU 运维能力，商用 API 是更务实的起点。

## 默认栈只是起点

我会向面试官强调三点：

1. **靠评测集决定替换**：每换一个组件，都在同一份 golden set 上跑一遍，看召回、忠实度、延迟、成本的变化，不凭感觉。
2. **分阶段加复杂度**：先跑通最简链路，再按失败模式加混合检索、Rerank、上下文化分块。
3. **选型会过时**：这张表反映的是 2026 年的情况，模型和向量库每个季度都在变，重要的是保留替换能力，而不是记住某个名字。

## 可能的追问

- 如果预算只够改一个环节，改哪个？加 Rerank 或换更好的解析器，取决于失败分析：命中了但排不上是前者，根本没索引对是后者。
- 什么时候该用托管的一体化 RAG 服务？原型期、没有 ML 基础设施团队、数据规模不大、RAG 不是核心竞争力时用托管更快；等有了数据知道该优化什么，再逐个组件替换成自建，通常先换 Reranker，最后才换向量库。
