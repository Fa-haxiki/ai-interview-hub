---
title: "RAG 系统怎么做引用和溯源？如何保证回答里的每句话都能对应到来源？"
category: ai
topic: rag
section: 生成与上下文组织
difficulty: medium
order: 2
tags: [引用, 溯源, 可解释性, 结构化输出]
sources:
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "RAG Interview Questions: Production Pipeline, Chunking, Reranking & Evaluation - interviewbaba"
    url: "https://interviewbaba.com/rag-interview-questions/"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

引用是 RAG 相对纯 LLM 最大的产品优势之一：用户能点开来源核对，团队也能靠引用排查幻觉。做好引用有三个层次：**让模型标、机器校验、界面呈现。**

## 第一层：让模型在生成时标注

- 每个检索片段带一个稳定标识（`[1]`、`[2]` 或 doc_id），在 prompt 里明确要求“每个事实性陈述后标注来源编号，没有来源支撑的内容不要写”。
- 用结构化输出（JSON schema / function calling）让模型返回 `{"answer": "...", "citations": [{"claim": "...", "doc_id": "..."}]}`，比在自由文本里解析 `[1]` 可靠得多。
- 模型标错、标空是常态，所以不能只依赖这一层。

## 第二层：程序化校验

- **引用存在性**：模型引用的编号必须在本次检索结果里，凭空出现的编号直接剔除。
- **引用支撑性**：把“陈述 + 被引片段”送给一个小模型（或 NLI 模型）判断片段是否真的支撑该陈述，不支撑的标记为“未验证”或删掉。这本质上就是 RAGAS 的 faithfulness 在线上跑。
- **片段级高亮**：把被引用的原文句子精确定位（字符偏移），前端可以高亮显示。

## 第三层：界面呈现

- 回答里的引用编号可点击，侧栏展开原文片段、文档名、页码/章节、更新时间。
- 显示置信度或“来源数量”提示，没有引用的段落用视觉方式弱化。
- 保留“查看原文”链接，指向文档系统而不是只给片段。

## 元数据是引用的基础

引用做得好不好，一半取决于索引阶段有没有保留元数据：文档标题、URL、页码、章节路径、版本、更新时间。分块时这些信息要随 chunk 一起存，否则生成阶段无从引用。

## 可能的追问

- 引用会不会降低回答流畅度？会稍微增加长度，可以让模型先写答案再单独输出 citations 数组，前端负责渲染。
- 一条陈述综合了多个来源怎么办？允许一个 claim 对应多个 doc_id，并在校验时要求至少一个来源支撑。
