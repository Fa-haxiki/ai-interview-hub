---
title: "Embedding 维度很高时怎么降本？量化和 Matryoshka Representation Learning 分别怎么做？"
category: ai
topic: embedding
section: 工程实践
difficulty: hard
order: 1
tags: [Embedding, 量化, Matryoshka, MRL]
sources:
  - title: "Matryoshka Representation Learning"
    url: "https://arxiv.org/abs/2205.13147"
    lang: en
  - title: "BGE-M3"
    url: "https://huggingface.co/BAAI/bge-m3"
    lang: en
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
createdAt: "2026-09-06"
---

降本有两条路，别混：量化是把已经训好的向量压成更少的比特；Matryoshka（MRL）是训练时就让前缀维度自己能用，线上直接截断。两者都能砍存储和内存，但对召回的伤害方式不同。上线前必须在自己的评测集上看 Recall@K 掉多少，不能只看压缩比。

## 量化：同一条向量，更少比特

常见三档：

- **int8 / 标量量化（SQ）**：每个维度从 float32 收到 8 bit，内存大约降到四分之一。Milvus 的 `IVF_SQ8`、`HNSW_SQ` 就是这一路。
- **二进制量化**：每维收到 1 bit，理论可到 32 倍压缩，靠汉明距离粗筛；单独用召回往往很难看，通常要留一份更高精度向量做重打分。
- **乘积量化（PQ）**：切成子向量，各用码本编号表示，压缩比更高，误差也更结构化。

量化有校准问题：码本或缩放因子要在真实向量分布上估，换模型、换归一化都要重做。查询侧用高精度、库侧用量化，再对 Top 候选用原向量重排，是常见的「先粗后精」。pgvector 的 `halfvec`、bit 类型也是同一思路的轻量实现。

## MRL：一条向量，多层精度

MRL 论文的做法是在训练时对嵌套的前缀维度（比如 8、16、…、768）分别算损失，让前 256 维本身就是一套完整表示，而不是随便截断的残缺向量。所以 768 维模型可以存 256 维去检索，排序质量接近专门训的 256 维模型，推理和索引都按短向量计费。不少新模型把 MRL 做成可配置输出维度。它和 PQ 不同：不需要码本，截哪里由训练时选的粒度决定；中间没直接优化过的维度，论文观察仍大致可插值，但生产里只切官方支持的档位。

## 怎么选、怎么验收

内存紧、模型本身不支持 MRL：先 int8，再考虑 PQ。模型支持 MRL：先截断，量化当下一刀。ANN 参数（HNSW 的 `ef`、IVF 的 `nprobe`）会和量化误差叠在一起，必须联合扫。固定 golden set，看 Recall@10 / Recall@50 相对 float32 全维度掉几个点；能接受再切流量。掉太多就退回：减小压缩、打开 refine、或只对冷数据量化。

## 可能的追问

- 量化和 MRL 能叠用吗？能，先截断再 SQ/PQ，但误差会叠加，每一刀都要单独看召回。
- 为什么 binary 常要重打分？1 bit 只保留方向的粗信息，适合缩小候选池，最终名次仍应交给更高精度分数。
