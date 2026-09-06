---
title: "图文混合检索怎么做 Embedding？和「先 OCR 再文本向量」怎么选？"
category: ai
topic: multimodal
section: 多模态检索
difficulty: medium
order: 3
tags: [多模态检索, CLIP, Embedding]
sources:
  - title: "Learning Transferable Visual Models From Natural Language Supervision (CLIP)"
    url: "https://arxiv.org/abs/2103.00020"
    lang: en
  - title: "SigLIP: Sigmoid Loss for Language Image Pre-Training"
    url: "https://arxiv.org/abs/2303.15343"
    lang: en
createdAt: "2026-09-06"
---

一句话：**图文共享向量空间（CLIP / SigLIP）适合「用句子搜图、用图搜图」；文档问答仍应优先 OCR 成文本再走文本 Embedding。** 混在一个 index 里可以，但要带模态字段，避免图片向量抢走本该给段落的位置。

## 两种索引

1. **文本化后单模检索**：图和扫描件变成文字，和 PDF 文本同一套 bge / GTE。实现简单，引用清晰，丢的是「图标长什么样」。
2. **双塔多模**：图走视觉塔，query 走文本塔，同一空间近邻。适合素材库、商品图、UI 截图。对「图中第三段小字」通常不如 OCR。

也可以两路召回再融合：文本 BM25 + 文本向量 + 图像向量，用 RRF。query 路由很重要：用户贴图走图像塔，用户打字且知识库是制度文档，不要强行走 CLIP。

## 实践取舍

空间必须同源。文本 bge 和图像 CLIP 不能直接比余弦。换多模模型要重建该路索引。权限过滤仍按文档 ACL，不要因为是图就绕过。

## 可能的追问

- 一张图多个对象怎么切？按检测框切成子图再 embed，和文档按块切是同一思想。
- 截图里的文字要不要 OCR？要，两路特征互补，只靠 CLIP 对小字不稳。
