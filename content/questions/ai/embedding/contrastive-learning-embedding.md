---
title: "文本 Embedding 模型一般怎么训练？对比学习、InfoNCE、难负例是什么？"
category: ai
topic: embedding
section: 原理与训练
difficulty: hard
order: 2
tags: [Embedding, 对比学习, InfoNCE, 难负例]
sources:
  - title: "Dense Passage Retrieval for Open-Domain Question Answering"
    url: "https://arxiv.org/abs/2004.04906"
    lang: en
  - title: "SimCSE: Simple Contrastive Learning of Sentence Embeddings"
    url: "https://arxiv.org/abs/2104.08821"
    lang: en
  - title: "Text Embeddings by Weakly-Supervised Contrastive Pre-training"
    url: "https://arxiv.org/abs/2212.03533"
    lang: en
createdAt: "2026-09-06"
---

主流文本 Embedding 几乎都是双塔加对比学习：正样本对拉近、负样本推远。InfoNCE 是最常用的损失形态，难负例决定模型能不能分开「看起来像、其实不对」的文档。指令微调再告诉模型：这段向量是拿来检索的，还是拿来做相似度的。

## 双塔在训什么

查询和文档各走一个编码器（可以共享权重），分别得到向量，再用点积或余弦打分。文档塔离线预计算，查询塔在线算一次就能检索百万库。DPR 证明：在标注的问答对上最大化相关段落的内积，不必上复杂的 ICT 预训练，就能超过 BM25。这和 Cross-Encoder 精排不是一回事——后者拼在一起算交叉注意力，训得更准但无法预计算。

## InfoNCE 和 in-batch negatives

InfoNCE 的形态可以写成：对每个查询，分子是它和正例的相似度指数，分母再累加它和所有负例的指数，取负对数。温度把分数拉开，避免所有负例都差不多。工程上最便宜的负例是 **in-batch negatives**：batch 里别人的正文档，对本查询就是负例。batch 越大，负例越多，E5 弱监督预训练就靠超大 batch 把这条路走通。SimCSE 更极端：同一句过两次 dropout，自己当正例，batch 内其他句当负例，无监督也能做出可用的句向量。

## 难负例：真正拉开差距的地方

随机负例太好区分，「退款政策」对上「天气预报」学不到边界。难负例是模型当前容易排错的文档：BM25 捞到的字面相近段落、上一轮检索的假阳性、NLI 里的 contradiction。E5 第二阶段会在 MS MARCO / NQ 上用挖掘出的难负例，再向 Cross-Encoder 蒸馏。没有难负例，模型会变成「相关就近、其余一锅炖」，精排也救不回来。

## 指令微调把任务写进输入

E5 给查询加 `query:`、文档加 `passage:`；BGE 检索时只在查询侧加「为这个句子生成表示以用于检索相关文章：」一类指令。同一套权重，靠前缀切换检索、STS、聚类。漏加前缀等于把模型送进没见过的输入分布，分数会 silently 掉。

## 可能的追问

- 共享塔和双塔分开初始化各有什么好处？共享省参数、对称任务稳；分开更适合短查询对长文档的不对称检索。
- 难负例会不会变成假负例？会，尤其是一题多答案时。常用办法是用更强的教师模型过滤，或对高分「负例」降权。
