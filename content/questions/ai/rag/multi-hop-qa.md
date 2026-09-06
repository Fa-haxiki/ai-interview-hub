---
title: "多跳问答（需要串联多个文档才能回答）在 RAG 里怎么做？"
category: ai
topic: rag
section: 高级 RAG
difficulty: hard
order: 4
tags: [多跳问答, IRCoT, 问题分解, HotpotQA]
sources:
  - title: "Interleaving Retrieval with Chain-of-Thought Reasoning for Knowledge-Intensive Multi-Step Questions (IRCoT, Trivedi et al., 2023) - arXiv"
    url: "https://arxiv.org/abs/2212.10509"
    lang: en
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "Production RAG Architecture in 2026 - prompt20"
    url: "https://blog.prompt20.com/posts/rag-production-architecture/"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

我的答案是：**多跳问题的本质是第二跳的检索词藏在第一跳的答案里，问题本身根本不包含它，所以“用原问题检索一次”注定失败；所有解法都是让检索变成多轮，并且让每一轮的 query 由上一轮的结果生成。**

## 为什么单次检索会失败

“写认证服务的那位工程师，他的主管是谁？”要先查到工程师是 Alice，再查 Alice 的主管。原问题的 embedding 里没有“Alice”，向量库里关于 Alice 主管的那条记录和问题几乎没有相似度，BM25 同样匹配不上。就算把 Top-K 放大到 50，第二跳的文档也大概率不在里面。

## 几种做法

1. **问题分解，顺序检索。** 让 LLM 先把问题拆成子问题：“谁写了认证服务”→“{答案} 的主管是谁”，第二个子问题带占位符，等第一跳的答案填进去再检索。简单直接，适合结构清晰的两跳问题；缺点是分解发生在看到任何文档之前，拆错就全错。
2. **迭代检索（IRCoT）。** Trivedi et al.（2023）的思路是边推理边检索：先用原问题检索一批段落，让模型写出推理链的下一句，再把这一句当作新的 query 去检索，补充的段落又用来写下一句，直到推理链给出答案或达到步数上限。它不需要预先分解，推理链里自然带出中间实体。论文在 HotpotQA、2WikiMultihopQA、MuSiQue 等数据集上，检索召回最多提升约 21 个点，下游 QA 最多提升约 15 个点。
3. **用第一跳结果改写第二跳 query。** 工程上最常用的折中：第一跳检索后让 LLM 抽出关键实体，拼进原问题重新检索。本质上是 IRCoT 的两步截断版。
4. **Agentic 循环。** 把上面的逻辑交给 Agent：每轮检索后判断“够不够、还缺什么”，缺的变成下一轮 query。最灵活，但延迟和成本不可控。
5. **GraphRAG 的关系遍历。** 离线把实体关系抽成图，多跳变成图上的路径查询，一次搞定；代价是建图成本，适合多跳问题占比很高的语料。

```python
def multi_hop(question, retrieve, rerank, llm, max_hops=3):
    ctx, query = [], question
    for _ in range(max_hops):
        ctx += rerank(retrieve(query), threshold=0.3)
        verdict = llm(f"上下文：{ctx}\n问题：{question}\n"
                      "能回答就输出 ANSWER: ...；否则输出 NEED: 还缺什么")
        if verdict.startswith("ANSWER:"):
            return verdict
        query = verdict.removeprefix("NEED:").strip()
    return llm(f"基于已有上下文尽力回答。上下文：{ctx}\n问题：{question}")
```

## 怎么评估

借鉴 HotpotQA（两跳，标注了支撑事实）和 MuSiQue（2～4 跳，专门设计成不能走捷径）的思路：除了最终答案的 EM/F1，还要看每一跳的支撑文档是否被召回。我会从业务日志里挑出真实的多跳问题，按同样格式标注“中间答案 + 每跳支撑片段”，这样才知道错在第几跳。

## 工程取舍

- **跳数上限**：绝大多数真实问题两到三跳就够，上限设 3，超出就用已收集的上下文尽力回答；
- **延迟**：每跳一次检索加一次 LLM 调用且必须串行，所以只对路由判定为复杂的问题开启多跳；
- **错误级联**：第一跳抽错实体，后面全错。每跳都做 Rerank 并设阈值，低于阈值宁可提前终止，也不要把噪音带进下一跳；
- **上下文膨胀**：每跳累积的片段要去重、截断，只保留和当前子问题相关的部分。

## 可能的追问

- 分解式和迭代式怎么选？问题结构清晰、跳数固定时用分解，互不依赖的子问题还能并发检索；问题开放、不知道要几跳时用 IRCoT 式迭代。
- 长上下文模型能不能代替多跳检索？小语料上把全部文档塞进去可行，但第二跳文档能否被“注意到”仍取决于模型，而且每次都付全量 token 的成本；多跳检索本质上是在帮模型把相关文档聚齐。
