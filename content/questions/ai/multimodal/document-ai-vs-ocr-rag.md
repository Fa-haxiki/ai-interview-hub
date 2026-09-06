---
title: "扫描件和复杂 PDF 进知识库，OCR、版面分析和 VLM 怎么分工？"
category: ai
topic: multimodal
section: 文档理解
difficulty: medium
order: 2
tags: [OCR, 版面分析, VLM, 文档]
sources:
  - title: "LayoutLM: Pre-training of Text and Layout for Document Image Understanding"
    url: "https://arxiv.org/abs/1912.13318"
    lang: en
  - title: "Donut: OCR-free Document Understanding Transformer"
    url: "https://arxiv.org/abs/2111.15664"
    lang: en
createdAt: "2026-09-06"
---

一句话：**印刷体走 OCR + 版面（阅读顺序、表格结构），版面乱或有图才上 VLM，最后仍要落到可引用的文本块再进 RAG。** 端到端把整页图塞给多模态模型能做 demo，贵、慢、引用对不回像素。

## 分工

- **OCR**：拿字。评估用字符/字段准确率，不是用聊天手感。
- **版面分析**：谁在谁上面、表格行列、页眉页脚要丢掉。LayoutLM 一类把坐标和文字一起编码。
- **VLM / Donut 一类**：图表、印章、手写、跨栏阅读顺序崩溃时的补救。Donut 展示了可以少依赖 OCR，但不等于生产可以扔掉结构。

块要带 `page`、`bbox`、`type=table|para`。用户问「第三页表格第二行」时，你才能引用。解析失败率要进监控，和检索失败分开。

## 实践取舍

NestJS 侧这是异步流水线，不是一次 HTTP 里调 VLM。和 RAG 主题的复杂 PDF 题衔接：这里强调模态选择，那边强调切块。能用文本层的 PDF 不要先渲染成图。

## 可能的追问

- 表格用 HTML 还是截图？能还原结构就用 HTML/Markdown，VLM 只处理还原失败的页。
- 多栏论文阅读顺序错了会怎样？检索到的句子是断的，生成会一本正经地拼错因果关系。
