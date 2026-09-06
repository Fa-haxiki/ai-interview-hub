---
title: "Prefill 和 Decode 有什么差别？KV Cache 解决的是哪一段的重复计算？"
category: ai
topic: llm-basics
section: 训练与推理
difficulty: medium
order: 3
tags: [Prefill, Decode, KV Cache, 推理]
sources:
  - title: "Efficient Memory Management for Large Language Model Serving with PagedAttention"
    url: "https://arxiv.org/abs/2309.06180"
    lang: en
  - title: "Attention Is All You Need (Vaswani et al., 2017)"
    url: "https://arxiv.org/abs/1706.03762"
    lang: en
createdAt: "2026-09-06"
---

一句话：**Prefill 一次性吃完整 Prompt，算力密集；Decode 每个新 token 都要看历史，往往被显存带宽卡住。** KV Cache 把已算过的 Key/Value 存下来，避免 Decode 每步把前面所有 token 的 K/V 重算一遍。

## 两阶段

用户消息、系统提示、检索片段进来后，模型先对整段做一次前向：这一步能并行，GPU 利用率高，对应首字延迟（TTFT）。之后每生成一个 token，只多算当前位置的 Q，去和缓存里的 K 做注意力，再写出新的 K/V。这一步序列短、算得少，但要反复读越来越长的 Cache，对应每个输出 token 的间隔（TPOT / TPS）。

没有 Cache 时，生成第 n 个词理论上要重新编码前 n−1 个词，复杂度按步数平方涨。有 Cache 后，每步近似线性于当前长度，但仍线性占显存。

## 工程含义

- 超长 Prompt（大文档、多轮 messages）会把 Prefill 拉长，用户觉得「半天不吐字」；
- 超长输出或高并发会把 KV Cache 撑满，先 OOM 再降吞吐；
- 批处理要把「还在 Prefill 的请求」和「已经在 Decode 的请求」分开调度，这是 vLLM 连续批处理要解决的事。

面试时我会画：TTFT 看 Prefill，聊天打字机看 Decode，容量看 Cache 字节数。三者不总是一起好，优化目标要说清。

## 可能的追问

- Cache 存在哪？推理服务的 GPU 显存里，按层、按请求分页；不是业务数据库。
- 量化 KV 有什么风险？省显存、可能伤长上下文质量，要在目标上下文长度上回归。
