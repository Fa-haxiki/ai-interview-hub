---
title: "线上 RAG 系统要监控哪些指标？怎么建立反馈闭环？"
category: ai
topic: rag
section: 生产工程与系统设计
difficulty: medium
order: 4
tags: [监控, 可观测性, tracing, 反馈闭环, 漂移检测]
sources:
  - title: "Production RAG Architecture in 2026 - prompt20"
    url: "https://blog.prompt20.com/posts/rag-production-architecture/"
    lang: en
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "35 RAG Interview Questions and Answers - Interview Coder"
    url: "https://www.interviewcoder.co/blog/rag-interview-questions"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

我的经验是：**RAG 上线后最难的不是“挂了”，而是“悄悄变差”——接口 200、延迟正常，答案却在退化。所以监控必须在系统指标之外加上检索质量、生成质量和业务反馈三层，并且能从一条差答案回溯到全链路。**

## 四类指标

| 类别 | 指标 | 为什么看 |
| --- | --- | --- |
| 系统 | 各环节延迟 P50/P95/P99、错误率、各环节超时次数、缓存命中率、LLM 限流次数 | 基础可用性 |
| 检索质量 | Top-K 相似度和 Rerank 分数分布、空召回率（无候选过阈值）、拒答率、索引新鲜度 | 分数分布下移往往意味着索引过期或问题分布变了 |
| 生成质量 | 抽样 1%–5% 在线跑 faithfulness / answer relevance、引用有效率（引用 id 是否真的在召回结果里）、输出长度 | 质量是滞后的，只能抽样近似 |
| 业务 | 点赞点踩率、追问率（同一会话反复重述问题）、转人工率、任务完成率 | 最终有没有解决问题 |

四类要交叉看：系统正常但追问率上升，通常是检索出了问题；检索分数正常但点踩上升，多半是生成或 prompt 变了。

## 漂移检测

- **问题分布**：对线上 query 的 embedding 做聚类，冒出新聚类说明用户在问知识库覆盖不到的东西。
- **分数分布突变**：Top-1 相似度中位数、Rerank 分数分布按天对比，突降就报警。
- **拒答聚类**：把拒答和空召回的问题聚在一起，能直接看到知识缺口。

## 全链路 tracing

每次请求记一条 trace：原问题、改写后的问题、路由决策、各路召回的 Top-K 与分数、Rerank 分数、最终 prompt、模型输出与引用、各环节耗时、token 数与费用，以及事后回填的用户反馈。工具可以用 LangSmith、Langfuse、Arize Phoenix，或者自建写入 ClickHouse 这类可查询的存储。没有 trace，每次排查“这条为什么答错”都是猜。trace 建议至少保留 30 天。

## 反馈闭环

```text
点踩 / 追问 / 转人工样本
  → 每周人工标注：错在检索还是生成
  → 回流评测集（golden set 版本化）
  → 每次改动跑回归，指标下降不上线

拒答与空召回聚类
  → 发现知识缺口
  → 补文档 / 调整分块 / 加同义词
  → 观察该类问题的拒答率是否回落
```

关键是把线上样本变成离线评测集的一部分，评测集才会越来越像真实流量，而不是上线前拍脑袋写的一百条。

## 告警与值班

- 硬告警，立即处理：错误率、P95 超阈值、索引同步延迟超 SLA、空召回率骤升。
- 软告警，日报跟进：点踩率、faithfulness 抽样均值、缓存命中率下滑。
- 阈值基于历史分布设定，比如 7 天滚动均值加减 3 个标准差，而不是拍一个固定数。
- 值班手册要写清楚：先看 trace 判断是检索还是生成的问题，再决定回滚 prompt、重建索引还是切换模型。

## 可能的追问

- 在线 LLM-as-judge 太贵怎么办？只抽样 1%–5%，并优先抽“低相似度、被点踩、有追问”的请求，比均匀抽样高效得多。
- 用户很少点赞点踩，反馈从哪来？用隐式信号——追问、复制答案、点击引用、会话是否自然结束——再配合小比例的主动询问。
