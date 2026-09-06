---
title: "推理服务里 TTFT、TPS、并发分别被什么卡住？你会从哪几张图排障？"
category: ai
topic: serving
section: 推理原理
difficulty: medium
order: 1
tags: [TTFT, TPS, Prefill, Decode]
sources:
  - title: "Efficient Memory Management for Large Language Model Serving with PagedAttention"
    url: "https://arxiv.org/abs/2309.06180"
    lang: en
  - title: "Orca: A Distributed Serving System for Transformer-Based Generative Models"
    url: "https://www.usenix.org/conference/osdi22/presentation/yu"
    lang: en
createdAt: "2026-09-06"
---

一句话：**首字慢看 Prefill 和排队；打字慢看 Decode 和 KV 带宽；并发上不去看显存里的 Cache 页。** 三张曲线对不上，说明你在用训练思维做服务。

## 指标

- **TTFT**：请求进到第一个 token 出。排队 + Prefill。Prompt 一长，这条先炸。
- **TPOT / TPS**：后续 token 节奏。Decode 小算子，吃显存带宽。
- **并发 / 吞吐**：同时活着的请求数 × 输出速度。活着的请求都占 KV。

Orca 提出 iteration-level 批处理，vLLM 用分页显存把「预留一块连续 KV」变成按页分配，碎片少了，并发才上得去。

## 排障

用户说「慢」先问是等第一字还是每个字都慢。第一字慢：看 Prompt token、是否误把整库塞进上下文、是否都挤在 Prefill 队列。每个字慢：看 batch 是否被长输出请求拖住、是否该限 `maxTokens`。OOM：看 Cache 占用，而不是怪模型文件大小。

## 可能的追问

- 流式一定更快吗？用户体验更快，总计算不少；Prefill 仍要做完才开始流。
- 批越大越好吗？Prefill 大包提高利用率，但会抬高别人的 TTFT，要做 SLA 分级。
