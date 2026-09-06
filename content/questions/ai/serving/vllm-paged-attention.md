---
title: "vLLM / PagedAttention 解决了服务化的什么问题？和「一张卡跑通 HuggingFace generate」差在哪？"
category: ai
topic: serving
section: 服务化
difficulty: medium
order: 2
tags: [vLLM, PagedAttention, 连续批处理]
sources:
  - title: "Efficient Memory Management for Large Language Model Serving with PagedAttention"
    url: "https://arxiv.org/abs/2309.06180"
    lang: en
  - title: "vLLM documentation"
    url: "https://docs.vllm.ai/en/latest/"
    lang: en
createdAt: "2026-09-06"
---

一句话：**PagedAttention 把 KV Cache 按页分配，连续批处理让请求在 iteration 粒度进出 batch。** 单机 `generate` 给每条请求预留最大长度的连续显存，碎片和浪费会把并发打死。服务框架卖的是调度和显存，不是另一个模型。

## 两个点

没有分页时，你得按 `maxSeqLen` 预留，用户只生成 20 个 token 也占一整条。页表让物理块按需挂上逻辑序列，结束就还页。连续批处理则不是等一个 batch 全部生成完：有的请求 Prefill 完可以立刻加入 Decode 组，结束的立刻腾位。

NestJS 业务进程不该自己加载 70B。它调 vLLM / TensorRT-LLM / 云 API 的 HTTP，带超时、取消和 token 记账。取消很重要：用户关了页面还在 Decode，就是在烧 KV。

## 实践取舍

Demo 用官方 SDK 直连可以。要多租户、限流、按模型路由，中间加一层网关。别在 Node 进程里跑大模型推理。面试能画出「业务 API → 推理集群 → GPU 页表」，比背出算子名更有用。

## 可能的追问

- 和动态 batch 有什么差别？动态 batch 常按请求凑齐；连续批处理按解码步凑齐，对变长输出更友好。
- 前缀缓存是什么？共享同一 System Prompt 的请求可以复用 Prefill 的 KV，TTFT 会下来。
