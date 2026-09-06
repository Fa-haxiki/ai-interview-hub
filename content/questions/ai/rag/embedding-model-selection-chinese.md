---
title: "Embedding 模型怎么选？中文场景你会用什么，为什么？"
category: ai
topic: rag
section: Embedding 与向量检索
difficulty: medium
order: 2
tags: [Embedding, 选型, bge, MTEB]
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

我不会直接报模型名，而是先讲选型维度，再给出中文场景的结论，最后强调“一定要在自己的数据上测”。

## 选型维度

1. **语言与领域**：训练语料是否覆盖中文？是否覆盖我的领域（法律、金融、代码）？通用网页文本训练出来的模型在专业语料上经常掉点。
2. **效果**：参考 MTEB / C-MTEB 榜单做初筛，但榜单只是起点。
3. **维度与上下文长度**：维度决定存储和检索成本；上下文长度决定块能切多大。
4. **部署方式**：API（省事、按量付费、数据出域）vs 自托管（低延迟、数据不出域、需要 GPU）。
5. **稀疏/多向量能力**：像 bge-m3 这类同时输出稠密、稀疏、多向量表示的模型，一套模型就能支撑混合检索。

## 中文场景的结论

- **自托管首选 BGE 系列**：`bge-large-zh-v1.5` 在中文榜单上长期靠前，1024 维，开源可本地部署；`bge-m3` 支持多语言且同时提供稠密 + 稀疏 + 多向量，中英混排或需要混合检索时更合适。
- **API 方案**：OpenAI `text-embedding-3-small/large` 效果稳定、接入简单，但中文通常不如 bge，且有数据出域与成本问题；国内也有各家云厂商的 embedding 服务可选。
- **维度不是越高越好**：3072 维相对 1024 维的检索提升有限，但存储和内存翻三倍。多数模型支持 Matryoshka 截断，可以按预算选维度。

## 怎么在自己的数据上验证

准备 100～200 条带标准答案片段的领域问题，对候选模型分别建索引，比较 Recall@5 / MRR，同时记录 embedding 延迟。我见过“榜单靠前但在内部术语上明显不如小模型”的情况，所以这一步不能省。如果领域差异很大，还可以用少量标注对 embedding 做微调，收益往往超过换更大的模型。

## 可能的追问

- 查询和文档用同一个模型吗？必须同一个模型（同一个向量空间）；有的模型要求给查询加指令前缀，要按文档说明来。
- 换模型时旧向量怎么办？必须全量重建，不能混用，见「Embedding 升级迁移」一题。
