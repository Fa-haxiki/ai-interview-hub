---
title: "RAG 的端到端延迟怎么优化？各环节大概耗时多少，可以在哪里取舍？"
category: ai
topic: rag
section: 生产工程与系统设计
difficulty: hard
order: 2
tags: [延迟优化, TTFT, 语义缓存, 流式输出, P95]
sources:
  - title: "Production RAG Architecture in 2026 - prompt20"
    url: "https://blog.prompt20.com/posts/rag-production-architecture/"
    lang: en
  - title: "35 RAG Interview Questions and Answers - Interview Coder"
    url: "https://www.interviewcoder.co/blog/rag-interview-questions"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
  - title: "生产级RAG系统构建实践：多路召回、融合重排与自我修正架构详解 - 腾讯云开发者社区"
    url: "https://cloud.tencent.com/developer/article/2733962"
    lang: zh
createdAt: "2026-09-06"
---

结论先行：**RAG 的延迟大头几乎总是 LLM 生成，检索侧全部加起来通常只有两三百毫秒。所以优化顺序是先把生成“藏起来”（流式 + 缓存），再把检索侧并行化，最后才逐环节压榨。** 而且用户感知的是首 token 时间（TTFT），不是总时长。

## 先把链路拆开算账

单次请求、无缓存、云端 API 的参考值：

| 环节 | 典型耗时（参考值） | 说明 |
| --- | --- | --- |
| Query 改写 / 路由（小模型） | 100–300 ms | 一次额外 LLM 调用，是否必要要打问号 |
| Query embedding | 20–50 ms | 自托管更快，API 多一跳网络 |
| 向量检索（HNSW，千万级） | 10–50 ms | 带 metadata filter 会更慢 |
| BM25 检索 | 10–50 ms | 应与向量检索并行 |
| Rerank（100 条候选） | 50–200 ms | 由候选数和模型大小决定 |
| LLM 生成 | TTFT 300–800 ms，之后与输出长度成正比 | 500 token 输出常要 1.5–3 s |

串行下来 P50 在 2–4 s，其中检索侧只占 200–500 ms。这就是为什么“把向量检索从 30 ms 压到 15 ms”几乎没有体感。

## 优化手段（按性价比排序）

1. **流式输出**：TTFT 决定等待感，总时长决定完成时间。流式后用户 1 s 内看到字，剩下的时间是“边看边等”。零成本，先做。
2. **语义缓存**：历史问题的 embedding 存起来，新问题相似度超过阈值（参考 0.95）直接复用答案，命中只要几十毫秒。FAQ 类场景命中率可以到两三成，但要随文档更新失效。
3. **多路检索并行**：向量、BM25、多条改写 query 并发执行，每路设超时（参考 100–150 ms），超时的那路直接丢弃。
4. **缩短生成侧输入输出**：Rerank 后只送 3–5 条并截断；prompt 里约束回答长度。输入少则 TTFT 短，输出少则总时长短。
5. **分级路由**：闲聊不检索，简单问题跳过改写和 Rerank，改写和路由用小模型或分类器。Rerank 环节候选数、截断、批处理的取舍，我在 Rerank 选型那题里讲过，思路一致。
6. **缓存中间结果**：query embedding、检索结果（key 为 query + filter）、Rerank 分数都能缓存，命中率比整答案缓存更高。
7. **基础设施**：向量库和 LLM 连接池、keep-alive、就近部署；自托管 LLM 用 vLLM 一类支持 continuous batching 和 prefix caching 的推理服务；固定系统 prompt 走 prompt cache。
8. **预取**：用户输入停顿时就开始 embedding 和检索，多轮对话提前准备上一轮的上下文。

## 一个参考预算：P95 首 token < 2 s

```text
路由 / 改写（小模型或跳过）   ≤ 150 ms
embedding + 并行检索          ≤ 100 ms
Rerank（≤ 30 条候选）         ≤ 100 ms
组装 + 网络                   ≤  50 ms
LLM TTFT                      ≤ 800 ms
--------------------------------------
首 token 到达                 ≈ 1.2 s，剩余 0.8 s 留给 P95 抖动
```

后续输出以流式呈现，不计入 TTFT 预算，整体建议在 3–4 s 内结束。

## 取舍点

- **改写 vs 不改写**：多 200 ms 能换来召回提升，但对短而明确的问题是纯浪费，用分类器决定。
- **Rerank 候选数**：100 降到 20，延迟约降 5 倍，召回上限损失很小。
- **语义缓存阈值**：放松阈值命中率高但可能答错问题，我宁可保守，并对缓存答案打标记方便追踪。
- **强模型 vs 快模型**：复杂推理才用强模型，事实性问答用快模型；宁可在路由上多花 50 ms，也别让所有请求都走最慢的模型。
- **检索深度 vs 延迟**：Agentic 多跳检索质量更好但延迟成倍增长，只给明确需要的问题用。

## 可能的追问

- 为什么不把所有请求都缓存？答案依赖用户权限和文档版本，缓存 key 必须包含租户和权限范围，并在文档更新时失效，否则会串答。
- P99 毛刺通常是什么原因？LLM API 排队限流、向量库 compaction、embedding 模型冷启动。每路设超时加降级路径（超时就少送几条或跳过 Rerank），比追求平均值更重要。
