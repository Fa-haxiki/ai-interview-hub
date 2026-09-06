---
title: "指令型 Embedding（Instruct / prefix）是什么？查询侧和文档侧为什么要区分？"
category: ai
topic: embedding
section: 选型与评测
difficulty: medium
order: 2
tags: [Embedding, Instruct, 前缀, 不对称编码]
sources:
  - title: "Text Embeddings by Weakly-Supervised Contrastive Pre-training"
    url: "https://arxiv.org/abs/2212.03533"
    lang: en
  - title: "BGE-M3"
    url: "https://huggingface.co/BAAI/bge-m3"
    lang: en
createdAt: "2026-09-06"
---

指令型 Embedding 把「这段向量要干什么」写进输入：查询加任务前缀，文档按模型约定加或不加。查询和文档要区分，是因为检索本身不对称——短问题对长段落，两边如果用同一套编码，模型分不清「我要找什么」和「我是被找的内容」。漏加前缀是线上最常见的 silent 掉点。

## 前缀在训练里扮演什么角色

E5 用共享编码器，靠 `query:` 和 `passage:` 打破对称：同一套权重，输入分布不同，向量几何就不同。论文写明，这种不对称设计对「语料里存在查询复述」的检索很关键。BGE v1.5 则是查询侧加检索指令（中文常见「为这个句子生成表示以用于检索相关文章：」），文档侧保持原文。GTE 等后续 instruct 模型也走「任务写在输入里」这条路。约定不能串台：把 E5 的 `query:` 套到 BGE 上，等于喂它没见过的 token 序列。

## 为什么查询和文档不能一视同仁

检索是短查询找长文档，不是两段对等文本比相似度。查询编码需要「面向检索」的归纳偏置，文档编码需要「被检索」的表示。STS、聚类、分类是对称任务，E5 的建议是两侧都用 `query:` 前缀；只有不对称检索才 query / passage 成对出现。有的模型还会把聚类、分类拆成不同 input type。多任务共用一个模型时，换 instruction 比换模型便宜，但必须和训练时一致。

## 漏加前缀会怎样

模型卡写得很直白：E5 不加 `query:` / `passage:` 就会掉点。BGE v1.5 检索短查询时建议加指令，文档永不加；v1.5 相对前代已经减弱了对指令的依赖，但「按卡做」仍是默认。BGE-M3 明确说不再要求查询加指令，抄 v1.5 的前缀反而可能有害。工程上要在 encode 路径里写死：查询走 `encode_queries`，语料走 `encode_corpus`，别让离线脚本和在线服务各写一套字符串。

## 落地检查

换模型、做 A/B、复现榜单分数，第一件事是对一下前缀、大小写和空格。评测加了、线上没加，会表现为「自己测很高、用户觉得不准」。

## 可能的追问

- 文档侧加了查询指令会怎样？文档被编成「提问风格」的向量，和真实查询的匹配会乱，越长的库越伤。
- 一个索引能服务检索和聚类吗？可以共用向量，但聚类应按模型卡改用对称指令重新编码，不要直接拿检索向量做主题聚类。
