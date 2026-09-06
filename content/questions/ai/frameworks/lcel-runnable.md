---
title: "LCEL（LangChain Expression Language）是什么？和早期 Chain 比有什么优势？"
category: ai
topic: frameworks
section: LangChain 核心
difficulty: medium
order: 2
tags: [LCEL, Runnable, Chain]
sources:
  - title: "LangChain Expression Language (LCEL)"
    url: "https://python.langchain.com/docs/concepts/lcel/"
    lang: en
  - title: "LangChain overview"
    url: "https://docs.langchain.com/oss/python/langchain/overview"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

LCEL 是用 `|` 把一组 **Runnable** 声明式地拼成流水线的组合语言。它的价值不是新语法，而是给每条链统一的执行契约：`invoke` / `stream` / `batch` / `ainvoke` 一套接口走到底，并自动带上并行、流式、重试和 tracing。一句话：**早期是子类膨胀的 Chain，现在是可组合的 Runnable 图。**

## 和早期 Chain 的差别

早期常见 `LLMChain`、`SequentialChain`、`RetrievalQA` 这类具体子类：每加一种组合就要新类，输入输出字段对不齐，流式和异步要各自实现一遍。LCEL 把「组合」从继承改成管道：任何实现了 Runnable 协议的组件都能用 `|` 接上，链本身还是 Runnable，可以再嵌套。

```python
# 串行
chain = prompt | model | parser

# 检索和原问题并行取出，再填进 Prompt
rag = (
    RunnableParallel(docs=retriever, question=RunnablePassthrough())
    | prompt
    | model
    | parser
)

chain.invoke(q)
chain.stream(q)          # 同一条链直接流式
chain.batch([q1, q2])    # 批量
await chain.ainvoke(q)   # 异步
```

`RunnableParallel` 这类原语让互不依赖的步骤自动并行；流式可以从模型一路透传到最外层，不必为每条链手写 generator。`batch` 适合离线评测或批量摘要，`ainvoke` 适合高并发服务端。面试时我会补一句：接口统一的意义是「组合一次、四种执行方式都有」，而不是再为流式单独写一套类。

## 运行时能力

组合之后，框架可以在 Runnable 树上做统一处理：失败重试、超时、LangSmith tracing、以及把链序列化后跨进程加载。早期 Chain 这些能力是补丁式的，覆盖不全。另一个实际好处是调试：链被展开成一段段 Runnable，trace 里能看到每一步的输入输出，比一个巨大的 `RetrievalQA.__call__` 好查。当然前提是你没有把业务逻辑藏进过深的自定义子类，否则泄漏回来的还是黑盒。

## 实践取舍

简单线性流水线用 LCEL 很干净。一旦出现循环、按模型决策跳转、人机审批，LCEL 的 DAG 表达力就不够了，这时我会换成 LangGraph。生产里我也不会把业务逻辑全塞进超长管道——管道负责「数据怎么流」，分支和副作用尽量写成可读的函数节点。调试时如果某一步输入对不上，先把链拆开分别 `invoke`，比盯着整条 `|` 表达式猜更快。

## 可能的追问

- `|` 左右两边必须是什么？都必须是 Runnable；普通函数可以用 `RunnableLambda` 包一层。
- 为什么说 LCEL 可序列化有用？可以把链配置存下来做版本管理、跨服务复用，而不只是一份 Python 对象。
