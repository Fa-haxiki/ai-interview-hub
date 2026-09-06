---
title: "PDF 里的表格、多栏排版、扫描件这类复杂文档，你是怎么处理的？"
category: ai
topic: rag
section: 文档处理与分块
difficulty: hard
order: 4
tags: [文档解析, PDF, 表格, OCR]
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

我会先亮观点：**解析质量是 RAG 链路里最容易被低估、却最影响上限的一环。** 表格被抽成一堆乱序数字、页眉页脚混进正文、双栏 PDF 被按行横着读，这些错误后面再好的检索和模型都救不回来。生产复盘里“答案明明在文档里模型却找不到”，很多最后都查到了解析这一步。

## 分类型处理

**表格**
- 优先用版面感知（layout-aware）的解析器把表格识别出来，输出为 Markdown 表格或 HTML，而不是纯文本流。
- 表格单独成块，不和正文混切；块前面加上表标题、所属章节和列名，保证单看这个块也知道在讲什么。
- 大表可以按行分块，但每个块都重复表头；数值密集的查询（“Q3 的营收是多少”）可以走结构化检索（SQL / Elasticsearch）而不是向量检索。

**多栏与复杂版面**
- 用能识别阅读顺序的工具（版面分析模型或商用文档 AI）而不是简单的坐标提取，否则双栏会被横向拼接成乱码。
- 去掉页眉、页脚、页码、水印，否则它们会作为高频噪音出现在几乎每个块里。

**扫描件与图片**
- 走 OCR，并保留置信度；低置信度页面打标记，必要时用多模态模型直接理解页面。
- 图表类内容可以让多模态模型生成一段文字描述再入库，保证“图里的信息”也能被检索到。

## 工程上的几个原则

1. **解析结果要做抽检**：随机抽几十页，人工对比原文，专门看表格和公式。
2. **按来源建立“格式专用通道”**：很多线上事故是某一家客户的 PDF 来自老系统，全链路只有这一类文件解析不出来。尽早识别，单独处理。
3. **保留结构元数据**：页码、章节路径、表格 ID，既能用于引用溯源，也能用于分块和过滤。
4. **解析是离线成本**：多花一点钱用更好的解析器，通常比在线侧靠 Rerank 和 Prompt 修补便宜得多。

## 可能的追问

- 怎么评估解析器好坏？拿一批带表格、多栏、扫描件的样本，人工标注结构，比较表格单元格还原率和阅读顺序正确率。
- 为什么不直接把整页截图给多模态模型？成本和延迟高，且不好做检索；更合理的是解析为主、多模态兜底。
