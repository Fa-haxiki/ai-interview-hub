---
title: "MTEB / C-MTEB 榜单怎么读？为什么榜一模型上线不一定最好？"
category: ai
topic: embedding
section: 选型与评测
difficulty: medium
order: 1
tags: [MTEB, C-MTEB, 评测, Embedding]
sources:
  - title: "MTEB: Massive Text Embedding Benchmark"
    url: "https://arxiv.org/abs/2210.07316"
    lang: en
  - title: "MTEB: Massive Text Embedding Benchmark"
    url: "https://huggingface.co/blog/mteb"
    lang: en
  - title: "BGE-M3"
    url: "https://huggingface.co/BAAI/bge-m3"
    lang: en
createdAt: "2026-09-06"
---

我会把榜单当初筛，不当验收。MTEB 论文自己的结论就是：没有一个模型在所有任务上称王。平均分第一，只说明它在公开、偏通用的任务集合上更均衡，不保证你的检索、你的语言、你的领域最好。中文场景怎么挑模型，选型清单在 RAG 主题，这里只讲榜单怎么读、为什么不能直接上线。

## 榜单在测什么

MTEB 把 Embedding 拆成多类任务：检索、重排、聚类、分类、句对分类、STS、双语挖掘、摘要等。检索看 nDCG@10，STS 看 Spearman，分类是在冻结向量上训一个浅层分类器。C-MTEB 是中文扩展，大约 35 个数据集、6 类任务，检索子集覆盖通搜、电商、医疗、视频等。同一模型在 STS 很高、检索一般，非常常见——SimCSE 就是论文里点名的例子。做 RAG，先看检索列，再看平均分。

## 四个上线陷阱

1. **任务错位**：你要的是短查询找长文档，榜单平均分却被分类、STS 拉高。对称相似度好的模型，不一定擅长不对称检索。
2. **领域偏移**：公开集多是维基、网页、通用问答。内部工单、合同条款、SKU、错误码在分布外，榜一也可能全面输给小模型。
3. **指令不一致**：评测脚本给查询加了 BGE 那类 instruction，你线上没加，或评测没加、线上乱加，分数对不上。
4. **评测泄漏与切块差异**：有的模型在 BEIR / C-MTEB 相关数据上训过；你自己的 chunk 长度、标题拼接方式和评测语料也不一样。

## 必须用自己的 golden set

准备本领域的「问题 → 应召回片段」，覆盖术语、编号、短查询长文档、易混专名。同一套切块和前缀，比 Recall@K / nDCG / MRR，同时记延迟和维度成本。公开榜还会把速度、向量维度画进去，平均分最高的往往也最贵；这一百到两百条高质量题，比盯着公开平均分更能决定上谁。榜单告诉你「别漏看这类模型」，golden set 告诉你「这个模型能不能上线」。

## 可能的追问

- 为什么 STS 高不能推导检索好？STS 是对称句对打分，检索是短查询对长文档排序，训练目标和难度都不一样。
- 多语言模型的平均分怎么读？先看目标语言子集和检索任务，再看总体平均，避免被英语任务稀释或抬高。
