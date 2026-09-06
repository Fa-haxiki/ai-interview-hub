---
title: "Self-RAG 和 CRAG（Corrective RAG）分别解决什么问题？核心机制是什么？"
category: ai
topic: rag
section: 高级 RAG
difficulty: hard
order: 2
tags: [Self-RAG, CRAG, 反思 token, 自我修正]
sources:
  - title: "Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection (Asai et al., 2023) - arXiv"
    url: "https://arxiv.org/abs/2310.11511"
    lang: en
  - title: "Corrective Retrieval Augmented Generation (Yan et al., 2024) - arXiv"
    url: "https://arxiv.org/abs/2401.15884"
    lang: en
  - title: "生产级RAG系统构建实践：多路召回、融合重排与自我修正架构详解 - 腾讯云开发者社区"
    url: "https://cloud.tencent.com/developer/article/2733962"
    lang: zh
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
createdAt: "2026-09-06"
---

一句话：**Self-RAG 解决的是“该不该检索、检索到的能不能用、生成的有没有依据”这一串判断由谁来做，答案是让模型自己做；CRAG 解决的是“检索出错了怎么办”，答案是在检索和生成之间加一个纠错模块。** 两者都是在修正朴素 RAG 的同一个假设：无条件检索、无条件相信检索结果。

## Self-RAG：把反思变成 token

Self-RAG（Asai et al., 2023）在模型词表里加了一组反思 token，生成时和普通文字一样被预测出来：

| 反思 token | 取值 | 作用 |
| --- | --- | --- |
| Retrieve | yes / no / continue | 接下来这一段要不要检索 |
| IsRel | relevant / irrelevant | 检索回来的段落和问题是否相关 |
| IsSup | fully / partially / no support | 生成的内容是否被段落支撑 |
| IsUse | 1～5 | 这段回答对用户是否有用 |

生成按段进行：先预测 Retrieve，需要就检索若干段落，对每段并行生成候选并打 IsRel、IsSup、IsUse，再用这些 token 的概率加权做 segment 级 beam search，选出最好的一段接着往下写。训练时不需要在线跑评审模型：先用 GPT-4 标注数据训练一个 critic，再由 critic 离线把反思 token 插进训练语料，最后用普通的 next token prediction 训练生成模型（论文用 Llama2 7B/13B）。推理时调这些 token 的权重和阈值就能改变行为，比如更看重引用准确还是更看重完整性。

## CRAG：给检索结果加一道纠错

CRAG（Yan et al., 2024）不碰生成模型，而是加一个轻量的检索评估器（论文用微调的 T5-large），给检索结果打置信分，按上下两个阈值触发三种动作：

- **Correct**：至少一条文档高于上阈值。做知识精炼：把文档切成若干知识条（strip），逐条打分，过滤掉不相关的再按顺序拼回去，即 decompose-then-recompose；
- **Incorrect**：全部低于下阈值。放弃本地结果，把问题改写成关键词去 Web 搜索补充；
- **Ambiguous**：介于两者之间。精炼后的本地知识和搜索结果合并使用。

论文的消融显示 Ambiguous 这个“软动作”很重要：只有 Correct/Incorrect 二分时，系统对评估器准确率非常敏感，加了中间态之后鲁棒得多。

## 两者对比

| | Self-RAG | CRAG |
| --- | --- | --- |
| 改动位置 | 生成模型本身，需要训练 | 检索与生成之间的独立模块 |
| 判断粒度 | 逐段生成，段落级 | 查询级 + 知识条级 |
| 兜底手段 | 不检索或换段落 | Web 搜索 |
| 落地成本 | 高，换基座要重训 | 低，即插即用，可叠加在任何 RAG 上 |

## 生产里的简化版

我不会真的去训 Self-RAG，但会借它的拆分思路：用 Cross-Encoder 分数或一次便宜的 LLM 调用做相关性判定（对应 IsRel），生成后再让 LLM 校验一遍“每个结论是否有片段支撑”（对应 IsSup）。CRAG 的三分法则直接搬：Rerank 分数高于上阈值正常生成，低于下阈值触发兜底搜索或明确回答“知识库里没有”，中间态两路合并。这就是很多团队所说的“自我修正架构”，成本只多一次小模型推理加一次可选的 LLM 校验。

## 可能的追问

- 检索评估器用 LLM 还是小模型？CRAG 论文里微调过的 T5 判定准确率高于直接 prompt ChatGPT，而且便宜得多；有标注数据就用小模型，没有就先用 LLM 冷启动、再把它的判定结果蒸馏到小模型上。
- CRAG 引入 Web 搜索会不会带来新的噪音？会，所以搜索结果也要过同一个评估器和知识精炼；企业内部场景通常用备用知识源或直接拒答来代替公开搜索。
